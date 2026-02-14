import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.ts";
import roomRoutes from "./routes/room.routes.ts";


const app = express();

const isTestEnv = process.env.NODE_ENV === "test";

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

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.get("/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok" });
})
export default app;
