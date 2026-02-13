import Message from "../models/message.model.ts";

export const saveMessage = async (data: {
  room: string;
  author: string;
  message: string;
  sourceLang: string;
  msgId: string;
  replyTo?: { msgId: string; author: string; message: string };
}) => {
  try {
    // 1. Define which languages we support (You can make this dynamic later)
    const supportedLanguages = ['en', 'es', 'fr', 'hi', 'bn']; // English, Spanish, French, Hindi, Bengali

    // 2. Create translation map (placeholder for now - you can implement actual translation later)
    const translationMap = new Map<string, string>();
    // Add the original message for the source language
    translationMap.set(data.sourceLang, data.message);
    // TODO: Implement actual translation service
    // For now, just set the same message for all languages
    supportedLanguages.forEach(lang => {
      if (lang !== data.sourceLang) {
        translationMap.set(lang, data.message); // Placeholder - implement translation
      }
    });

    // 3. Create the message with translations
    const newMessage = await Message.create({
      room: data.room,
      author: data.author,
      original: data.message,
      sourceLocale: data.sourceLang,
      msgId: data.msgId,
      translated: translationMap,
      ...(data.replyTo && { replyTo: data.replyTo })
    });

    return newMessage;
  } catch (error) {
    console.error("❌ Error saving message:", error);
    throw error;
  }
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
