import type { Request } from 'express';
import fs from 'fs';
import type { FileFilterCallback } from 'multer';
import multer from 'multer';
import path from 'path';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    // preserve extension
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    // sanitize filename
    const sanitized = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${Date.now()}-${sanitized}${ext}`);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      cb(new Error('Only image files are allowed!'));
      return;
    }
    cb(null, true);
  },
});
