import mongoose, { Document, Schema } from "mongoose";


export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  profilePicture: string;
  createdAt: Date;
  updatedAt: Date;
};

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
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
  },
  profilePicture: {
    type: String,
    default: "https://res.cloudinary.com/demo/image/upload/v1584462242/avatar_default.jpg" // You can change this to a default image url
  }
}, {
  timestamps: true,
})

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
