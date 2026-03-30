import { Router } from 'express';
import { upload } from '../config/multer.config.ts';
import { uploadImage } from '../controllers/upload.controller.ts';
import { authenticateJwt } from '../middlewares/auth.middleware.ts';


const router = Router();

// POST /api/upload
// Uses multer middleware 'upload.single("image")' to handle multipart file upload
// The field name in the form data must be "image"
router.post('/', authenticateJwt, upload.single('image'), uploadImage);

export default router;
