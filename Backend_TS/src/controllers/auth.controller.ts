import type  { Request, Response } from "express";
import {z} from "zod";
import * as authService from "../services/auth.services";

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
    const {username, email, password} = registerSchema.parse(req.body);
    const result = await authService.registerUser(username, email, password);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const {username, password} = loginSchema.parse(req.body);
    const result = await authService.loginUser(username, password);
    res.status(200).json(result);

  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
  }
}
