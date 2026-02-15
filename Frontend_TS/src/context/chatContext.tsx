import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import type { ClientToServerInterface, ServerToClientInterface } from "../types/socket";
import { useAuth } from "./AuthContext";


// Force the sockets to accept the strict types
type TypedSocket = Socket<ServerToClientInterface, ClientToServerInterface>;

interface ChatContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const newSocket: TypedSocket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setSocket(newSocket);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on("connect_error", (err: unknown) => {
      const message = err instanceof Error ? err.message : "Failed to connect";
      console.error("Socket connect_error:", err);
      setIsConnected(false);
      setConnectionError(message);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      setSocket((prev) => (prev === newSocket ? null : prev));
    });

    // Server domain errors (e.g. validation) should NOT flip connection state.
    // UI components can subscribe to `error_event` directly for display.
    newSocket.on("error_event", (err) => {
      console.error("Socket error_event:", err);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  return (
    <ChatContext.Provider value={{ socket, isConnected, connectionError }}>
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
