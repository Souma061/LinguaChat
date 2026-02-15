import { Room } from "../models/room.model.ts";

export const createRoom = async (
  name: string,
  ownerId: string,
  mode: 'Global' | 'Native'
) => {
  const existingRoom = await Room.findOne({ name });
  if (existingRoom) {
    throw new Error('Room name already exists');
  }
  const newRoom = await Room.create({
    name,
    owner: ownerId,
    admins: [ownerId],
    members: [ownerId],
    mode,
    isPublic: true,
  });
  return newRoom;
}

export const getRoomByName = async (name: string) => {
  return await Room.findOne({ name }).populate('owner', 'username').populate('admins', 'username').populate('members', 'username');
};

export const updateRoomMode = async (name: string, mode: 'Global' | 'Native') => {
  const room = await Room.findOne({ name }).exec();
  if (!room) {
    throw new Error('Room not found');
  }
  room.mode = mode;
  await room.save();
  return room;
};
