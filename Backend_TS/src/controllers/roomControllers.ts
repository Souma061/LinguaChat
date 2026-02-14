import type { Request, Response } from "express";
import {Room} from "../models/room.model.ts";


export const getPublicRooms = async (req:Request, res:Response) => {
  try {
    const rooms = await Room.find({ isPublic: true }).select("name mode admins createdAt").sort({ createdAt: -1 }).lean();
    res.status(200).json(rooms);
  } catch(error) {
    console.error("Error fetching public rooms:", error);
    res.status(500).json({ error: "Failed to fetch public rooms" });
  }
}
