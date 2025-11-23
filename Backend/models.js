import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true
  },
  author: String,
  original: String,
  translations: {
    type: Map,
    of: String,
    default: {}
  },
  sourceLocale: String,
  msgID: {
    type:String,
    unique: true,
  },
  time: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
});

//index for efficient room history retrieval

messageSchema.index({room: 1, createdAt: -1});

export const Message = mongoose.model("Message", messageSchema);
