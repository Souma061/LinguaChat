import { ArrowLeft, Globe, DotsThreeVertical as MoreVertical, PaperPlaneRight as Send, SpeakerHigh, SpeakerSlash, Users, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { EmojiPicker, EmojiToggleButton } from "../../components/EmojiPicker";
import type { MessageData } from "../../components/MessageBubble";
import MessageBubble from "../../components/MessageBubble";
import ThemeToggle from "../../components/ThemeToggle";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/chatContext";

type LangCode = "en" | "hi" | "bn" | "es" | "fr" | "de" | "ja";

const LANG_OPTIONS: { code: LangCode; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "bn", label: "Bengali" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
];

interface RoomUser {
  id: string;
  username: string;
  lang: string;
  status: "online";
}

const RoomPage = () => {
  const { roomId: rawRoomId } = useParams<{ roomId: string }>();
  const roomId = rawRoomId ? decodeURIComponent(rawRoomId) : undefined;
  const navigate = useNavigate();
  const { socket, isConnected, connectionError } = useChat();
  const { user } = useAuth();

  const [messages, setMessages] = useState<MessageData[]>([]);
  const [input, setInput] = useState("");
  const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
  const [isNativeMode, setIsNativeMode] = useState(false);
  const [roomMode, setRoomMode] = useState<"Global" | "Native">("Global");
  const [lastError, setLastError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [myLang, setMyLang] = useState<LangCode>(() => {
    const stored = localStorage.getItem("linguachat.lang");
    if (stored && LANG_OPTIONS.some((o) => o.code === stored)) {
      return stored as LangCode;
    }
    const nav = (navigator.language || "en").toLowerCase();
    const base = nav.split("-")[0] as LangCode;
    return LANG_OPTIONS.some((o) => o.code === base) ? base : "en";
  });

  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem("linguachat.sound") !== "false";
  });
  const isSoundEnabledRef = useRef(isSoundEnabled);

  const toggleSound = () => {
    setIsSoundEnabled((prev) => {
      const next = !prev;
      isSoundEnabledRef.current = next;
      localStorage.setItem("linguachat.sound", String(next));
      return next;
    });
  };

  const [replyTo, setReplyTo] = useState<{
    msgId: string;
    author: string;
    message: string;
  } | null>(null);

  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTypingRef = useRef(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastError(connectionError);
  }, [connectionError]);

  // Close settings dropdown on outside click
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!socket) return;

    const onErrorEvent = (err: { message?: string } | null) => {
      if (err?.message) setLastError(err.message);
    };

    socket.on("error_event", onErrorEvent);
    return () => {
      socket.off("error_event", onErrorEvent);
    };
  }, [socket]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messageEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getOriginalText = useCallback(
    (msg: MessageData) => msg.original || msg.message || "",
    [],
  );

  const getDisplayText = useCallback(
    (msg: MessageData) => {
      if (roomMode === "Native" || isNativeMode) {
        return getOriginalText(msg);
      }
      return (
        msg.translations?.[myLang] ||
        msg.translations?.["en"] ||
        msg.message ||
        getOriginalText(msg)
      );
    },
    [getOriginalText, isNativeMode, myLang, roomMode],
  );

  const getTimeLabel = useCallback((raw: string) => {
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }, []);

  const scrollToMessage = useCallback((msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add(
        "ring-2",
        "ring-indigo-400",
        "ring-offset-2",
        "dark:ring-offset-gray-950",
      );
      setTimeout(() => {
        el.classList.remove(
          "ring-2",
          "ring-indigo-400",
          "ring-offset-2",
          "dark:ring-offset-gray-950",
        );
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (!socket || !roomId || !user || !isConnected) return;

    socket.emit("join_Room", { room: roomId, lang: myLang });

    const onRoomHistory = (history: MessageData[]) => {
      setMessages(history);
      scrollToBottom("auto");
    };

    const onReceiveMessage = (msg: MessageData) => {
      setMessages((prev) => [...prev, msg]);

      // Play sound only if enabled, not my message, and window is not focused
      if (
        isSoundEnabledRef.current &&
        msg.author !== user?.username &&
        (document.hidden || !document.hasFocus())
      ) {
        try {
          const audio = new Audio(
            "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3"
          );
          audio.volume = 0.4;
          audio.play().catch(() => {
            // Context might prevent autoplay if not interacted
          });
        } catch (e) {
          // ignore audio errors
        }
      }
    };

    const onUserJoined = () => {
      // Handle user joined event
    };

    const onRoomUsers = (users: RoomUser[]) => {
      setRoomUsers(Array.isArray(users) ? users : []);
    };

    const onRoomInfo = (info: { mode: "Global" | "Native" }) => {
      const next = info as unknown as {
        name?: string;
        mode: "Global" | "Native";
        isAdmin?: boolean;
      };
      setRoomMode(next.mode);
      setIsNativeMode(next.mode === "Native");
      setIsAdmin(Boolean(next.isAdmin));
    };

    // Async translations arrive after the initial message
    const onTranslationsReady = (data: {
      msgId: string;
      translations: Record<string, string>;
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.msgId === data.msgId
            ? {
              ...msg,
              translations: { ...msg.translations, ...data.translations },
            }
            : msg,
        ),
      );
    };

    // Reaction updates from other users
    const onReactionUpdate = (data: {
      msgId: string;
      reactions: Record<string, string[]>;
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.msgId === data.msgId
            ? { ...msg, reactions: data.reactions }
            : msg,
        ),
      );
    };

    // Typing indicators
    const onUserTyping = (data: { author: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.indexOf(data.author) === -1
            ? [...prev, data.author]
            : prev;
        } else {
          return prev.filter((u) => u !== data.author);
        }
      });

      // Auto-clear typing after 5s (safety net)
      if (data.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== data.author));
        }, 5000);
      }
    };

    socket.on("room_history", onRoomHistory);
    socket.on("receive_message", onReceiveMessage);
    socket.on("user_joined", onUserJoined);
    socket.on("room_users", onRoomUsers);
    socket.on("room_info", onRoomInfo);
    socket.on("translations_ready", onTranslationsReady);
    socket.on("reaction_update", onReactionUpdate);
    socket.on("user_typing", onUserTyping);

    return () => {
      socket.off("room_history", onRoomHistory);
      socket.off("receive_message", onReceiveMessage);
      socket.off("user_joined", onUserJoined);
      socket.off("room_users", onRoomUsers);
      socket.off("room_info", onRoomInfo);
      socket.off("translations_ready", onTranslationsReady);
      socket.off("reaction_update", onReactionUpdate);
      socket.off("user_typing", onUserTyping);

      if (roomId) {
        socket.emit("leave_room", { room: roomId });
      }
    };
  }, [myLang, roomId, scrollToBottom, socket, user, isConnected]);

  const handleChangeLanguage = useCallback(
    (next: LangCode) => {
      setMyLang(next);
      localStorage.setItem("linguachat.lang", next);
      if (!socket || !isConnected || !roomId) return;
      socket.emit("set_language", { room: roomId, lang: next });
    },
    [isConnected, roomId, socket],
  );

  // Auto-detect source language from text
  const detectSourceLanguage = useCallback((text: string): string => {
    if (!text || typeof text !== "string") return "auto";

    const patterns: Record<string, RegExp> = {
      hi: /[\u0900-\u097F]/,
      bn: /[\u0980-\u09FF]/,
      es: /[ñáéíóúü¡¿]/i,
      fr: /[àâçéèêëîïôûùüÿœæ]/i,
      de: /[äöüß]/i,
      ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/,
    };

    for (const [lang, regex] of Object.entries(patterns)) {
      if (regex.test(text)) return lang;
    }

    return "auto";
  }, []);

  const handleInputChange = useCallback(
    (text: string) => {
      setInput(text);

      if (!socket || !isConnected || !roomId) return;

      // Emit typing_start only once
      if (!isTypingRef.current && text.trim()) {
        isTypingRef.current = true;
        socket.emit("typing_start", {
          room: roomId,
          author: user?.username || "Anonymous",
        });
      }

      // Reset the "stop" timer on every keystroke
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          socket.emit("typing_stop", {
            room: roomId,
            author: user?.username || "Anonymous",
          });
        }
      }, 3000);
    },
    [socket, isConnected, roomId, user],
  );

  const handleSend = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;
      if (!roomId) {
        setLastError("Missing room id");
        return;
      }
      if (!socket || !isConnected) {
        setLastError("Socket not connected. Please re-login or refresh.");
        return;
      }

      setLastError(null);

      // Stop typing indicator
      if (isTypingRef.current) {
        isTypingRef.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit("typing_stop", {
          room: roomId,
          author: user?.username || "Anonymous",
        });
      }

      const sourceLocale = detectSourceLanguage(input.trim());

      socket.emit("send_message", {
        room: roomId,
        author: user?.username || "Anonymous",
        message: input,
        sourceLocale,
        msgId: `${Date.now()}-${Math.random()}`,
        ...(replyTo ? { replyTo } : {}),
      });
      setInput("");
      setReplyTo(null);
      setIsEmojiOpen(false);
    },
    [input, roomId, socket, isConnected, user, replyTo, detectSourceLanguage],
  );

  const handleReact = useCallback(
    (msgId: string, emoji: string) => {
      if (!socket || !isConnected || !roomId) return;
      socket.emit("add_reaction", { room: roomId, msgId, emoji });
    },
    [socket, isConnected, roomId],
  );

  const handleReply = useCallback(
    (msg: MessageData) => {
      setReplyTo({
        msgId: msg.msgId,
        author: msg.author,
        message: getDisplayText(msg),
      });
      inputRef.current?.focus();
    },
    [getDisplayText],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend(e as unknown as React.FormEvent);
      }
    },
    [handleSend],
  );

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const roomTitle = useMemo(() => roomId || "Room", [roomId]);

  const handleToggleRoomMode = useCallback(() => {
    if (!roomId) {
      setLastError("Missing room id");
      return;
    }
    if (!socket || !isConnected) {
      setLastError("Socket not connected. Please refresh or login again.");
      return;
    }
    if (!isAdmin) {
      setLastError("Only admins can change room settings");
      return;
    }

    const nextMode: "Global" | "Native" =
      roomMode === "Global" ? "Native" : "Global";
    socket.emit("update_room_mode", { room: roomId, mode: nextMode });
    setIsSettingsOpen(false);
  }, [isAdmin, isConnected, roomId, roomMode, socket]);

  const typingDisplay = useMemo(() => {
    if (typingUsers.length === 0) return null;
    if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
    if (typingUsers.length === 2)
      return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
    return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  }, [typingUsers]);

  const getDateLabel = useCallback((timeStr: string) => {
    if (!timeStr) return "";
    const d = new Date(timeStr);
    if (Number.isNaN(d.getTime())) return "";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const shouldShowDate = useCallback(
    (idx: number) => {
      if (idx === 0) return true;
      const prev = messages[idx - 1]?.time;
      const curr = messages[idx]?.time;
      if (!prev || !curr) return false;
      return getDateLabel(prev) !== getDateLabel(curr);
    },
    [messages, getDateLabel],
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center px-4 justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {roomTitle}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${roomMode === "Global"
                  ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800"
                  : "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800"
                  }`}
              >
                {roomMode}
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {isConnected ? `${roomUsers.length} online` : "Disconnected"}
            </p>
            {lastError && (
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-55">
                {lastError}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {roomMode === "Global" && (
            <button
              onClick={() => setIsNativeMode(!isNativeMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!isNativeMode
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
            >
              <Globe className="h-3 w-3" />
              {!isNativeMode ? "Translated" : "Original"}
            </button>
          )}

          <ThemeToggle />

          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setIsSettingsOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              aria-label="Room settings"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {isSettingsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg overflow-hidden z-20">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Notifications
                    </span>
                    <button
                      onClick={toggleSound}
                      className={`p-1.5 rounded-lg transition-colors ${isSoundEnabled
                        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      title={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
                    >
                      {isSoundEnabled ? (
                        <SpeakerHigh className="h-4 w-4" />
                      ) : (
                        <SpeakerSlash className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    My language
                  </div>
                  <select
                    value={myLang}
                    onChange={(e) =>
                      handleChangeLanguage(e.target.value as LangCode)
                    }
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200 px-3 py-2"
                  >
                    {LANG_OPTIONS.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={handleToggleRoomMode}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 border-t border-gray-200 dark:border-gray-800"
                  >
                    Switch room to {roomMode === "Global" ? "Native" : "Global"}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {messages.map((msg, idx) => {
          const isMe = msg.author === user?.username;
          const showAvatar =
            idx === 0 || messages[idx - 1].author !== msg.author;

          return (
            <div key={msg.msgId || idx}>
              {shouldShowDate(idx) && (
                <div className="flex items-center justify-center my-4">
                  <span className="px-3 py-1 rounded-full bg-gray-200/70 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {getDateLabel(msg.time)}
                  </span>
                </div>
              )}

              <MessageBubble
                msg={msg}
                isMe={isMe}
                showAvatar={showAvatar}
                displayText={getDisplayText(msg)}
                timeLabel={getTimeLabel(msg.time)}
                onReply={handleReply}
                onReact={handleReact}
                currentUser={user?.username}
                onScrollToMessage={scrollToMessage}
              />
            </div>
          );
        })}
        <div ref={messageEndRef} />
      </div>

      {typingDisplay && (
        <div className="px-4 pb-1">
          <div className="max-w-4xl mx-auto">
            <span className="text-xs text-gray-400 dark:text-gray-500 italic flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
              {typingDisplay}
            </span>
          </div>
        </div>
      )}

      {replyTo && (
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 pt-2">
          <div className="max-w-4xl mx-auto flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 border-l-4 border-indigo-500">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 block">
                Replying to {replyTo.author}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate block">
                {replyTo.message}
              </span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-2 border border-transparent focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
          <div className="relative">
            <EmojiToggleButton
              isOpen={isEmojiOpen}
              onClick={() => setIsEmojiOpen((v) => !v)}
            />
            <EmojiPicker
              isOpen={isEmojiOpen}
              onSelect={handleEmojiSelect}
              onClose={() => setIsEmojiOpen(false)}
            />
          </div>

          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${roomMode === "Global" ? "(Translating to everyone...)" : ""}`}
            className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:shadow-none shadow-none ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-none overflow-y-auto leading-5 p-0 m-0"
            style={{ maxHeight: "120px", boxShadow: "none" }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || !isConnected || !socket}
            className="p-2 rounded-lg bg-indigo-600 text-white shadow-md disabled:opacity-50 disabled:shadow-none hover:bg-indigo-700 transition-all active:scale-95 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
