import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("✅ Connected to server");

  // Join a room
  socket.emit("join_Room", {
    room: "general",
    lang: "en"
  });
});

socket.on("room_history", (messages) => {
  console.log("📜 Room history:", messages);
});

socket.on("user_joined", (data) => {
  console.log("👤 User joined:", data);
});

socket.on("receive_message", (data) => {
  console.log("💬 Message received:", data);
});

socket.on("error_event", (error) => {
  console.log("❌ Error:", error);
});

socket.on("disconnect", () => {
  console.log("🔌 Disconnected");
  process.exit(0);
});

// Send a test message after 2 seconds
setTimeout(() => {
  const uniqueId = `test-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  socket.emit("send_message", {
    room: "general",
    author: "TestUser",
    message: "Hello from Socket.IO client!",
    sourceLocale: "en",
    msgId: uniqueId
  });
}, 2000);
