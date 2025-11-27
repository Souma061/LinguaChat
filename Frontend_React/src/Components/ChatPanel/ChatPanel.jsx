import { useEffect, useRef } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import Composer from "../Composer/Composer";
import MessageBubble from "../MessageBubble/MessageBubble";
import styles from "./Chatpanel.module.css";

function ChatPanel() {
  const { messages, room } = useChatContext();
  const messagesEndRef = useRef(null);

  const scrollTobottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollTobottom();
  },[messages]);


  return (
    <main className={styles.chatPanel}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>LinguaChat 💬</h2>
          {room && <span className={styles.roomPill}>Room: {room}</span>}
        </div>
        <div className={styles.headerTip}>💡 Double click to reply</div>
      </header>

      <p className={styles.powered}>
        Powered by <a href="https://lingo.dev" target="_blank" rel="noopener">Lingo.dev</a>
      </p>

      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💬</div>
            <h3>Welcome to {room}!</h3>
            <p>No messages yet. Start the conversation!</p>
            <div className={styles.quickTips}>
              <p><strong>Quick Tips:</strong></p>
              <ul>
                <li>✍️ Type your message below in any language</li>
                <li>🌐 Others will see it translated to their language</li>
                <li>👥 Share the room link to invite friends</li>
                <li>🔄 You can change your language anytime from the sidebar</li>
                <li>↩️ <strong>Reply:</strong> Swipe left on a message or long-press to reply</li>
                <li>😊 <strong>React:</strong> Click the emoji button to add reactions</li>
                <li>🔗 <strong>Jump:</strong> Click a reply quote to jump to the original message</li>
              </ul>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble key={msg.msgId || index} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <Composer />
    </main>
  );
}

export default ChatPanel
