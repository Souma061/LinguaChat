import { useContext } from "react";
import ThemeContext from "../../context/ThemeContext";
import styles from "./ThemeToggler.module.css";

function ThemeToggler() {
  const { themeMode, toggleTheme, THEME_MODES } = useContext(ThemeContext);

  return (
    <div className={styles.container}>
      <div className={styles.label}>Theme</div>
      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${themeMode === THEME_MODES.SYSTEM ? styles.active : ""}`}
          onClick={() => toggleTheme(THEME_MODES.SYSTEM)}
          title="Use system preference"
        >
          💻
        </button>
        <button
          className={`${styles.btn} ${themeMode === THEME_MODES.LIGHT ? styles.active : ""}`}
          onClick={() => toggleTheme(THEME_MODES.LIGHT)}
          title="Light mode"
        >
          ☀️
        </button>
        <button
          className={`${styles.btn} ${themeMode === THEME_MODES.DARK ? styles.active : ""}`}
          onClick={() => toggleTheme(THEME_MODES.DARK)}
          title="Dark mode"
        >
          🌙
        </button>
      </div>
    </div>
  );
}

export default ThemeToggler;
