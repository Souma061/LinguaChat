import { Router } from "express";
import * as roomControllers from "../controllers/roomControllers.ts";
import { authenticateJwt } from "../middlewares/auth.middleware.ts";

const router = Router();

router.get("/",authenticateJwt,roomControllers.getPublicRooms);

export default router;
