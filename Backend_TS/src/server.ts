import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";
import { initializeChatSocket } from "./sockets/chat.socket.ts";
import type { ClientToServerInterface, ServerToClientInterface, SocketData } from "./types/socket.d.ts";

dotenv.config();

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);

const io = new Server<ClientToServerInterface, ServerToClientInterface, {}, SocketData>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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
