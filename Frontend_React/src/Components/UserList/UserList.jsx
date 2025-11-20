import { useChatContext } from "../../hooks/useChatContext";
import { generateShareLink } from "../../utils/helper";
import styles from "./UserList.module.css";

function UserList() {
  const { users, userName, room, lang, changeLanguage } = useChatContext();
  const shareLink = generateShareLink(room, userName);


  return (
    <aside className={styles.userList}>
      <div className={styles.languageSelector}>
        <label htmlFor="langSelect">Your Language:</label>
        <select
          id="langSelect"
          value={lang}
          onChange={(e) => changeLanguage(e.target.value)}
          className={styles.select}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="bn">Bengali</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>

      {room && (
        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>📤 Share this room:</p>
          <a href={shareLink} target="_blank" rel="noopener" className={styles.shareLink}>
            {shareLink}
          </a>
        </div>
      )}

      <div className={styles.usersSection}>
        <strong>People ({users.length})</strong>
        {users.length === 0 ? (
          <p className={styles.hint}>Waiting for others to join...</p>
        ) : (
          <ul className={styles.usersList}>
            {users.map((user, index) => (
              <li key={index}>
                {user.username === userName ? `${user.username} (you)` : user.username}
                <span className={styles.langBadge}>{user.lang}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default UserList
