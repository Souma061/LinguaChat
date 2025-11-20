import { useState } from 'react';
import { useChatContext } from '../../hooks/useChatContext';
import { DEMO_ROOM, LANGUAGES, parseUrlParams, updateUrlParams } from '../../utils/helper';
import styles from './LoginPanel.module.css';

function LoginPanel() {
  const { joinChatRoom, users, startDemoMode } = useChatContext();

  const params = parseUrlParams();
  const [username, setUsername] = useState(params.username || '');
  const [room, setRoom] = useState(params.room || '');
  const [language, setLanguage] = useState('en');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const trimmedUsername = username.trim();
    const trimmedRoom = room.trim() || DEMO_ROOM;

    if (!trimmedUsername) {
      setError('Please enter your username');
      return;
    }

    if (!trimmedRoom) {
      setError('Please enter a room name');
      return;
    }

    setError('');
    updateUrlParams(trimmedRoom, trimmedUsername);
    joinChatRoom(trimmedRoom, trimmedUsername, language);
  };

  const handleDemo = () => {
    const demoUsername = `Guest${Math.floor(Math.random() * 1000)}`;
    setUsername(demoUsername);
    setRoom(DEMO_ROOM);
    setLanguage('en');

    updateUrlParams(DEMO_ROOM, demoUsername);
    joinChatRoom(DEMO_ROOM, demoUsername, 'en');

    // Populate demo messages after joining
    startDemoMode();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleJoin();
  };

  return (
    <aside className={styles.loginPanel}>
      <header className={styles.header}>
        <h2>LinguaChat <span aria-hidden="true">💬</span></h2>
        <p className={styles.subtitle}>Chat in any language. Messages auto-translate for everyone!</p>
      </header>

      <div className={styles.instructions}>
        <h3>How it works:</h3>
        <ol>
          <li>Enter your name and a room</li>
          <li>Choose your language</li>
          <li>Start chatting - everyone sees messages in their language! 🌍</li>
        </ol>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <section className={styles.loginCard}>
        <div>
          <label htmlFor="username" className={styles.label}>Username:</label>
          <input
            id="username"
            type="text"
            placeholder="e.g., John, María, राज"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onKeyPress={handleKeyPress}
            className={styles.input}
            aria-label="Enter your username"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="room" className={styles.label}>Room Name:</label>
          <input
            id="room"
            type="text"
            placeholder="e.g., Team-Chat, Study-Group"
            value={room}
            onChange={(e) => { setRoom(e.target.value); setError(''); }}
            onKeyPress={handleKeyPress}
            className={styles.input}
            aria-label="Enter room name"
          />
          <p className={styles.helpText}>💡 Share the same room name with friends to chat together</p>
        </div>

        <div>
          <label htmlFor="language" className={styles.label}>Your Language:</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={styles.select}
            aria-label="Select your preferred language"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleJoin} className={styles.joinButton}>Join Room</button>
        <button onClick={handleDemo} className={styles.demoButton}>🎬 Try Demo (See it in action!)</button>

        <p className={styles.hint}>New here? Try the demo to see multilingual chat in action</p>
      </section>

      {users.length > 0 && (
        <section className={styles.presence}>
          <strong>People Online</strong>
          <ul>
            {users.map((user, index) => (
              <li key={index}>
                {user.username} <span className={styles.langBadge}>{user.lang}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export default LoginPanel;
