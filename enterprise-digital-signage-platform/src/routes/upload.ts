/**
 * Media Upload Routes
 * POST /api/media/upload     — อัปโหลดไฟล์ (single/multiple)
 * GET  /api/storage/status   — ดู storage usage
 * DELETE /api/media/:id/file — ลบไฟล์จาก disk
 */
import { Router } from 'express';
import { db } from '../db/index.js';
import { mediaItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  upload, getFileUrl, deleteFile,
  getStorageUsage, checkQuota,
} from '../services/storage.js';
import { optimizeImage, getOptimizedUrl } from '../services/imageOptimizer.js';
import { UPLOAD_DIR } from '../services/storage.js';
import {
  authenticate, requirePermission, logAudit,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

export const uploadRouter = Router();

// ─── POST /api/media/upload ──────────────────────────────────
// Accepts: multipart/form-data
// Fields: file (required), title, type, duration, tags
uploadRouter.post('/upload',
  authenticate as any,
  requirePermission('write:media') as any,
  writeLimiter,
  (req, res, next) => {
    // Check quota before accepting file
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const quota = checkQuota(contentLength);
    if (!quota.allowed) {
      return res.status(507).json({
        error: quota.message,
        code: 'STORAGE_QUOTA_EXCEEDED',
        storage: getStorageUsage(),
      });
    }
    next();
  },
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided. Use form field name "file".',
          code: 'NO_FILE',
        });
      }

      const file = req.file;
      const fileUrl = getFileUrl(file.path);
      const mediaId = `med-${Date.now()}-${uuidv4().slice(0, 8)}`;

      // Determine media type from mimetype
      let mediaType = 'image';
      if (file.mimetype.startsWith('video/')) mediaType = 'video';

      // Image optimization (auto-compress + WebP + thumbnail)
      let finalUrl = fileUrl;
      let thumbnailUrl = mediaType === 'image' ? fileUrl : `https://placehold.co/400x225/0f172a/a855f7?text=${encodeURIComponent((req.body.title || file.originalname).slice(0, 20))}`;
      let finalSize = file.size;
      let optimizeInfo: any = null;

      if (mediaType === 'image') {
        const result = await optimizeImage(file.path);
        if (result) {
          finalUrl = getOptimizedUrl(result.optimizedPath, UPLOAD_DIR);
          thumbnailUrl = getOptimizedUrl(result.thumbnailPath, UPLOAD_DIR);
          finalSize = result.optimizedSize;
          optimizeInfo = { original: result.originalSize, optimized: result.optimizedSize, savings: result.savings, format: result.format };
        }
      }

      // Metadata from form body
      const title = req.body.title || file.originalname;
      const duration = parseInt(req.body.duration || '15', 10);
      const tags = req.body.tags
        ? (typeof req.body.tags === 'string' ? req.body.tags.split(',').map((t: string) => t.trim()) : req.body.tags)
        : [];

      // Insert into database
      const [record] = await db.insert(mediaItems).values({
        id: mediaId,
        title,
        type: req.body.type || mediaType,
        url: finalUrl,
        thumbnailUrl,
        duration,
        sizeMb: (finalSize / (1024 * 1024)).toFixed(2),
        tags,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      await logAudit(req, 'upload', 'media', mediaId, {
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        storedAs: fileUrl,
      });

      res.status(201).json({
        success: true,
        media: record,
        file: {
          originalName: file.originalname,
          storedUrl: finalUrl,
          thumbnailUrl,
          size: file.size,
          optimizedSize: finalSize,
          mimetype: file.mimetype,
        },
        optimization: optimizeInfo,
      });
    } catch (err: any) {
      console.error('[Upload] Error:', err.message);
      res.status(500).json({ error: 'Upload failed: ' + err.message, code: 'UPLOAD_ERROR' });
    }
  }
);


// ─── POST /api/media/upload-multiple ─────────────────────────
uploadRouter.post('/upload-multiple',
  authenticate as any,
  requirePermission('write:media') as any,
  writeLimiter,
  upload.array('files', 5),
  async (req: AuthenticatedRequest, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files provided', code: 'NO_FILE' });
      }

      const results = [];
      for (const file of files) {
        const fileUrl = getFileUrl(file.path);
        const mediaId = `med-${Date.now()}-${uuidv4().slice(0, 8)}`;
        let mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';

        const [record] = await db.insert(mediaItems).values({
          id: mediaId,
          title: file.originalname,
          type: mediaType,
          url: fileUrl,
          thumbnailUrl: mediaType === 'image' ? fileUrl : '',
          duration: mediaType === 'video' ? 30 : 15,
          sizeMb: (file.size / (1024 * 1024)).toFixed(2),
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        results.push({ media: record, file: { originalName: file.originalname, storedUrl: fileUrl, size: file.size } });
      }

      await logAudit(req, 'upload_multiple', 'media', null as any, { count: files.length });

      res.status(201).json({ success: true, uploaded: results.length, results });
    } catch (err: any) {
      res.status(500).json({ error: 'Multi-upload failed: ' + err.message, code: 'UPLOAD_ERROR' });
    }
  }
);

// ─── GET /api/storage/status ─────────────────────────────────
uploadRouter.get('/storage/status',
  authenticate as any,
  requirePermission('read:media') as any,
  async (_req, res) => {
    res.json(getStorageUsage());
  }
);

// ─── DELETE /api/media/:id/file ──────────────────────────────
uploadRouter.delete('/:id/file',
  authenticate as any,
  requirePermission('write:media') as any,
  async (req: AuthenticatedRequest, res) => {
    try {
      const [media] = await db.select().from(mediaItems).where(eq(mediaItems.id, req.params.id));
      if (!media) return res.status(404).json({ error: 'Media not found' });

      // Delete file from disk
      if (media.url && media.url.startsWith('/uploads/')) {
        deleteFile(media.url);
      }

      // Delete DB record
      await db.delete(mediaItems).where(eq(mediaItems.id, req.params.id));

      await logAudit(req, 'delete', 'media', req.params.id, { url: media.url }, 'warning');
      res.json({ success: true, id: req.params.id, fileDeleted: true });
    } catch (err: any) {
      res.status(500).json({ error: 'Delete failed: ' + err.message });
    }
  }
);
