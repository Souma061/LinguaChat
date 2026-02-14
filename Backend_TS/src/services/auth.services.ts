import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { IUser } from '../models/user.model.ts';
import User from '../models/user.model.ts';
import UserSession from '../models/userSession.model.ts';

interface AuthService {
  user: {
    id: string;
    username: string;
    role: 'user' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
}

interface TokenPayload {
  id: string;
  username: string;
  role: string;
}


export const registerUser = async (username: string, email: string, password: string, device: string = 'Unknown Device', ip: string = '0.0.0.0'): Promise<AuthService> => {
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

  const { accessToken, refreshToken } = await createSession(newUser._id, device, ip);

  return {
    user: {
      id: newUser._id.toString(),
      username: newUser.username,
      role: newUser.role || 'user'
    },
    accessToken,
    refreshToken,
  };
}

export const loginUser = async (username: string, password: string, device: string = 'Unknown Device', ip: string = '0.0.0.0'): Promise<AuthService> => {

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

  const { accessToken, refreshToken } = await createSession(user._id, device, ip);

  return {
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role || 'user'
    },
    accessToken,
    refreshToken,
  };
}

const generateTokens = (user: IUser): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
}

const generateAccessToken = (user: IUser): string => {
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
      expiresIn: '15m',
    }
  );
}

const generateRefreshToken = (user: IUser): string => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
  }
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
}

export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as TokenPayload;

    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Find valid session for this refresh token
    const sessions = await UserSession.find({ userId: user._id });

    let validSession = null;
    for (const session of sessions) {
      const isValidToken = await bcrypt.compare(refreshToken, session.hashedRefreshToken);
      if (isValidToken && new Date() < session.expiresAt) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new Error('Session not found or expired');
    }

    const accessToken = generateAccessToken(user);
    return { accessToken };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Invalid refresh token');
  }
}

const createSession = async (userId: any, device: string, ip: string): Promise<{ accessToken: string; refreshToken: string }> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const { accessToken, refreshToken } = generateTokens(user);

  // Hash the refresh token before storing
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  // Calculate expiry time (7 days from now)
  const expiryTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Create session in database
  await UserSession.create({
    userId,
    hashedRefreshToken,
    device,
    ip,
    expiresAt: expiryTime
  });

  return { accessToken, refreshToken };
}

export const logoutSession = async (userId: string, sessionId: string): Promise<{ message: string }> => {
  const result = await UserSession.findOneAndDelete({
    _id: sessionId,
    userId,
  });
  if (!result) {
    throw new Error('Session not found');
  }
  return { message: 'Logged out from device' };
}

export const logoutAllSessions = async (userId: string): Promise<{ message: string }> => {
  await UserSession.deleteMany({ userId });
  return { message: 'Logged out from all devices' };
}

export const getActiveSessions = async (userId: string): Promise<any[]> => {
  const sessions = await UserSession.find({
    userId,
    expiresAt: { $gt: new Date() }
  }).select('-hashedRefreshToken').sort({ createdAt: -1 });

  return sessions.map(session => ({
    id: session._id,
    device: session.device,
    ip: session.ip,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt
  }));
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

export function translateText(message: string, sourceLang: string, supportedLanguages: string[]) {
  throw new Error("Function not implemented.");
}
