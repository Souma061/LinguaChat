export type LanguageCode = "en" | "hi" | "bn" | "es" | "fr" | "de" | "ja";

export type RoomMode = "Global" | "Native";

export interface ReplyReference {
  msgId: string;
  author: string;
  message: string;
}

export type MessageTranslations = Record<string, string>;

export type MessageReactions = Record<string, string[]>;

export interface SocketMessagePayload {
  original: string;
  message: string;
  author: string;
  authorProfilePicture?: string;
  time: string;
  msgId: string;
  lang: string;
  translations?: MessageTranslations;
  replyTo?: ReplyReference;
  reactions?: MessageReactions;
}

export interface RoomUserPresence {
  id: string;
  username: string;
  profilePicture?: string;
  lang: string;
  status: "online";
}

export interface MessageStatusPayload {
  msgId: string;
  status: "sent" | "failed";
  error?: string;
}

export interface ErrorEventPayload {
  message: string;
}

export interface TranslationsReadyPayload {
  msgId: string;
  translations: MessageTranslations;
}

export interface UserTypingPayload {
  author: string;
  isTyping: boolean;
}

export interface RoomInfoPayload {
  name: string;
  mode: RoomMode;
  isAdmin: boolean;
}
