import { useRef, useState } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import styles from "./Messagebubble.module.css";

function MessageBubble({ message }) {
  const { userName, retryMessage, setRepliedToMessage } = useChatContext();   // ✅ correct key from provider
  const isOwn = message.author === userName; // ✅ correct ownership check
  const isSystem = message.type === "system";

  const [showReplyBtn, setShowReplyBtn] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

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

  const handleDoubleClick = () => {
    setRepliedToMessage(message);
  };

  // Swipe gesture detection for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwiped(false);
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;

    // Detect left swipe (diffX > 0) or right swipe (diffX < 0)
    // Only trigger if swipe is more horizontal than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      // Left swipe: show reply button
      if (diffX > 0 && !isOwn) {
        setShowReplyBtn(true);
        setSwiped(true);
      }
      // Right swipe: hide reply button
      else if (diffX < 0 && showReplyBtn) {
        setShowReplyBtn(false);
        setSwiped(true);
      }
    }
  };

  const handleReplyClick = () => {
    setRepliedToMessage(message);
    setShowReplyBtn(false);
    setSwiped(false);
  };

  if (isSystem) {
    return (
      <div className={styles.systemMessage}>
        {message.message}
      </div>
    );
  }

  return (
    <div
      className={`${styles.bubble} ${isOwn ? styles.me : ''} ${swiped ? styles.swiped : ''}`}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Reply button for mobile (appears on left swipe) */}
      {showReplyBtn && !isOwn && (
        <button
          className={styles.replyBtn}
          onClick={handleReplyClick}
          onTouchStart={(e) => e.stopPropagation()}
        >
          ↩️ Reply
        </button>
      )}

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
        {message.replyTo && (
          <div className={styles.replyQuote}>
            <div className={styles.replyAuthor}>↩ {message.replyTo.author}</div>
            <div className={styles.replyMessage}>{message.replyTo.message.substring(0, 60)}...</div>
          </div>
        )}

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
