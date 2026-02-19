import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticationRequest } from "../middlewares/auth.middleware.ts";
import * as authService from "../services/auth.services.ts";

const getDeviceInfo = (req: Request): { device: string; ip: string } => {
  const userAgent = req.get('user-agent') || 'Unknown Device';
  const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';

  // Simple device detection from user-agent (specific before generic)
  let device = 'Unknown Device';
  if (userAgent.includes('iPad')) device = 'iPad';
  else if (userAgent.includes('iPhone')) device = 'iPhone';
  else if (userAgent.includes('Android')) device = 'Android';
  else if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Windows')) device = 'Windows PC';
  else if (userAgent.includes('Mac')) device = 'Mac';
  else if (userAgent.includes('Linux')) device = 'Linux PC';

  return { device, ip };
}

const registerSchema = z.object({
  username: z.string().min(6, "Username must be at least 6 characters long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});

const loginSchema = z.object({
  username: z.string().min(6, "Username must be at least 6 characters long"),
  password: z.string().min(6, "Password must be at least 6 characters long")
});

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);
    const { device, ip } = getDeviceInfo(req);

    let profilePicture: string | undefined;
    if (req.file) {
      profilePicture = req.file.path;
    }

    const result = await authService.registerUser(username, email, password, device, ip, profilePicture);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = loginSchema.parse(req.body);
    const { device, ip } = getDeviceInfo(req);
    const result = await authService.loginUser(username, password, device, ip);
    res.status(200).json(result);

  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }
    const result = await authService.refreshAccessToken(token);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}

export const logoutSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: "Session ID is required" });
      return;
    }
    const userId = (req as AuthenticationRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const result = await authService.logoutSession(userId, sessionId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}

export const logoutAllSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticationRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const result = await authService.logoutAllSessions(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}

export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticationRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const sessions = await authService.getActiveSessions(userId);
    res.status(200).json({ sessions });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}
