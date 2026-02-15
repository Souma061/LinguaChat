import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import type { ClientToServerInterface, ServerToClientInterface } from "../types/socket";


// Force the sockets to accept the strict types
type TypedSocket = Socket<ServerToClientInterface,ClientToServerInterface>;

interface ChatContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({children}: {children: ReactNode}) => {
  const { token, user } = useAuth();
  const [socket, setSocket]  = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const newSocket: TypedSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: {token},
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setSocket(newSocket);
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setSocket((prev) => (prev === newSocket ? null : prev));
    });

    // global error handler for socket connection issues
    newSocket.on("error_event", (err) => {
      console.error("Socket error:", err);
      setIsConnected(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <ChatContext.Provider value={{socket, isConnected}}>
      {children}
    </ChatContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used inside ChatProvider");
  }
  return ctx;
};
