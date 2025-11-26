import { createContext, useCallback, useEffect, useState } from "react";

const ThemeContext = createContext();

const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};
export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    // Get saved theme from localStorage
    const saved = localStorage.getItem("theme-mode");
    return saved || THEME_MODES.SYSTEM;
  });

  const [systemPreference, setSystemPreference] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    const effectiveTheme =
      themeMode === THEME_MODES.SYSTEM ? systemPreference : themeMode;

    document.documentElement.setAttribute("data-theme", effectiveTheme);
    localStorage.setItem("theme-mode", themeMode);
  }, [themeMode, systemPreference]);

  const toggleTheme = useCallback((mode) => {
    if (Object.values(THEME_MODES).includes(mode)) {
      setThemeMode(mode);
    }
  }, []);

  const value = {
    themeMode,
    toggleTheme,
    THEME_MODES,
    effectiveTheme:
      themeMode === THEME_MODES.SYSTEM ? systemPreference : themeMode,
  };
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export default ThemeContext;
