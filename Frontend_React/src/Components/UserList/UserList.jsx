import { useState } from "react";
import { useChatContext } from "../../hooks/useChatContext";
import { generateShareLink } from "../../utils/helper";
import ThemeToggler from "../ThemeToggler/ThemeToggler";
import styles from "./UserList.module.css";

function UserList() {
  const { users, userName, room, lang, changeLanguage } = useChatContext();
  const shareLink = generateShareLink(room, userName);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);


  return (
    <>
      {/* Desktop View */}
      <aside className={styles.userListDesktop}>
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

        <ThemeToggler />

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

      {/* Mobile Hamburger Menu */}
      <div className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={toggleMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <div className={`${styles.mobileDrawer} ${menuOpen ? styles.open : ''}`}>
        <button className={styles.closeBtn} onClick={toggleMenu}>✕</button>

        <div className={styles.languageSelector}>
          <label htmlFor="langSelectMobile">Your Language:</label>
          <select
            id="langSelectMobile"
            value={lang}
            onChange={(e) => {
              changeLanguage(e.target.value);
              setMenuOpen(false);
            }}
            className={styles.select}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="bn">Bengali</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        <ThemeToggler />

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
      </div>

      {/* Mobile Overlay */}
      {menuOpen && <div className={styles.overlay} onClick={toggleMenu}></div>}
    </>
  );
}

export default UserList;
