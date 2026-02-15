// cleint to server

export interface ClientToServerInterface {
  join_Room: (data: { room: string; lang: string }) => void;
  set_language: (data: { room: string; lang: string }) => void;
  send_message: (data: {
    room: string;
    author: string;
    message: string;
    sourceLocale: string;
    msgId: string;
    replyTo?: {
      msgId: string;
      author: string;
      message: string;
    };
  }) => void;
  create_room: (data: { name: string; mode: 'Global' | 'Native' }) => void;
  update_room_mode: (data: { room: string; mode: 'Global' | 'Native' }) => void;
  add_reaction: (data: { room: string; msgId: string; emoji: string }) => void;
  typing_start: (data: { room: string; author: string }) => void;
  typing_stop: (data: { room: string; author: string }) => void;
  // leave_room: (data: {room: string; author: string}) => void;
}


// server to client
export interface ServerToClientInterface {
  receive_message: (data: {
    original: string;
    message: string;
    author: string;
    time: string;
    msgId: string;
    lang: string;
    translations?: Record<string, string>;
    replyTo?: {
      msgId: string;
      author: string;
      message: string;
    };
    reactions?: Record<string, any>;
  }) => void;

  room_history: (data: any[]) => void;
  room_users: (data: { id: string; username: string; lang: string; status: 'online' }[]) => void;
  message_status: (data: { msgId: string; status: 'sent' | 'failed'; error?: string }) => void;
  reaction_update: (data: { msgId: string; reactions: Record<string, string[]> }) => void;
  error_event: (data: { message: string }) => void;
  translations_ready: (data: { msgId: string; translations: Record<string, string> }) => void;
  user_typing: (data: { author: string; isTyping: boolean }) => void;
  user_joined: (data: { message: string }) => void;
  room_info: (data: { name: string; mode: 'Global' | 'Native'; isAdmin: boolean }) => void;
  room_created: (data: { name: string }) => void;
}

// data stored in socket instance
export interface SocketData {

  username: string;
  lang: string;
  room: string;
  userId?: string;
}
