import { useChatContext } from "../../hooks/useChatContext";
import styles from "./Messagebubble.module.css";

function MessageBubble({ message }) {
  const { userName, retryMessage } = useChatContext();   // ✅ correct key from provider
  const isOwn = message.author === userName; // ✅ correct ownership check
  const isSystem = message.type === "system";

  const getStatusIcon = () => {
    switch (message.status) {
      case 'pending':
        return { icon: '⏳', title: 'Sending...', className: styles.pending };
      case 'sent':
        return { icon: '✓', title: 'Sent', className: styles.sent };
      case 'failed':
        return { icon: '✕', title: 'Failed to send. Click to retry.', className: styles.failed, isClickable: true };
      default:
        return null;
    }
  };

  const statusIcon = getStatusIcon();

  const handleRetry = () => {
    if (message.status === 'failed' && retryMessage) {
      retryMessage(message);
    }
  };

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

        {statusIcon && isOwn && (
          <span
            className={statusIcon.className}
            title={statusIcon.title}
            onClick={statusIcon.isClickable ? handleRetry : undefined}
            style={statusIcon.isClickable ? { cursor: 'pointer' } : {}}
          >
            {statusIcon.icon}
          </span>
        )}
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
