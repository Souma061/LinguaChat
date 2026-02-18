import { Smiley as Smile, X } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EMOJI_DATA, QUICK_REACTIONS } from "./emojiConstants";

const CATEGORIES = Object.keys(EMOJI_DATA);

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const EmojiPicker = ({ onSelect, onClose, isOpen }: EmojiPickerProps) => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleEmojiClick = useCallback(
    (emoji: string) => {
      onSelect(emoji);
    },
    [onSelect],
  );

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-in slide-in-from-bottom-2"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Emojis
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat
                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="p-2 h-52 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        <div className="grid grid-cols-8 gap-0.5">
          {EMOJI_DATA[activeCategory]?.map((emoji, i) => (
            <button
              type="button"
              key={`${emoji}-${i}`}
              onClick={() => handleEmojiClick(emoji)}
              className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-xl transition-all hover:scale-110 active:scale-95"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export { EmojiPicker };

export const QuickReactionBar = ({
  onReact,
  onClose,
}: {
  onReact: (emoji: string) => void;
  onClose: () => void;
}) => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={barRef}
      className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 px-1.5 py-1 z-50"
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          type="button"
          key={emoji}
          onClick={() => {
            onReact(emoji);
            onClose();
          }}
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-base transition-all hover:scale-125 active:scale-95"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

// Toggle button wrapper for the composer
export const EmojiToggleButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`p-2 rounded-full transition-colors ${isOpen
        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
        : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
  >
    <Smile className="h-5 w-5" />
  </button>
);

export default EmojiPicker;
