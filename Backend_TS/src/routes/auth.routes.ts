import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticateJwt, type AuthenticationRequest } from "../middlewares/auth.middleware";
const router = Router();


router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout-session", authenticateJwt, authController.logoutSession);
router.post("/logout-all", authenticateJwt, authController.logoutAllSessions);
router.get("/sessions", authenticateJwt, authController.getActiveSessions);
router.get("/profile", authenticateJwt, (req: AuthenticationRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: No user information found" });
    return;
  }
  res.json({ id: req.user.id, role: req.user.role });
})

export default router;
