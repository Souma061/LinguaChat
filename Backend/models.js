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
  msgId: {
    type: String,
  },
  replyTo: {
    msgId: String,
    author: String,
    message: String,
  },
  reactions: {
    type: Map,
    of: [String],
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
});

// Index for efficient room history retrieval
messageSchema.index({room: 1, createdAt: -1});

export const Message = mongoose.model("Message", messageSchema);

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  owner: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ""
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  totalMessages: {
    type: Number,
    default: 0
  }
});

// Index for efficient room queries
roomSchema.index({ createdAt: -1 });
roomSchema.index({ isPublic: 1, activeUsers: -1 });

export const Room = mongoose.model("Room", roomSchema);
