import mongoose, { Document, Schema } from "mongoose";

export interface IUserSession extends Document {
  userId: mongoose.Types.ObjectId;
  hashedRefreshToken: string;
  tokenId?: string;
  device: string;
  ip: string;
  createdAt: Date;
  expiresAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  hashedRefreshToken: {
    type: String,
    required: true,
  },
  tokenId: {
    type: String,
    index: true,
  },
  device: {
    type: String,
    default: 'Unknown Device',
  },
  ip: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// Index to auto-delete expired sessions
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const UserSession = mongoose.model<IUserSession>('UserSession', UserSessionSchema);

export default UserSession;
