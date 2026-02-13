import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";


export interface AuthenticationRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}


export const authenticateJwt = (req: AuthenticationRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Unauthorized: Token missing" });
    return;
  }
  try {
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }
    const decoded = jwt.verify(token, secretKey);

    if (typeof decoded === "string") {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }
    req.user = {
      id: decoded.id as string,
      role: decoded.role as string,
    };
    next();
  }


  catch (error) {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
    return;

  }
}


