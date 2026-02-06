import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { IUser } from '../models/user.model';
import User from '../models/user.model';

interface AuthService {
  user: {
    id: string;
    username: string;
    role: 'user' | 'admin';
  };
  token: string;
}


export const registerUser = async (username: string, email: string, password: string): Promise<AuthService> => {
  // Check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword
  });

  const token = generateToken(newUser);

  return {
    user: {
      id: newUser._id.toString(),
      username: newUser.username,
      role: newUser.role || 'user'
    },
    token,
  };
}

export const loginUser = async (username: string, password: string): Promise<AuthService> => {

  // Find user by username
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid username or password');
  }

  //compare user proviuded password with hashed password in database
  const isPaswordMatched = await bcrypt.compare(password, user.password);
  if (!isPaswordMatched) {
    throw new Error('Invalid username or password');
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role || 'user'
    },
    token,
  };
}

const generateToken = (user: IUser): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
    }
  );
}
