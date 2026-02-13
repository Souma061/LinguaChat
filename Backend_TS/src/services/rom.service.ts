import { Room } from "../models/room.model.ts";

export const createRoom = async (
  name:string,
  ownerId: string,
  mode: 'Global' | 'Native'
) => {
  const existingRoom = await Room.findOne({name});
  if(existingRoom){
    throw new Error('Room name already exists');
  }
  const newRoom = await Room.create({
    name,
    owner: ownerId,
    mode,
    isPublic: true,
  });
  return newRoom;
}

export const getRoomByName = async (name: string) => {
  return await Room.findOne({name}).populate('owner', 'username').populate('admins', 'username').populate('members', 'username');
};
