import dotenv from "dotenv";
import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";
import * as chatService from "./services/chat.service.ts";
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

io.on("connection", (socket) => {
  console.log(`User Connected ${socket.id}`);

  socket.on("join_Room", (data) => {
    socket.join(data.room);
    socket.data.username = "Anonymous";//temp
    socket.data.room = data.room;
    socket.data.lang = data.lang;
    console.log(`User ${socket.data.username} joined room ${data.room} with language ${data.lang}`);


    // Fetch and send last 50 messages of the room
    try {
      const history = chatService.getRoomHistory(data.room);
      history.then(messages => {
        socket.emit("room_history", messages);

      })


    } catch (error) {
      console.error("Error fetching room history:", error);
      socket.emit("error_event", { message: "Failed to fetch room history" });
    }

    io.to(data.room).emit("user_joined", {
      message: "Anonymous", //temp
    });
  });


  socket.on("send_message", (data) => {
    try {
      const messageData: Parameters<typeof chatService.saveMessage>[0] = {
        room: data.room,
        author: data.author,
        message: data.message,
        sourceLang: data.sourceLocale,
        msgId: data.msgId,
      };

      if (data.replyTo) {
        messageData.replyTo = data.replyTo;
      }

      const savedMessagePromise = chatService.saveMessage(messageData);

      savedMessagePromise.then(savedMessage => {
        const messagePayload: {
          author: string;
          message: string;
          original: string;
          time: string;
          msgId: string;
          lang: string;
          reactions: Record<string, any>;
          replyTo?: {
            msgId: string;
            author: string;
            message: string;
          };
        } = {
          author: savedMessage.author,
          message: savedMessage.original,
          original: savedMessage.original,
          time: savedMessage.createdAt.toISOString(),
          msgId: savedMessage.msgId,
          lang: savedMessage.sourceLocale,
          reactions: {}
        };

        if (savedMessage.replyTo) {
          messagePayload.replyTo = savedMessage.replyTo;
        }

        io.to(data.room).emit("receive_message", messagePayload);
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });
  socket.on("disconnect", () => {
    console.log(`User Disconnected ${socket.id}`);
  });




});



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
}

startServer();
