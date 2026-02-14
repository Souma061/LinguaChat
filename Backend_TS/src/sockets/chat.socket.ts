import { Server } from "socket.io";
import User from "../models/user.model.ts";
import * as chatService from "../services/chat.service.ts";
import * as roomService from "../services/rom.service.ts";
import type { ClientToServerInterface, ServerToClientInterface, SocketData } from "../types/socket.d.ts";

type RateEntry = { count: number; resetAt: number };
const perSocketRate = new Map<string, Map<string, RateEntry>>();

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
    const user = await User.findById(socket.data.userId).select("username").exec();
    const username = user ? user.username : "Unknown User";

    socket.data.username = username;


    console.log(`User Connected ${socket.id}`);

    socket.on("join_Room", async (data) => {
      if (hitRateLimit(socket.id, "join_Room", 20, 60_000)) {
        socket.emit("error_event", { message: "Too many room joins; slow down" });
        return;
      }
      if (!data || typeof data.room !== "string" || data.room.trim().length < 1) {
        socket.emit("error_event", { message: "Invalid room" });
        return;
      }
      socket.join(data.room);
      socket.data.username = username;
      socket.data.room = data.room;
      socket.data.lang = data.lang;
      console.log(`User ${socket.data.username} joined room ${data.room} with language ${data.lang}`);

      const roomInfo = await roomService.getRoomByName(data.room);
      const isAdmin = roomInfo?.admins.some(
        adminId => adminId.toString() === socket.data.userId
      ) || false;

      if (roomInfo) {
        socket.emit("room_info", {
          name: roomInfo.name,
          mode: roomInfo.mode,
          isAdmin: isAdmin, // Determine if the user is an admin based on room info and socket data
        })
      }

      // Fetch and send last 50 messages of the room
      try {
        const messages = await chatService.getRoomHistory(data.room);
        socket.emit("room_history", messages);
      } catch (error) {
        console.error("Error fetching room history:", error);
        socket.emit("error_event", { message: "Failed to fetch room history" });
      }

      io.to(data.room).emit("user_joined", {
        message: "Anonymous", // temp
      });
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

    // socket.on("send_message", async (data) => {
    //   try {
    //     const messageData: Parameters<typeof chatService.saveMessage>[0] = {
    //       room: data.room,
    //       author: data.author,
    //       message: data.message,
    //       sourceLang: data.sourceLocale,
    //       msgId: data.msgId,
    //     };

    //     if (data.replyTo) {
    //       messageData.replyTo = data.replyTo;
    //     }

    //     const savedMessage = await chatService.saveMessage(messageData);

    //     const messagePayload: {
    //       author: string;
    //       message: string;
    //       original: string;
    //       time: string;
    //       msgId: string;
    //       lang: string;
    //       reactions: Record<string, any>;
    //       replyTo?: {
    //         msgId: string;
    //         author: string;
    //         message: string;
    //       };
    //     } = {
    //       author: savedMessage.author,
    //       message: savedMessage.original,
    //       original: savedMessage.original,
    //       time: savedMessage.createdAt.toISOString(),
    //       msgId: savedMessage.msgId,
    //       lang: savedMessage.sourceLocale,
    //       reactions: {},
    //     };

    //     if (savedMessage.replyTo) {
    //       messagePayload.replyTo = savedMessage.replyTo;
    //     }

    //     io.to(data.room).emit("receive_message", messagePayload);
    //   } catch (error) {
    //     console.error("Error saving message:", error);
    //   }
    // });

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

        const message = typeof (data as any).message === "string" ? (data as any).message : "";
        if (!message.trim()) {
          throw new Error("Message cannot be empty");
        }
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

        const savedMessage = await chatService.saveMessage({
          room,
          author: socket.data.username || "Unknown User",
          message,
          sourceLocale,
          msgId,
          ...(replyTo && replyTo.msgId ? { replyTo } : {}),
        });

        const translations = savedMessage.translations instanceof Map
          ? Object.fromEntries(savedMessage.translations)
          : (savedMessage.translations ?? {});

        io.to(data.room).emit("receive_message", {
          author: savedMessage.author,
          message: savedMessage.original, // Default to original
          original: savedMessage.original,
          time: savedMessage.createdAt.toISOString(),
          msgId: savedMessage.msgId,
          lang: savedMessage.sourceLocale,
          translations,
          ...(savedMessage.replyTo ? { replyTo: savedMessage.replyTo } : {}),
          reactions: {},
        });
      } catch (error) {
        console.error("Error while sending message:", error);
        socket.emit("error_event", {
          message: error instanceof Error ? error.message : "Failed to send message",
        });
      }
    });


    socket.on("disconnect", () => {
      perSocketRate.delete(socket.id);
      console.log(`User Disconnected ${socket.id}`);
    });
  });
};
