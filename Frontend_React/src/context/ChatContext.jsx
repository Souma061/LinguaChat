import { createContext, useCallback, useEffect, useRef, useState } from "react";
import useSocket from "../hooks/useSocket";
import { DEMO_MESSAGES, formatTime, generateMessageid } from "../utils/helper";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [userName, setUserName] = useState("");
  const [room, setRoom] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [lang, setLang] = useState("en");
  const [isJoined, setIsJoined] = useState(false);
  const [status, setStatus] = useState({ text: "Connecting...", tone: "info" });
  const [isConnected, setIsConnected] = useState(false);
  const [repliedToMessage, setRepliedToMessage] = useState(null);

  const socketMethodsRef = useRef(null);

  // Show notification when user selects a message to reply to
  useEffect(() => {
    if (repliedToMessage) {
      const preview = repliedToMessage.message.substring(0, 35);
      // Use setTimeout to avoid cascading renders
      const timer = setTimeout(() => {
        setStatus({
          text: `↩️ Replying to ${repliedToMessage.author}: ${preview}${repliedToMessage.message.length > 35 ? '...' : ''}`,
          tone: "info"
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [repliedToMessage]);


  const socketHandlers = {
    onConnect: useCallback(
      () => {
        console.log("Connected to server");
        setIsConnected(true);

        // Rejoin on refresh/reconnect
        if (isJoined && room && userName && socketMethodsRef.current) {
          socketMethodsRef.current.setUsername(userName);
          socketMethodsRef.current.joinRoom(room, lang);
          setStatus({ text: `Reconnected to ${room}`, tone: "success" });
        } else {
          setStatus({ text: "Connected. Please join a room.", tone: "info" });
        }
      },
      [isJoined, room, userName, lang]
    ),

    onDisconnect: useCallback(() => {
      console.log("Disconnected from server");
      setIsConnected(false);
      setStatus({
        text: "Disconnected. Attempting to reconnect...",
        tone: "error",
      });
    }, []),

    onReconnectAttempt: useCallback(() => {
      console.log("Reconnecting...");
      setStatus({ text: "Reconnecting to server...", tone: "info" });
    }, []),

    onReconnect: useCallback(() => {
      setIsConnected(true);
      setStatus({ text: "Reconnected to server.", tone: "success" });
    }, []),

    onConnectionError: useCallback(() => {
      setStatus({ text: "Connection error. Retrying...", tone: "error" });
    }, []),

    onReceiveMessage: useCallback(
      (data) => {
        console.log("📨 Received Message from server:", data);

        const finalMessage = {
          ...data,
          time: formatTime(new Date()),
          status: 'sent', // Message received from server is confirmed sent
        };

        if (data.author === userName && data.msgId) {
          setMessages((prev) => {
            // Find the existing message with this msgId
            const existingIndex = prev.findIndex((msg) => msg.msgId === data.msgId);

            if (existingIndex !== -1) {
              // Update existing message with server version, keeping status as 'sent'
              console.log(`  🔄 Updating message ${data.msgId} to 'sent' (received from server)`);
              const updated = [...prev];
              updated[existingIndex] = finalMessage;
              return updated;
            } else {
              // New message from self, add it with sent status
              console.log(`  ➕ New message ${data.msgId} from self, received from server with status: "sent"`);
              return [...prev, finalMessage];
            }
          });
        } else {
          setMessages((prev) => [...prev, finalMessage]);
        }

        // Show contextual notification - different for own messages vs others
        if (data.author === userName) {
          setStatus({ text: "✅ Message sent", tone: "success" });
        } else {
          // Show new message notification like WhatsApp
          const preview = data.message.substring(0, 40);
          setStatus({
            text: `💬 ${data.author}: ${preview}${data.message.length > 40 ? '...' : ''}`,
            tone: "info"
          });
        }
      },
      [userName]
    ),    onRoomHistory: useCallback((history) => {
      const formatted = history.map((msg) => ({
        ...msg,
        time: msg.time || formatTime(new Date()),
      }));

      setMessages(formatted);

      if (history.length > 0) {
        setStatus({
          text: `Loaded ${history.length} previous messages`,
          tone: "info",
        });
      }
    }, []),

    onRoomUsers: useCallback((userList) => {
      console.log("Room users:", userList);
      setUsers(userList);
    }, []),

    onMessageStatus: useCallback((statusData) => {
      const { msgId, status, error } = statusData;
      console.log(`✅ Server confirmed message ${msgId} status: ${status}`);

      // Only update status if it's an error, otherwise wait for onReceiveMessage
      if (status === 'failed') {
        console.log(`  ❌ Message ${msgId} failed to save`);

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.msgId === msgId) {
              return { ...msg, status: 'failed', error };
            }
            return msg;
          })
        );

        // Show error notification with emoji
        setTimeout(() => {
          setStatus({
            text: `❌ Failed to send: ${error || 'Unknown error'}`,
            tone: 'error',
          });
        }, 100);
      }
      // For 'sent' status, we wait for onReceiveMessage to come back
    }, []),

    onTranslationError: useCallback((msg) => {
      console.error("Translation error:", msg);

      setStatus({ text: `Translation error: ${msg}`, tone: "error" });

      setMessages((prev) => [
        ...prev,
        {
          type: "system",
          message: "Translation error: " + msg,
          time: formatTime(new Date()),
        },
      ]);
    }, []),
  };

  /** INIT SOCKET */
  const socketMethods = useSocket(socketHandlers);

  useEffect(() => {
    socketMethodsRef.current = socketMethods;
  }, [socketMethods]);

  const joinChatRoom = useCallback((roomName, username, language) => {
    setUserName(username);
    setRoom(roomName);
    setLang(language);

    if (socketMethodsRef.current) {
      socketMethodsRef.current.setUsername(username);
      socketMethodsRef.current.joinRoom(roomName, language);
    }

    setIsJoined(true);
    setStatus({ text: `Joined room ${roomName}`, tone: "success" });
  }, []);


  const sendChatMessage = useCallback(
    (message, sourceLang = "auto") => {
      if (!message.trim() || !isConnected || !socketMethodsRef.current) return;

      const msgId = generateMessageid(userName);
      const time = formatTime(new Date());

      const data = {
        room,
        author: userName,
        message: message.trim(),
        lang,
        targetLang: lang,
        sourceLang,
        msgId,
        time,
        status: 'pending', // Add status field
      };

      // Add replyTo data if replying to a message
      if (repliedToMessage) {
        data.replyTo = {
          msgId: repliedToMessage.msgId,
          author: repliedToMessage.author,
          message: repliedToMessage.message,
        };

        // Show notification that message was sent as a reply
        setStatus({
          text: `📝 Replied to ${repliedToMessage.author}`,
          tone: "info"
        });
      }

      console.log('📤 Sending message with pending status:', data);

      // ADD TO UI instantly with pending status
      setMessages((prev) => {
        console.log('📝 Adding pending message to state');
        const updated = [...prev, data];
        console.log('📝 Messages after add:', updated.map(m => ({ msgId: m.msgId, status: m.status })));
        return updated;
      });

      // Clear reply selection after sending
      if (repliedToMessage) {
        setRepliedToMessage(null);
      }

      // SEND TO SERVER
      socketMethodsRef.current.sendMessage(data);
    },
    [userName, room, lang, isConnected, repliedToMessage]
  );

  const retryMessage = useCallback(
    (failedMessage) => {
      if (!isConnected || !socketMethodsRef.current) {
        setStatus({ text: "Not connected. Cannot retry.", tone: "error" });
        return;
      }

      // Update the message status to pending and resend
      const retryData = {
        ...failedMessage,
        status: 'pending',
        time: formatTime(new Date()),
      };

      // Update message in UI with pending status
      setMessages((prev) =>
        prev.map((msg) =>
          msg.msgId === failedMessage.msgId ? retryData : msg
        )
      );

      // Resend to server
      socketMethodsRef.current.sendMessage(retryData);
      setStatus({ text: "Retrying message...", tone: "info" });
    },
    [isConnected]
  );


  const changeLanguage = useCallback(
    (newLang) => {
      setLang(newLang);
      if (isJoined && room && socketMethodsRef.current) {
        socketMethodsRef.current.setLanguage(room, newLang);
      }
    },
    [isJoined, room]
  );


  const leaveRoom = useCallback(() => {
    setUserName("");
    setRoom("");
    setMessages([]);
    setUsers([]);
    setLang("en");
    setIsJoined(false);
    setStatus({ text: "Left the room.", tone: "info" });
  }, []);

  const startDemoMode = useCallback(() => {
    setTimeout(() => {
      const demoMsgs = DEMO_MESSAGES.map((msg, index) => ({
        ...msg,
        time: formatTime(new Date(Date.now() - (DEMO_MESSAGES.length - index) * 2000)),
        msgId: `demo-${index}`,
      }));
      setMessages(demoMsgs);
    }, 1200);
  }, []);

  const value = {
    userName,
    room,
    lang,
    isJoined,
    messages,
    users,
    status,
    isConnected,
    repliedToMessage,

    joinChatRoom,
    sendChatMessage,
    retryMessage,
    changeLanguage,
    leaveRoom,
    startDemoMode,
    setStatus,

    getSocket: socketMethods.getSocket,
    setRepliedToMessage,
    clearReply: () => setRepliedToMessage(null),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
