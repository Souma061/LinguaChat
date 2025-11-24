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

  const socketMethodsRef = useRef(null);


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
        console.log("Received Message:", data);

        const finalMessage = {
          ...data,
          time: formatTime(new Date()),
        };

        if (data.author === userName && data.msgId) {
          setMessages((prev) => {
            const filtered = prev.filter((msg) => msg.msgId !== data.msgId);
            return [...filtered, finalMessage];
          });
        } else {
          setMessages((prev) => [...prev, finalMessage]);
        }

        setStatus({ text: `New message from ${data.author}`, tone: "info" });
      },
      [userName]
    ),

    onRoomHistory: useCallback((history) => {
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
      console.log(`Message ${msgId} status: ${status}`);

      // Update message status in the messages array
      setMessages((prev) =>
        prev.map((msg) =>
          msg.msgId === msgId
            ? { ...msg, status, error }
            : msg
        )
      );

      // Show error toast if message failed
      if (status === 'failed') {
        setStatus({
          text: `Failed to send message: ${error}`,
          tone: 'error',
        });
      }
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

      // ADD TO UI instantly with pending status
      setMessages((prev) => [...prev, data]);

      // SEND TO SERVER
      socketMethodsRef.current.sendMessage(data);
    },
    [userName, room, lang, isConnected]
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

    joinChatRoom,
    sendChatMessage,
    retryMessage,
    changeLanguage,
    leaveRoom,
    startDemoMode,
    setStatus,

    getSocket: socketMethods.getSocket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
