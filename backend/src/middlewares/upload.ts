import fs from 'fs';
import path from 'path';
import type { Request } from 'express';
import multer from 'multer';

export const UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function sanitizeFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const base = path
    .basename(filename, ext)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
  return `${Date.now()}-${base}${ext}`;
}

export function documentUploadDir(projectId: string): string {
  return path.join(UPLOAD_ROOT, 'projects', projectId);
}

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    const dir = documentUploadDir(req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  },
});

export const projectFileUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

export function avatarUploadDir(): string {
  return path.join(UPLOAD_ROOT, 'avatars');
}

const avatarStorage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = avatarUploadDir();
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    cb(null, sanitizeFilename(file.originalname));
  },
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
    }
  },
});