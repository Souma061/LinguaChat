import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import api from "../services/api";

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, refreshToken?: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseStoredUser = (): User | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => parseStoredUser());
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken"),
  );

  const login = (
    nextToken: string,
    nextUser: User,
    nextRefreshToken?: string,
  ) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("accessToken", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
    if (nextRefreshToken) {
      localStorage.setItem("refreshToken", nextRefreshToken);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
  };

  const refreshAccessToken = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) return;

    try {
      const res = await api.post("/auth/refresh-token", {
        refreshToken: storedRefreshToken,
      });
      const { accessToken: newToken } = res.data;
      setToken(newToken);
      localStorage.setItem("accessToken", newToken);
    } catch {
      // Refresh token expired — force logout
      logout();
    }
  }, []);

  // Auto-refresh access token every 23 hours (before the 24h expiry)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(
      () => {
        refreshAccessToken();
      },
      23 * 60 * 60 * 1000,
    ); // 23 hours
    return () => clearInterval(interval);
  }, [token, refreshAccessToken]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login,
      logout,
      refreshAccessToken,
      isAuthenticated: Boolean(token && user),
    }),
    [token, user, refreshAccessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
