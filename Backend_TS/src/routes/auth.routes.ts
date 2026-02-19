import { type NextFunction, type Request, type Response, Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.ts";
import { authenticateJwt, type AuthenticationRequest } from "../middlewares/auth.middleware.ts";
import upload from "../middlewares/uploadMiddleware.ts";
const router = Router();

const isTestEnv = process.env.NODE_ENV === "test";

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTestEnv,
});

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTestEnv,
});

const refreshLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => isTestEnv,
});



const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('profilePicture')(req, res, (err: any) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
};

router.post("/register", registerLimiter, uploadMiddleware, authController.register);
router.post("/login", loginLimiter, authController.login);
router.post("/refresh-token", refreshLimiter, authController.refreshToken);
router.post("/logout-session", authenticateJwt, authController.logoutSession);
router.post("/logout-all", authenticateJwt, authController.logoutAllSessions);
router.get("/sessions", authenticateJwt, authController.getActiveSessions);
router.get("/profile", authenticateJwt, (req: AuthenticationRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized: No user information found" });
    return;
  }
  res.json({ id: req.user.id, username: req.user.username, role: req.user.role });
})

export default router;
