import { Server } from "socket.io";
import User from "../models/user.model.ts";
import * as chatService from "../services/chat.service.ts";
import * as roomService from "../services/room.service.ts";
import * as translationService from "../services/translation.service.ts";
import type { ClientToServerInterface, ServerToClientInterface, SocketData } from "../types/socket.d.ts";

type RateEntry = { count: number; resetAt: number };
const perSocketRate = new Map<string, Map<string, RateEntry>>();

// Periodic cleanup sweep for perSocketRate to prevent unbounded growth
setInterval(() => {
  const now = Date.now();
  for (const [socketId, socketMap] of perSocketRate) {
    for (const [key, entry] of socketMap) {
      if (now >= entry.resetAt) {
        socketMap.delete(key);
      }
    }
    if (socketMap.size === 0) {
      perSocketRate.delete(socketId);
    }
  }
}, 5 * 60_000);

const sanitizeMessage = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const hitRateLimit = (socketId: string, key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  let socketMap = perSocketRate.get(socketId);
  if (!socketMap) {
    socketMap = new Map();
    perSocketRate.set(socketId, socketMap);
  }

  const existing = socketMap.get(key);
  if (!existing || now >= existing.resetAt) {
    socketMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existing.count >= limit) {
    return true;
  }

  existing.count += 1;
  return false;
};

