import { useEffect, useRef, useState } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import styles from "./Messagebubble.module.css";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "✨"];

function MessageBubble({ message }) {
  const { userName, retryMessage, setRepliedToMessage, getSocket, room } = useChatContext();   // ✅ correct key from provider
  const isOwn = message.author === userName; // ✅ correct ownership check
  const isSystem = message.type === "system";

  const [showReplyBtn, setShowReplyBtn] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || {});
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef(null);

  // Listen for reaction updates from socket
  useEffect(() => {
    const socket = getSocket?.();
    if (!socket) return;

    const handleReactionUpdate = (data) => {
      if (data.msgId === message.msgId) {
        setReactions(data.reactions);
      }
    };

    socket.on('reaction_update', handleReactionUpdate);

    return () => {
      socket.off('reaction_update', handleReactionUpdate);
    };
  }, [getSocket, message.msgId]);

    // Cleanup long press timer on unmount
  useEffect(() => {
    const timer = longPressTimer.current;
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

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

  // Improved swipe gesture detection
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return; // Only handle single touch

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;

    // Long press detection (500ms)
    longPressTimer.current = setTimeout(() => {
      if (!isOwn) {
        setRepliedToMessage(message);
        // Trigger haptic feedback on mobile
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500);
  };

  const handleTouchMove = () => {
    // Cancel long press if user starts moving
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = (e) => {
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!touchStartX.current || !touchStartY.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const diffX = touchStartX.current - touchEndX;
    const diffY = touchStartY.current - touchEndY;
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);

    // Require minimum distance for swipe (not a tap)
    if (distance < 20) {
      touchStartX.current = 0;
      touchStartY.current = 0;
      return;
    }

    // Detect left swipe (diffX > 0) or right swipe (diffX < 0)
    // Only trigger if swipe is more horizontal than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      // Left swipe: show reply button
      if (diffX > 0 && !isOwn && !swiped) {
        setShowReplyBtn(true);
        setSwiped(true);
      }
      // Right swipe: hide reply button
      else if (diffX < 0 && swiped) {
        setShowReplyBtn(false);
        setSwiped(false);
      }
    }

    // Reset touch tracking
    touchStartX.current = 0;
    touchStartY.current = 0;
  };

  const handleReplyClick = () => {
    setRepliedToMessage(message);
    setShowReplyBtn(false);
    setSwiped(false);
  };

  const handleReplyQuoteClick = () => {
    if (!message.replyTo?.msgId) return;

    // Find the message element by msgId
    const targetElement = document.querySelector(`[data-msgid="${message.replyTo.msgId}"]`);

    if (targetElement) {
      // Scroll to the element with smooth behavior
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add a highlight effect
      targetElement.style.backgroundColor = 'var(--accent-color)';
      targetElement.style.opacity = '0.7';

      // Remove highlight after 2 seconds
      setTimeout(() => {
        targetElement.style.backgroundColor = '';
        targetElement.style.opacity = '';
      }, 2000);
    }
  };

  const handleEmojiSelect = (emoji) => {
    const socket = getSocket?.();
    if (!socket || !message.msgId) return;

    // Emit reaction to backend
    socket.emit('add_reaction', {
      msgId: message.msgId,
      emoji,
      username: userName,
      room: room || 'default',
    });

    // Close emoji picker
    setShowEmojiPicker(false);
  };  if (isSystem) {
    return (
      <div className={styles.systemMessage}>
        {message.message}
      </div>
    );
  }

  return (
    <div
      className={`${styles.bubble} ${isOwn ? styles.me : ''} ${swiped ? styles.swiped : ''}`}
      data-msgid={message.msgId}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
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

      {/* Desktop hover hint for reply */}
      {!isOwn && (
        <div className={styles.replyHint} title="Double click to reply">
          ↩️
        </div>
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
          <div
            className={styles.replyQuote}
            onClick={handleReplyQuoteClick}
            style={{ cursor: 'pointer' }}
            title="Click to jump to message"
          >
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

      {/* Emoji Reactions */}
      <div className={styles.reactionsContainer}>
        {Object.entries(reactions).map(([emoji, users]) => {
          const userCount = Array.isArray(users) ? users.length : 1;
          const usersList = Array.isArray(users) ? users.join(', ') : users;
          const isCurrentUserReacted = Array.isArray(users) && users.includes(userName);

          return (
            <button
              key={emoji}
              className={`${styles.reactionBtn} ${isCurrentUserReacted ? styles.userReacted : ''}`}
              onClick={() => handleEmojiSelect(emoji)}
              title={`${usersList}`}
            >
              {emoji} <span className={styles.reactionCount}>{userCount}</span>
            </button>
          );
        })}

        <button
          className={styles.emojiPickerBtn}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Add reaction"
        >
          😊
        </button>

        {showEmojiPicker && (
          <div className={styles.emojiPicker}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                className={styles.emojiOption}
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
