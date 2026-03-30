import type {
  ErrorEventPayload,
  MessageStatusPayload,
  ReplyReference,
  RoomInfoPayload,
  RoomMode,
  RoomUserPresence,
  SocketMessagePayload,
  TranslationsReadyPayload,
  UserTypingPayload,
} from "./chat.d.ts";

export interface ClientToServerInterface {
  join_Room: (data: { room: string; lang: string }) => void;
  set_language: (data: { room: string; lang: string }) => void;
  send_message: (data: {
    room: string;
    author: string;
    message: string;
    sourceLocale: string;
    msgId: string;
    replyTo?: ReplyReference;
  }) => void;
  create_room: (data: { name: string; mode: RoomMode }) => void;
  update_room_mode: (data: { room: string; mode: RoomMode }) => void;
  add_reaction: (data: { room: string; msgId: string; emoji: string }) => void;
  typing_start: (data: { room: string; author: string }) => void;
  typing_stop: (data: { room: string; author: string }) => void;
  leave_room: (data: { room: string }) => void;
}

export interface ServerToClientInterface {
  receive_message: (data: SocketMessagePayload) => void;
  room_history: (data: SocketMessagePayload[]) => void;
  room_users: (data: RoomUserPresence[]) => void;
  message_status: (data: MessageStatusPayload) => void;
  reaction_update: (data: { msgId: string; reactions: Record<string, string[]> }) => void;
  error_event: (data: ErrorEventPayload) => void;
  translations_ready: (data: TranslationsReadyPayload) => void;
  user_typing: (data: UserTypingPayload) => void;
  user_joined: (data: { message: string }) => void;
  room_info: (data: RoomInfoPayload) => void;
  room_created: (data: { name: string }) => void;
}

export interface SocketData {
  username: string;
  lang: string;
  room: string;
  userId?: string;
  profilePicture?: string;
}
