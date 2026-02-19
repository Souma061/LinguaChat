import { Check, Copy, ArrowBendUpLeft as Reply, SmileySticker as SmilePlus } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { QuickReactionBar } from "./EmojiPicker";

interface ReplyTo {
  msgId: string;
  author: string;
  message: string;
}

export interface MessageData {
  msgId: string;
  author: string;
  authorProfilePicture?: string;
  message: string;
  original?: string;
  time: string;
  lang: string;
  translations?: Record<string, string>;
  replyTo?: ReplyTo;
  reactions?: Record<string, unknown>;
}

interface MessageBubbleProps {
  msg: MessageData;
  isMe: boolean;
  showAvatar: boolean;
  displayText: string;
  timeLabel: string;
  onReply: (msg: MessageData) => void;
  onReact: (msgId: string, emoji: string) => void;
  currentUser?: string;
  onScrollToMessage?: (msgId: string) => void;
}

const MessageBubble = ({
  msg,
  isMe,
  showAvatar,
  displayText,
  timeLabel,
  onReply,
  onReact,
  currentUser,
  onScrollToMessage,
}: MessageBubbleProps) => {
  const [showReactions, setShowReactions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayText).catch((err) => {
      console.error("Failed to copy to clipboard", err);
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayText]);

  // Build reactions display
  const reactionEntries: [string, string[]][] = msg.reactions
    ? (Object.keys(msg.reactions)
      .map((key) => [key, msg.reactions![key]] as [string, unknown])
      .filter(
        ([, users]) => Array.isArray(users) && (users as string[]).length > 0,
      ) as [string, string[]][])
    : [];

  return (
    <div
      id={`msg-${msg.msgId}`}
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[85%] sm:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"} gap-2`}
      >
        {/* Avatar */}
        {!isMe && (
          <div
            className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium select-none overflow-hidden ${showAvatar
              ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300"
              : "opacity-0"
              }`}
          >
            {msg.authorProfilePicture ? (
              <img
                src={msg.authorProfilePicture}
                alt={msg.author}
                className="h-full w-full object-cover"
              />
            ) : (
              msg.author.charAt(0).toUpperCase()
            )}
          </div>
        )}

        {/* Bubble Column */}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {/* Author name */}
          {!isMe && showAvatar && (
            <span className="text-xs text-gray-500 ml-1 mb-1">
              {msg.author}
            </span>
          )}

          {/* Message Bubble with Hover Actions */}
          <div className="relative group">
            {/* Hover Action Bar */}
            <div
              className={`absolute -top-8 ${isMe ? "right-0" : "left-0"} hidden group-hover:flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-1 py-0.5 z-30`}
            >
              <button
                onClick={() => onReply(msg)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="Reply"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowReactions((v) => !v)}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="React"
              >
                <SmilePlus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Quick Reaction Bar (opened via SmilePlus) */}
            {showReactions && (
              <QuickReactionBar
                onReact={(emoji) => onReact(msg.msgId, emoji)}
                onClose={() => setShowReactions(false)}
              />
            )}

            {/* The Bubble */}
            <div
              className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm break-words relative ${isMe
                ? "bg-indigo-600 text-white rounded-br-sm"
                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-bl-sm"
                }`}
            >
              {/* Reply Preview (quoted message) */}
              {msg.replyTo && msg.replyTo.author && msg.replyTo.message && (
                <button
                  type="button"
                  onClick={() => onScrollToMessage?.(msg.replyTo!.msgId)}
                  className={`w-full text-left mb-2 px-3 py-1.5 rounded-lg border-l-3 ${isMe
                    ? "bg-indigo-700/50 border-indigo-300 text-indigo-100"
                    : "bg-gray-50 dark:bg-gray-700/50 border-indigo-400 text-gray-600 dark:text-gray-300"
                    }`}
                >
                  <span className="text-xs font-semibold block">
                    {msg.replyTo.author}
                  </span>
                  <span className="text-xs opacity-80 line-clamp-2">
                    {msg.replyTo.message}
                  </span>
                </button>
              )}

              {/* Image Attachment */}

              {/* Message Text */}
              <span className="whitespace-pre-wrap">{displayText}</span>

              {/* Time */}
              <div
                className={`text-[10px] mt-1 opacity-70 text-right ${isMe ? "text-indigo-100" : "text-gray-400"
                  }`}
              >
                {timeLabel}
              </div>
            </div>

            {/* Reaction Badges */}
            {reactionEntries.length > 0 && (
              <div
                className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : "justify-start"}`}
              >
                {reactionEntries.map(([emoji, userList]) => {
                  const iReacted = currentUser
                    ? userList.indexOf(currentUser) !== -1
                    : false;
                  return (
                    <button
                      key={emoji}
                      onClick={() => onReact(msg.msgId, emoji)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${iReacted
                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300"
                        : "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      title={userList.join(", ")}
                    >
                      <span>{emoji}</span>
                      <span className="font-medium">{userList.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
