import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { corsOrigins } from "./config/cors.ts";
import authRoutes from "./routes/auth.routes.ts";
import roomRoutes from "./routes/room.routes.ts";
import uploadRoutes from "./routes/upload.routes.ts";


const app = express();

const isTestEnv = process.env.NODE_ENV === "test";

// CORS MUST be first — before rate limiter or anything else
app.use(cors({
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

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

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.get("/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok" });
})
export default app;
