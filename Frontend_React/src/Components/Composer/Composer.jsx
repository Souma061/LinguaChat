import { useState } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import { detectSourceLanguage } from "../../utils/helper";
import styles from "./Composer.module.css";

function Composer() {
  const { sendChatMessage, isConnected, repliedToMessage, clearReply } = useChatContext();
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    const trimmed = message.trim();
    if (!trimmed || !isConnected) return;

    const sourceLang = detectSourceLanguage(trimmed);
    sendChatMessage(trimmed, sourceLang);

    setMessage("");
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
        <input
          type="text"
          placeholder={isConnected ? "Type your message in any language... (Enter to send)" : "Connecting to chat..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!isConnected}
          className={styles.input}
          maxLength={500}
          aria-label="Message input"
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
