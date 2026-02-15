import dotenv from "dotenv";
dotenv.config();

import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";
import { socketAuthMiddleware } from "./middlewares/socketAuth.middleware.ts";
import { initializeChatSocket } from "./sockets/chat.socket.ts";
import type { ClientToServerInterface, ServerToClientInterface, SocketData } from "./types/socket.d.ts";

const PORT = process.env.PORT || 5000;
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://localhost:5175")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

console.log("Allowed CORS Origins:", corsOrigins);

const httpServer = createServer(app);

const io = new Server<ClientToServerInterface, ServerToClientInterface, {}, SocketData>(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
io.use(socketAuthMiddleware);

initializeChatSocket(io);


const startServer = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server + Sockets running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
};

startServer();
