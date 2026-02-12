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
  typing_start: (data: { room: string; author: string }) => void;
  // typing_stop: (data: {room: string; author: string}) => void;
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
    replyTo?: {
      msgId: string;
      author: string;
      message: string;
    };
    reactions?: Record<string, any>;
  }) => void;

  room_history: (data: any[]) => void;
  error_event: (data: { message: string }) => void;
  user_joined: (data: { message: string }) => void;
}

// data stored in socket instance
export interface SocketData {

  username: string;
  lang: string;
  room: string;
}