export const initializeChatSocket = (io: Server<ClientToServerInterface, ServerToClientInterface, {}, SocketData>) => {
  io.on("connection", async (socket) => {
    const user = await User.findById(socket.data.userId).select("username profilePicture").exec();
    const username = user ? user.username : "Unknown User";
    const profilePicture = user ? user.profilePicture : undefined;

    socket.data.username = username;
    if (profilePicture) {
      socket.data.profilePicture = profilePicture;
    }




    const roomMembers = (room: string) => {
      const ids = Array.from(io.sockets.adapter.rooms.get(room) ?? []);
      return ids.map((id) => {
        const s = io.sockets.sockets.get(id);
        const memberData = {
          id,
          username: String(s?.data?.username ?? 'Anonymous'),
          lang: String(s?.data?.lang ?? 'en'),
          status: 'online' as const,
        } as { id: string; username: string; lang: string; status: 'online'; profilePicture?: string };

        if (s?.data?.profilePicture) {
          memberData.profilePicture = s.data.profilePicture;
        }

        return memberData;
      });
    };

    socket.on("join_Room", async (data) => {
      if (hitRateLimit(socket.id, "join_Room", 20, 60_000)) {
        socket.emit("error_event", { message: "Too many room joins; slow down" });
        return;
      }
      if (!data || typeof data.room !== "string" || data.room.trim().length < 1) {
        socket.emit("error_event", { message: "Invalid room" });
        return;
      }
      // Leave previous room before joining a new one to prevent cross-room message pollution
      const previousRoom = socket.data.room;
      if (previousRoom && previousRoom !== data.room) {
        socket.leave(previousRoom);
        io.to(previousRoom).emit('room_users', roomMembers(previousRoom));
      }

      socket.join(data.room);
      socket.data.username = username;
      socket.data.room = data.room;
      socket.data.lang = typeof data.lang === 'string' && data.lang.trim() ? data.lang : 'en';


      // Add user to persistent room members list
      if (socket.data.userId) {
        await roomService.addMemberToRoom(data.room, socket.data.userId);
      }

      const roomInfo = await roomService.getRoomByName(data.room);
      const isAdmin = roomInfo?.admins.some(
        adminId => adminId.toString() === socket.data.userId
      ) || false;

      if (roomInfo) {
        socket.emit("room_info", {
          name: roomInfo.name,
          mode: roomInfo.mode,
          isAdmin,
        })
      }

      // Fetch and send last 50 messages, translating on-the-fly if needed
      try {
        const messages = await chatService.getRoomHistory(data.room);
        const userLang = socket.data.lang || 'en';

        const translationPromises = messages.map(async (m: any) => {
          const translations = m.translations instanceof Map
            ? Object.fromEntries(m.translations)
            : (m.translations ?? {});
          const reactions = m.reactions instanceof Map
            ? Object.fromEntries(m.reactions)
            : (m.reactions ?? {});

          // On-the-fly translation if the user's language is missing
          if (!translations[userLang] && m.original) {
            try {
              const translated = await translationService.translateSingle(
                m.original,
                m.sourceLocale ?? 'auto',
                userLang,
              );
              if (translated && translated !== m.original) {
                translations[userLang] = translated;
              }
            } catch (err) {
              console.error(`[history] On-the-fly translate error for ${m.msgId}:`, err);
              socket.emit('error_event', { message: 'Translation unavailable. Showing original message.' });
            }
          }

          // Fetch author's profile picture if possible (optimization: could bulk fetch authors)
          const authorUser = await User.findOne({ username: m.author }).select("profilePicture");

          return {
            author: m.author,
            ...(authorUser?.profilePicture ? { authorProfilePicture: authorUser.profilePicture } : {}),
            message: translations[userLang] ?? m.original,
            original: m.original,
            time: (m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt ?? '')),
            msgId: m.msgId,
            lang: m.sourceLocale ?? 'auto',
            translations,
            reactions,
            ...(m.replyTo ? { replyTo: m.replyTo } : {}),
          };
        });

        const payload = await Promise.all(translationPromises);
        socket.emit("room_history", payload);
      } catch (error) {
        console.error("Error fetching room history:", error);
        socket.emit("error_event", { message: "Failed to fetch room history" });
      }

      const occupants = roomMembers(data.room);
      io.to(data.room).emit("room_users", occupants);

      socket.to(data.room).emit("user_joined", {
        message: `${username} joined the room`,
      });
    });

    socket.on('set_language', async (data) => {
      try {
        if (hitRateLimit(socket.id, 'set_language', 30, 60_000)) {
          throw new Error('Too many language changes; slow down');
        }
        if (!data || typeof (data as any).room !== 'string') {
          throw new Error('Invalid room');
        }
        const room = String((data as any).room).trim();
        const lang = typeof (data as any).lang === 'string' && String((data as any).lang).trim()
          ? String((data as any).lang).trim()
          : 'en';

        if (!socket.data.room || socket.data.room !== room) {
          throw new Error('Join the room before changing language');
        }

        socket.data.lang = lang;
        io.to(room).emit('room_users', roomMembers(room));
      } catch (error) {
        socket.emit('error_event', { message: error instanceof Error ? error.message : 'Failed to set language' });
      }
    });

    socket.on("create_room", async (data) => {
      try {
        if (!socket.data.userId) {
          throw new Error("Unauthorized");

        }

        if (hitRateLimit(socket.id, "create_room", 3, 60_000)) {
          throw new Error("Too many room creations; slow down");
        }

        if (!data || typeof data.name !== "string" || data.name.trim().length < 3) {
          throw new Error("Invalid room name");
        }


        const normalizedMode = String(data.mode).toLowerCase() === "native" ? "Native" : "Global";
        await roomService.createRoom(
          data.name,
          socket.data.userId,
          normalizedMode
        );
        socket.emit("room_created", { name: data.name });

      } catch (error) {
        socket.emit("error_event", { message: error instanceof Error ? error.message : "Failed to create room" });
      }
    })

    socket.on("update_room_mode", async (data) => {
      try {
        if (!socket.data.userId) {
          throw new Error("Unauthorized");
        }
        if (hitRateLimit(socket.id, "update_room_mode", 10, 60_000)) {
          throw new Error("Too many settings changes; slow down");
        }

        if (!data || typeof (data as any).room !== "string") {
          throw new Error("Invalid room");
        }
        const room = String((data as any).room).trim();
        if (!room) {
          throw new Error("Room is required");
        }
        if (!socket.data.room || socket.data.room !== room) {
          throw new Error("Join the room before changing settings");
        }

        const modeRaw = String((data as any).mode ?? "").toLowerCase();
        const nextMode: 'Global' | 'Native' = modeRaw === 'native' ? 'Native' : 'Global';

        const roomInfo = await roomService.getRoomByName(room);
        if (!roomInfo) {
          throw new Error("Room not found");
        }

        const isAdmin = roomInfo?.admins.some(
          adminId => adminId.toString() === socket.data.userId
        ) || false;

        if (!isAdmin) {
          throw new Error("Only admins can change room settings");
        }

        const updated = await roomService.updateRoomMode(room, nextMode);

        // Emit room_info individually so each user gets their correct isAdmin flag
        const roomSockets = io.sockets.adapter.rooms.get(room);
        if (roomSockets) {
          for (const sid of roomSockets) {
            const s = io.sockets.sockets.get(sid);
            if (s) {
              const userIsAdmin = roomInfo.admins.some(
                adminId => adminId.toString() === s.data.userId
              );
              s.emit("room_info", {
                name: updated.name,
                mode: updated.mode,
                isAdmin: userIsAdmin,
              });
            }
          }
        }
      } catch (error) {
        socket.emit("error_event", {
          message: error instanceof Error ? error.message : "Failed to update room settings",
        });
      }
    });


    socket.on("send_message", async (data) => {
      try {
        if (!socket.data.userId) {
          throw new Error("Unauthorized");
        }
        if (hitRateLimit(socket.id, "send_message", 20, 10_000)) {
          throw new Error("Too many messages; slow down");
        }

        if (!data || typeof data !== "object") {
          throw new Error("Invalid payload");
        }

        const room = typeof (data as any).room === "string" ? (data as any).room : "";
        if (!room) {
          throw new Error("Room is required");
        }
        if (!socket.data.room || socket.data.room !== room) {
          throw new Error("Join the room before sending messages");
        }

        const rawMessage = typeof (data as any).message === "string" ? (data as any).message : "";
        if (!rawMessage.trim()) {
          throw new Error("Message cannot be empty");
        }
        const message = sanitizeMessage(rawMessage);
        if (message.length > 2000) {
          throw new Error("Message too long");
        }

        const msgId = typeof (data as any).msgId === "string" ? (data as any).msgId : "";
        if (!msgId) {
          throw new Error("msgId is required");
        }

        const sourceLocale = typeof (data as any).sourceLocale === "string" ? (data as any).sourceLocale : "auto";

        const replyToRaw = (data as any).replyTo;
        const replyTo = replyToRaw && typeof replyToRaw === "object"
          ? {
            msgId: String((replyToRaw as any).msgId ?? ""),
            author: String((replyToRaw as any).author ?? ""),
            message: String((replyToRaw as any).message ?? ""),
          }
          : undefined;

        // ── STEP 1: Save immediately with empty translations ──
        const { savedMessage, isGlobalMode } = await chatService.saveMessageFast({
          room,
          author: socket.data.username || "Unknown User",
          message,
          sourceLocale,
          msgId,
          ...(replyTo && replyTo.msgId ? { replyTo } : {}),
        });

        // ── STEP 2: Emit to everyone instantly (original text) ──
        socket.emit('message_status', { msgId: savedMessage.msgId, status: 'sent' });

        io.to(room).emit("receive_message", {
          author: savedMessage.author,
          ...(socket.data.profilePicture ? { authorProfilePicture: socket.data.profilePicture } : {}),
          message: savedMessage.original,
          original: savedMessage.original,
          time: savedMessage.createdAt.toISOString(),
          msgId: savedMessage.msgId,
          lang: savedMessage.sourceLocale,
          translations: {},
          ...(savedMessage.replyTo ? { replyTo: savedMessage.replyTo } : {}),
          reactions: {},
        });

        // ── STEP 3: Translate in background, stream translations as they arrive ──
        if (isGlobalMode) {
          chatService.translateAndUpdate(
            savedMessage.msgId,
            room,
            message,
            sourceLocale,
            (lang, translated) => {
              // Stream individual translation chunk immediately
              io.to(room).emit("translations_ready", {
                msgId: savedMessage.msgId,
                translations: { [lang]: translated },
              });
            }
          ).then((finalTranslations) => {
            // Optional: emit final complete set just in case, or rely on chunks.
            // Since we streamed chunks, clients should be up to date.
            // But we can log success.
          }).catch((err) => {
            console.error(`[chat] Background translation failed for ${savedMessage.msgId}:`, err);
            socket.emit("error_event", {
              message: "Translation unavailable. Showing original message.",
            });
          });
        }
      } catch (error) {
        console.error("Error while sending message:", error);
        const msgId = (data && typeof (data as any).msgId === 'string') ? (data as any).msgId : '';
        if (msgId) {
          socket.emit('message_status', {
            msgId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Failed to send message',
          });
        }
        socket.emit("error_event", {
          message: error instanceof Error ? error.message : "Failed to send message",
        });
      }
    });

    socket.on('add_reaction', async (data) => {
      try {
        if (!socket.data.userId) {
          throw new Error('Unauthorized');
        }
        if (hitRateLimit(socket.id, 'add_reaction', 60, 60_000)) {
          throw new Error('Too many reactions; slow down');
        }

        const room = typeof (data as any).room === 'string' ? String((data as any).room).trim() : '';
        const msgId = typeof (data as any).msgId === 'string' ? String((data as any).msgId).trim() : '';
        const emoji = typeof (data as any).emoji === 'string' ? String((data as any).emoji).trim() : '';

        if (!room || !msgId || !emoji) {
          throw new Error('Invalid reaction payload');
        }
        if (!socket.data.room || socket.data.room !== room) {
          throw new Error('Join the room before reacting');
        }

        const message = await chatService.getMessageByMsgId(room, msgId);
        if (!message) {
          throw new Error('Message not found');
        }

        const username = socket.data.username || 'Anonymous';

        // Toggle the user in emoji list
        const current = message.reactions?.get(emoji) ?? [];
        const next = current.includes(username)
          ? current.filter((u) => u !== username)
          : [...current, username];

        message.reactions = message.reactions ?? new Map();
        message.reactions.set(emoji, next);

        await message.save();

        const reactionsObj = message.reactions instanceof Map
          ? Object.fromEntries(message.reactions)
          : (message.reactions ?? {});

        io.to(room).emit('reaction_update', { msgId, reactions: reactionsObj });
      } catch (error) {
        socket.emit('error_event', {
          message: error instanceof Error ? error.message : 'Failed to add reaction',
        });
      }
    });

    socket.on("leave_room", (data) => {
      if (!data || typeof data.room !== "string") return;
      const room = data.room.trim();
      if (!room) return;

      socket.leave(room);
      if (socket.data.room === room) {
        socket.data.room = "";
      }
      io.to(room).emit('room_users', roomMembers(room));
    });

    // ── Typing Indicators (pure relay, no DB) ──
    socket.on("typing_start", (data) => {
      if (socket.data.room) {
        const author = typeof (data as any)?.author === "string"
          ? (data as any).author
          : socket.data.username;
        socket.to(socket.data.room).emit("user_typing", { author, isTyping: true });
      }
    });

    socket.on("typing_stop", (data) => {
      if (socket.data.room) {
        const author = typeof (data as any)?.author === "string"
          ? (data as any).author
          : socket.data.username;
        socket.to(socket.data.room).emit("user_typing", { author, isTyping: false });
      }
    });

    socket.on("disconnect", () => {
      perSocketRate.delete(socket.id);
      if (socket.data.room) {
        io.to(socket.data.room).emit('room_users', roomMembers(socket.data.room));
      }

    });
  });
};
