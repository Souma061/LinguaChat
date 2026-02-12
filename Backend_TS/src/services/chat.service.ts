import Message from "../models/message.model.ts";


export const saveMessage = async (data: {
  room: string;
  author: string;
  message: string;
  sourceLang: string;
  msgId: string;
  replyTo?: {
    msgId: string;
    author: string;
    message: string;
  }


}) => {
  try {
    const newMessage = await Message.create({
      room: data.room,
      author: data.author,
      original: data.message,
      sourceLocale: data.sourceLang,
      msgId: data.msgId,
      translated: {

      }, // We will add translation logic later
      ...(data.replyTo && { replyTo: data.replyTo })
    })
    return newMessage;
  } catch (error) {
    console.error("Error saving message:", error);
    throw new Error("Failed to save message");
  }
}


export const getRoomHistory = async (room: string, ) => {
  try {
    const messages = await Message.find({ room}).sort({
      createdAt: -1
    }).limit(50).lean();
    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error("Error fetching room history:", error);
    throw new Error("Failed to fetch room history");
  }
}
