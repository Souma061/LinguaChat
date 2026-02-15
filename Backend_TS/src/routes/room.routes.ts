import { Router } from "express";
import * as roomControllers from "../controllers/roomControllers.ts";
import { authenticateJwt } from "../middlewares/auth.middleware.ts";

const router = Router();

router.get("/", authenticateJwt, roomControllers.getPublicRooms);
router.get("/search", authenticateJwt, roomControllers.searchRoomsByName);
router.get("/:id", authenticateJwt, roomControllers.getRoomById);
router.patch("/:id/mode", authenticateJwt, roomControllers.updateRoomMode);

export default router;
