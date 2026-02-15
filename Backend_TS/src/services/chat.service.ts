import Message from "../models/message.model.ts";
import { Room } from "../models/room.model.ts";
import * as translationService from "./translation.service.ts";

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'hi', 'bn', 'de', 'ja'];

/**
 * Save message immediately with empty translations (instant).
 * Returns the saved document + whether it's Global mode (needs translation).
 */
export const saveMessageFast = async (data: {
  room: string;
  author: string;
  message: string;
  sourceLocale: string;
  msgId: string;
  replyTo?: { msgId: string; author: string; message: string };
}) => {
  const roomSettings = await Room.findOne({ name: data.room });
  const isGlobalMode = roomSettings ? roomSettings.mode === 'Global' : true;

  const newMessage = await Message.create({
    room: data.room,
    author: data.author,
    original: data.message,
    sourceLocale: data.sourceLocale,
    msgId: data.msgId,
    translations: {},  // empty — translations come later
    ...(data.replyTo ? { replyTo: data.replyTo } : {}),
  });

  return { savedMessage: newMessage, isGlobalMode };
};

/**
 * Translate the message in the background and update the DB.
 * Returns the translations map.
 */
export const translateAndUpdate = async (
  msgId: string,
  room: string,
  text: string,
  sourceLocale: string,
): Promise<Record<string, string>> => {
  console.log(`[chat] ⏳ Translating "${text.substring(0, 30)}..." from "${sourceLocale}" to [${SUPPORTED_LANGUAGES.join(', ')}]`);

  const translationMap = await translationService.translateText(
    text,
    sourceLocale,
    SUPPORTED_LANGUAGES,
  );

  console.log(`[chat] ✅ Got ${translationMap.size} translations: [${Array.from(translationMap.keys()).join(', ')}]`);

  // Persist translations to DB (fire-and-forget-ish, but await for safety)
  const translationsObj = Object.fromEntries(translationMap);
  await Message.updateOne(
    { room, msgId },
    { $set: { translations: translationsObj } },
  );

  return translationsObj;
};


export const getRoomHistory = async (room: string) => {
  try {
    const messages = await Message.find({ room }).sort({
      createdAt: -1,
    }).limit(50).lean();
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error("Error fetching room history:", error);
    throw new Error("Failed to fetch room history");
  }
};

export const getMessageByMsgId = async (room: string, msgId: string) => {
  return await Message.findOne({ room, msgId }).exec();
};
