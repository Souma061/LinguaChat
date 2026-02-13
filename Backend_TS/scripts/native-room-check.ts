import dotenv from "dotenv";
import mongoose from "mongoose";
import { io } from "socket.io-client";
import Message from "../src/models/message.model";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
const URL = `http://localhost:${PORT}`;

const ROOM = "ChillZone";
const MODE = "native";
const MSG_ID = `native-${Date.now()}`;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error("MONGODB_URI is not set; cannot query DB");
  }

  const socket = io(URL, {
    transports: ["websocket"],
    timeout: 10_000,
  });

  const once = <T>(event: string) =>
    new Promise<T>((resolve) => {
      socket.once(event, resolve);
    });

  socket.on("connect", () => {
    console.log("connected", socket.id);
  });

  socket.on("error_event", (data) => {
    console.log("error_event", data);
  });

  socket.on("room_created", (data) => {
    console.log("room_created", data);
  });

  socket.on("receive_message", (data) => {
    console.log("receive_message", data);
  });

  await once<void>("connect");

  // 1) Create room (may fail if it already exists)
  console.log("emit create_room", { name: ROOM, mode: MODE });
  socket.emit("create_room", { name: ROOM, mode: MODE as any });
  await sleep(300);

  // 2) Join room (so we can observe receive_message)
  console.log("emit join_Room", { room: ROOM, lang: "en" });
  socket.emit("join_Room", { room: ROOM, lang: "en" });
  await sleep(300);

  // 3) Send message
  const payload = {
    room: ROOM,
    author: "TestUser",
    message: "Hello ChillZone (Native mode)",
    sourceLocale: "en",
    msgId: MSG_ID,
  };

  console.log("emit send_message", payload);
  socket.emit("send_message", payload);

  // wait a moment for DB write
  await sleep(800);

  // 4) Check DB
  await mongoose.connect(mongoURI, { dbName: "LinguaChat_V2" });
  const saved = await Message.findOne({ msgId: MSG_ID }).lean();
  if (!saved) {
    throw new Error(`Message not found in DB for msgId=${MSG_ID}`);
  }

  const translationsObj = (saved as any).translations ?? {};
  const isEmpty =
    translationsObj && typeof translationsObj === "object" && Object.keys(translationsObj).length === 0;

  console.log("db message.msgId", (saved as any).msgId);
  console.log("db message.room", (saved as any).room);
  console.log("db message.translations", translationsObj);
  console.log("translations empty?", isEmpty);

  await mongoose.disconnect();
  socket.disconnect();

  if (!isEmpty) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
