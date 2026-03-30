
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { io } from "socket.io-client";

dotenv.config();

const PORT = process.env.PORT || 5000;
const URL = `http://localhost:${PORT}`;
const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.error("❌ JWT_SECRET is missing in .env");
  process.exit(1);
}

console.log(`🔍 Diagnosing Socket.IO connection to ${URL}...`);

// Generate a test token
const token = jwt.sign({ id: "test-user-id", role: "user" }, SECRET, { expiresIn: "1h" });
console.log("🔑 Generated test token");

const socket = io(URL, {
  auth: { token },
  transports: ['websocket', 'polling'], // match frontend config
  reconnection: false,
});

socket.on("connect", () => {
  console.log("✅ Connection SUCCESSFUL!");
  console.log(`Correction: Socket ID: ${socket.id}`);
  socket.disconnect();
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection FAILED:", err.message);
  // Detailed error might be in the object
  console.error(err);
  process.exit(1);
});

socket.on("disconnect", (reason) => {
  console.log("⚠️ Disconnected:", reason);
  if (reason === "io server disconnect") {
    console.log("Server explicitly closed the connection.");
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error("❌ Connection TIMED OUT");
  socket.disconnect();
  process.exit(1);
}, 5000);
