import type { Request, Response } from "express";
import { Room } from "../models/room.model.ts";
import type { AuthenticationRequest } from "../middlewares/auth.middleware.ts";
import * as roomService from "../services/room.service.ts";


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
    const id = String(req.params.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Room ID or name is required" });
      return;
    }

    // Try finding by MongoDB ObjectId first, then by name
    let room;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      room = await Room.findById(id)
        .select("name mode admins members owner createdAt")
        .populate("owner", "username")
        .lean();
    }

    // If not found by ID, try finding by name (case-insensitive)
    if (!room) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      room = await Room.findOne({ name: { $regex: new RegExp(`^${escaped}$`, 'i') } })
        .select("name mode admins members owner createdAt")
        .populate("owner", "username")
        .lean();
    }

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

export const searchRoomsByName = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string" || q.trim().length < 1) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rooms = await Room.find({
      isPublic: true,
      name: { $regex: escaped, $options: "i" },
    })
      .select("name mode admins members owner createdAt")
      .populate("owner", "username")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json(rooms);
  } catch (error) {
    console.error("Error searching rooms:", error);
    res.status(500).json({ error: "Failed to search rooms" });
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
    const userId = (req as AuthenticationRequest).user?.id;
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

export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    const userId = (req as AuthenticationRequest).user?.id;

    if (!id) {
      res.status(400).json({ error: "Room ID is required" });
      return;
    }

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await roomService.deleteRoom(id, userId);
    res.status(200).json({ message: `Room "${result.name}" deleted successfully` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete room";

    if (message === "Room not found") {
      res.status(404).json({ error: message });
      return;
    }
    if (message === "Only the room owner can delete this room") {
      res.status(403).json({ error: message });
      return;
    }

    console.error("Error deleting room:", error);
    res.status(500).json({ error: "Failed to delete room" });
  }
};
