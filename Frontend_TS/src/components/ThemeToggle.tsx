import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div key={theme} className="animate-theme-toggle">
        {isDark ? (
          <Sun className="h-5 w-5" weight="bold" />
        ) : (
          <Moon className="h-5 w-5" weight="bold" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
