/**
 * Storage Service — File upload management
 * รองรับ local disk (Docker Volume) ตอนนี้
 * อนาคตเปลี่ยนเป็น S3/MinIO ได้โดยแก้ adapter นี้
 */
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// ─── Config ─────────────────────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/uploads';
const MAX_FILE_SIZE = 500 * 1024 * 1024;   // 500 MB per file
const STORAGE_QUOTA = 100 * 1024 * 1024 * 1024; // 100 GB total

const ALLOWED_TYPES: Record<string, string[]> = {
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
};

const ALL_ALLOWED = [...ALLOWED_TYPES.video, ...ALLOWED_TYPES.image];

// ─── Ensure upload directory exists ─────────────────────────
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ─── Get current storage usage (bytes) ──────────────────────
function getDirectorySize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);
    if (item.isDirectory()) {
      totalSize += getDirectorySize(fullPath);
    } else {
      totalSize += fs.statSync(fullPath).size;
    }
  }
  return totalSize;
}

export function getStorageUsage() {
  const usedBytes = getDirectorySize(UPLOAD_DIR);
  return {
    usedBytes,
    usedMB: Math.round(usedBytes / (1024 * 1024)),
    usedGB: (usedBytes / (1024 * 1024 * 1024)).toFixed(2),
    quotaGB: (STORAGE_QUOTA / (1024 * 1024 * 1024)).toFixed(0),
    percentUsed: ((usedBytes / STORAGE_QUOTA) * 100).toFixed(1),
    available: STORAGE_QUOTA - usedBytes > 0,
  };
}


// ─── Multer Storage Engine ──────────────────────────────────
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dir = path.join(UPLOAD_DIR, year, month);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

// ─── File Filter ────────────────────────────────────────────
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}. Allowed: video (mp4/webm/ogg) and image (jpg/png/webp/gif)`));
  }
};

// ─── Export Multer Instance ─────────────────────────────────
export const upload = multer({
  storage: diskStorage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // max 5 files per request
  },
});

// ─── Get file URL path (relative for serving) ───────────────
export function getFileUrl(filePath: string): string {
  // Convert absolute path to URL: /app/uploads/2026/08/uuid.mp4 → /uploads/2026/08/uuid.mp4
  const relative = path.relative(UPLOAD_DIR, filePath).replace(/\\/g, '/');
  return `/uploads/${relative}`;
}

// ─── Delete file from storage ───────────────────────────────
export function deleteFile(fileUrl: string): boolean {
  try {
    // Convert URL back to path: /uploads/2026/08/uuid.mp4 → /app/uploads/2026/08/uuid.mp4
    const relative = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(UPLOAD_DIR, relative);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Check quota before upload ──────────────────────────────
export function checkQuota(incomingBytes: number): { allowed: boolean; message?: string } {
  const usage = getStorageUsage();
  if (!usage.available) {
    return { allowed: false, message: `Storage quota exceeded (${usage.usedGB} GB / ${usage.quotaGB} GB)` };
  }
  if (usage.usedBytes + incomingBytes > STORAGE_QUOTA) {
    return { allowed: false, message: `Upload would exceed quota. Used: ${usage.usedGB} GB, Quota: ${usage.quotaGB} GB` };
  }
  return { allowed: true };
}

// ─── Save base64 data URI to file ───────────────────────────
export function saveBase64ToFile(dataUri: string, prefix: string = 'ai'): string | null {
  try {
    const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/s);
    if (!match) return null;

    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType === 'image/png' ? '.png'
      : mimeType === 'image/jpeg' ? '.jpg'
      : mimeType === 'image/webp' ? '.webp'
      : mimeType === 'image/gif' ? '.gif'
      : '.png';

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const dir = path.join(UPLOAD_DIR, year, month);
    ensureDir(dir);

    const filename = `${prefix}-${uuidv4()}${ext}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    return getFileUrl(filePath);
  } catch (err) {
    console.error('[Storage] Failed to save base64:', err);
    return null;
  }
}

// ─── Constants export ───────────────────────────────────────
export { UPLOAD_DIR, MAX_FILE_SIZE, STORAGE_QUOTA, ALLOWED_TYPES };
