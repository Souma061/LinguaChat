import { useChatContext } from "../../hooks/useChatContext";
import styles from "./MessageBubble.module.css";

function MessageBubble({ message }) {
  const { userName } = useChatContext();   // ✅ correct key from provider
  const isOwn = message.author === userName; // ✅ correct ownership check
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className={styles.systemMessage}>
        {message.message}
      </div>
    );
  }

  return (
    <div className={`${styles.bubble} ${isOwn ? styles.me : ''}`}>
      <div className={styles.meta}>
        <span className={styles.author}>{message.author}</span>

        {message.lang && (
          <span className={styles.langBadge}>
            {message.lang.toUpperCase()}
          </span>
        )}

        <span className={styles.time}>{message.time}</span>

        {message.isPending && <span className={styles.pending}>⏳</span>}
      </div>

      <div className={styles.text}>
        {message.message}

        {message.original && message.original !== message.message && (
          <div className={styles.originalText}>
            📝 {message.original}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
