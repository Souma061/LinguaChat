import mongoose, { Document, Schema } from "mongoose";


export interface IMessage extends Document {
  room: string;
  author: string;
  original: string;
  translations: Map<string, string>;
  sourceLocale: string;
  msgId: string;
  createdAt: Date;
  replyTo?: {
    msgId: string;
    author: string;
    message: string;
  }
}


const MessageSchema: Schema<IMessage> = new Schema({
  room: {
    type: String,
    required: true,
    index: true,
  },
  author: {
    type: String,
    required: true,
  },
  original: {
    type: String,
    required: true,
  },
  translations: {
    type: Map,
    of: String,
    default: {},
  },
  sourceLocale: {
    type: String,
    default: "auto",

  },
  msgId: {
    type: String,
    required: true,
    unique: true,
  },
  replyTo: {
    msgId: String,
    author: String,
    message: String,
  },
}, {
  timestamps: true,
});

MessageSchema.index({
  room: 1,
  createdAt: -1,
})

const Message = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
