import { Socket } from "socket.io";
import  jwt  from "jsonwebtoken";
import type { SocketData } from "../types/socket.d.ts";



interface tokenPayload {
  id: string;
  role: string;
}

class AuthError extends Error{
  data: any;
  constructor(message:string) {
    super(message);
    this.data = {content: "Please login to access this resource"};
  }
}


export const socketAuthMiddleware = (socket: Socket, next: (err?: any) => void) => {
  const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]?.split(" ")[1];

  if(!token) {
    return next(new AuthError("No token provided"));
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not set; cannot verify token");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as tokenPayload;
    (socket.data as SocketData).userId = decoded.id;
    (socket.data as SocketData).username = "Fetching..."; // temp, replace with actual username if available
    next();

  } catch (error) {
    next(new AuthError(error instanceof Error ? error.message : "Failed to authenticate token"));
  }
}
