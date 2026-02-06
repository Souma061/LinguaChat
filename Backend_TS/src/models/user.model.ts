import mongoose, {Document, Schema} from "mongoose";
import { string } from "zod";

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<IUser> ({
  username:{
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required:true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',

  }
},{
  timestamps: true,
})

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
