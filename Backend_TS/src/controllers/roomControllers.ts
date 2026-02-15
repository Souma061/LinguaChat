import type { Request, Response } from "express";
import { Room } from "../models/room.model.ts";


export const getPublicRooms = async (req: Request, res: Response) => {
  try {
    const rooms = await Room.find({ isPublic: true })
      .select("name mode admins members owner createdAt")
      .populate("owner", "username")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error fetching public rooms:", error);
    res.status(500).json({ error: "Failed to fetch public rooms" });
  }
}

export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id)
      .select("name mode admins members owner createdAt")
      .populate("owner", "username")
      .lean();
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.status(200).json(room);
  } catch (error) {
    console.error("Error fetching room by ID:", error);
    res.status(500).json({ error: "Failed to fetch room" });
  }
};

export const updateRoomMode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mode } = req.body;

    if (!["Global", "Native"].includes(mode)) {
      res.status(400).json({ error: "Invalid mode" });
      return;
    }

    const room = await Room.findById(id);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    // Auth check
    const userId = (req as any).user?.id;
    const isOwner = String(room.owner) === String(userId);
    const isAdmin = room.admins.some((a) => String(a) === String(userId));

    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: "Only admins can change room settings" });
      return;
    }

    room.mode = mode;
    await room.save();

    res.status(200).json(room);
  } catch (error) {
    console.error("Error updating room mode:", error);
    res.status(500).json({ error: "Failed to update room mode" });
  }
};
