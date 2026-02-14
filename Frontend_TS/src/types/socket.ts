// cleint to server

export interface ClientToServerInterface {
  join_Room: (data: { room: string; lang: string }) => void;
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
  typing_start: (data: { room: string; author: string }) => void;
  // typing_stop: (data: {room: string; author: string}) => void;
  // leave_room: (data: {room: string; author: string}) => void;
}


// server to client
export interface SocketMessagePayload {
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
  reactions?: Record<string, unknown>;
}

export interface ServerToClientInterface {
  receive_message: (data: SocketMessagePayload) => void;
  room_history: (data: SocketMessagePayload[]) => void;
  error_event: (data: { message: string }) => void;
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
