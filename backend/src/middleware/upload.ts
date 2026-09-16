import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { UPLOAD_RULES } from '../utils/constants';

fs.mkdirSync(env.uploadDirAbsolute, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDirAbsolute),
  filename: (_req, file, cb) => {
    // Random stored name: the user's filename never touches the filesystem path.
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

export const uploadSalarySlip = multer({
  storage,
  limits: { fileSize: UPLOAD_RULES.MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = (UPLOAD_RULES.ALLOWED_MIME_TYPES as readonly string[]).includes(file.mimetype);
    const extOk = (UPLOAD_RULES.ALLOWED_EXTENSIONS as readonly string[]).includes(ext);
    // Both must agree, so a renamed .exe cannot ride in on a PDF mime type.
    if (mimeOk && extOk) {
      cb(null, true);
      return;
    }
    cb(ApiError.badRequest('Only PDF, JPG or PNG files are accepted'));
  },
}).single('salarySlip');
