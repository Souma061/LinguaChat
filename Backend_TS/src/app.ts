import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.ts";
import roomRoutes from "./routes/room.routes.ts";


const app = express();

const isTestEnv = process.env.NODE_ENV === "test";
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

const corsOrigins = [...new Set([...envOrigins, ...defaultOrigins])].filter(Boolean);

console.log("Allowed CORS Origins (App):", corsOrigins);

if (!isTestEnv) {
  app.set("trust proxy", 1);
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    })
  );
}

app.use(cors({
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}))
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.get("/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok" });
})
export default app;
