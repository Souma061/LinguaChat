import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import type { SocketData } from "../types/socket.d.ts";



interface tokenPayload {
  id: string;
  role: string;
}

class AuthError extends Error {
  data: any;
  constructor(message: string) {
    super(message);
    this.data = { content: "Please login to access this resource" };
  }
}



export const socketAuthMiddleware = (socket: Socket, next: (err?: any) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]?.split(" ")[1];

  console.log(`[Socket] 🔒 Authenticating socket ${socket.id}...`);

  if (!token) {
    console.error(`[Socket] ❌ No token provided for socket ${socket.id}`);
    return next(new AuthError("No token provided"));
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error("[Socket] ❌ JWT_SECRET is missing");
      throw new Error("JWT_SECRET is not set; cannot verify token");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as tokenPayload;
    (socket.data as SocketData).userId = decoded.id;
    (socket.data as SocketData).username = "Fetching..."; // temp, replace with actual username if available

    console.log(`[Socket] ✅ User ${decoded.id} authenticated on socket ${socket.id}`);
    next();

  } catch (error) {
    console.error(`[Socket] ❌ Auth failed for socket ${socket.id}:`, error instanceof Error ? error.message : error);
    next(new AuthError(error instanceof Error ? error.message : "Failed to authenticate token"));
  }
}
