import { useEffect, useRef, useState } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import { detectSourceLanguage } from "../../utils/helper";
import styles from "./Composer.module.css";

function Composer() {
  const { sendChatMessage, isConnected, repliedToMessage, clearReply } = useChatContext();
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Auto-expand textarea height based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120); // Max height: 120px
      textarea.style.height = newHeight + 'px';
    }
  }, [message]);

  const handleSendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed || !isConnected) return;

    const sourceLang = detectSourceLanguage(trimmed);
    sendChatMessage(trimmed, sourceLang);

    setMessage("");
    // Reset textarea height after sending
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.composerWrapper}>
      {repliedToMessage && (
        <div className={styles.replyPreview}>
          <div className={styles.replyText}>
            Replying to <strong>{repliedToMessage.author}</strong>: {repliedToMessage.message.substring(0, 50)}...
          </div>
          <button
            className={styles.clearReplyBtn}
            onClick={clearReply}
            aria-label="Cancel reply"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.composer}>
        <textarea
          ref={textareaRef}
          placeholder={isConnected ? "Type your message in any language... (Enter to send, Shift+Enter for new line)" : "Connecting to chat..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
          className={styles.input}
          maxLength={500}
          aria-label="Message input"
          rows={1}
        />
        <button
          onClick={handleSendMessage}
          disabled={!isConnected || !message.trim()}
          className={styles.sendButton}
          aria-label="Send message"
        >
          {isConnected ? 'Send' : '...'}
        </button>
      </div>
    </div>
  );
}

export default Composer;
