import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.ts";



const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.get("/healthcheck", (req, res) => {
  res.status(200).json({ status: "ok" });
})
export default app;
