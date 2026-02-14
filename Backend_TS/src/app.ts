import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.ts";
import roomRoutes from "./routes/room.routes.ts";


const app = express();

const isTestEnv = process.env.NODE_ENV === "test";
const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

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
  methods: ["GET", "POST", "PUT", "DELETE"],
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
