import mongoose, { Document } from "mongoose";


export interface IRoom extends Document {
  name: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  admins: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  isPublic: boolean;
  mode: 'Global' | 'Native';
  createdAt: Date;


}


const RommSchema = new mongoose.Schema<IRoom>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 50,

  },
  description: {
    type: String,
    default: '',
    maxLength: 200,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    mode: {
      type: String,
      enum: ['Global', 'Native'],
      default: 'Global',
    }
}, {
  timestamps: true,
});

export const Room = mongoose.model<IRoom>('Room', RommSchema);
