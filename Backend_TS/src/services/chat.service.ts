import Message from "../models/message.model.ts";
import { Room } from "../models/room.model.ts";
import * as translationService from "./translation.service.ts";

export const saveMessage = async (data: {
  room: string;
  author: string;
  message: string;
  sourceLocale: string;
  msgId: string;
  replyTo?: { msgId: string; author: string; message: string };
}) => {
  const roomSettings = await Room.findOne({ name: data.room });
  const isGlobalMode = roomSettings ? roomSettings.mode === 'Global' : true;
  let translationMap: Map<string, string> = new Map();


  if (isGlobalMode) {
    const supportedLanguages = ['en', 'es', 'fr', 'hi', 'bn', 'de', 'ja'];

    translationMap = await translationService.translateText(
      data.message,
      data.sourceLocale,
      supportedLanguages
    );
  }

  const newMessage = await Message.create({
    room: data.room,
    author: data.author,
    original: data.message,
    sourceLocale: data.sourceLocale,
    msgId: data.msgId,
    translations: translationMap,
    ...(data.replyTo ? { replyTo: data.replyTo } : {})
  });

  return newMessage;
};



export const getRoomHistory = async (room: string,) => {
  try {
    const messages = await Message.find({ room }).sort({
      createdAt: -1
    }).limit(50).lean();
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error("Error fetching room history:", error);
    throw new Error("Failed to fetch room history");
  }
}
