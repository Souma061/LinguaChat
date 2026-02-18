const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://linguachat-frmz.onrender.com",
  "https://lingua-chat.vercel.app"
];

const envOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : [];

export const corsOrigins = [...new Set([...envOrigins, ...defaultOrigins])].filter(Boolean);
