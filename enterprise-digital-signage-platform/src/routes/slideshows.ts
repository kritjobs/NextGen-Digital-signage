/**
 * Slideshow API Routes
 * CRUD slideshows + slides + publish to media library
 */
import { Router } from 'express';
import { db } from '../db/index.js';
import { slideshows, slideshowSlides, mediaItems } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import {
  authenticate, requirePermission, logAudit,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';
import { saveBase64ToFile } from '../services/storage.js';

export const slideshowRouter = Router();

// ─── GET /api/slideshows — List all slideshows ──────────────
slideshowRouter.get('/',
  authenticate as any, requirePermission('read:media') as any,
  async (_req, res, next) => {
    try {
      const rows = await db.query.slideshows.findMany({
        with: { slides: { with: { media: true } } },
        orderBy: [desc(slideshows.updatedAt)],
      });

      // Sanitize oversized base64 in slides
      for (const row of rows) {
        if (row.slides) {
          for (const slide of row.slides as any[]) {
            if (slide.backgroundUrl && slide.backgroundUrl.startsWith('data:') && slide.backgroundUrl.length > 5000) {
              slide.backgroundUrl = null;
            }
          }
        }
      }

      res.json({ data: rows, total: rows.length });
    } catch (e) { next(e); }
  });

// ─── GET /api/slideshows/:id — Get single slideshow ─────────
slideshowRouter.get('/:id',
  authenticate as any, requirePermission('read:media') as any,
  async (req, res, next) => {
    try {
      const row = await db.query.slideshows.findFirst({
        where: eq(slideshows.id, req.params.id),
        with: { slides: { with: { media: true } } },
      });
      if (!row) return res.status(404).json({ error: 'Slideshow not found' });

      // Sanitize: if any slide has a huge base64 backgroundUrl, strip it
      // (legacy data that should have been saved as file)
      if (row.slides) {
        for (const slide of row.slides as any[]) {
          if (slide.backgroundUrl && slide.backgroundUrl.startsWith('data:') && slide.backgroundUrl.length > 5000) {
            slide.backgroundUrl = null; // strip oversized base64 to prevent 500
          }
        }
      }

      res.json(row);
    } catch (e) { next(e); }
  });


// ─── POST /api/slideshows — Create slideshow ────────────────
slideshowRouter.post('/',
  authenticate as any, requirePermission('write:media') as any, writeLimiter,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { slides: slidesData, ...data } = req.body;
      const id = data.id || `sld-${Date.now()}`;

      const [slideshow] = await db.insert(slideshows).values({
        ...data, id,
        slideCount: slidesData?.length || 0,
        totalDuration: (slidesData || []).reduce((sum: number, s: any) => sum + (s.duration || data.slideDuration || 8), 0),
        createdBy: req.user?.userId,
        createdAt: new Date(), updatedAt: new Date(),
      }).returning();

      // Insert slides
      if (slidesData?.length) {
        await db.insert(slideshowSlides).values(
          slidesData.map((s: any, i: number) => {
            // Convert base64 backgroundUrl to file if needed
            let bgUrl = s.backgroundUrl || null;
            if (bgUrl && bgUrl.startsWith('data:')) {
              const saved = saveBase64ToFile(bgUrl, 'slide-bg');
              if (saved) bgUrl = saved;
            }
            return {
              id: s.id || `sls-${Date.now()}-${i}`,
              slideshowId: id,
              order: s.order ?? i + 1,
              mediaId: s.mediaId || null,
              backgroundUrl: bgUrl,
              backgroundColor: s.backgroundColor || '#000000',
              headlineText: s.headlineText || null,
              subtitleText: s.subtitleText || null,
              bodyText: s.bodyText || null,
              ctaText: s.ctaText || null,
              ctaUrl: s.ctaUrl || null,
              textPosition: s.textPosition || 'bottom-left',
              textColor: s.textColor || '#FFFFFF',
              overlayOpacity: s.overlayOpacity ?? 40,
              duration: s.duration || null,
              transition: s.transition || null,
              kenBurns: s.kenBurns ?? true,
              parallax: s.parallax ?? false,
            };
          })
        );
      }

      await logAudit(req, 'create', 'slideshow', id, { title: slideshow.title, slides: slidesData?.length });
      res.status(201).json(slideshow);
    } catch (e) { next(e); }
  });

// ─── PUT /api/slideshows/:id — Update slideshow + slides ────
slideshowRouter.put('/:id',
  authenticate as any, requirePermission('write:media') as any, writeLimiter,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { slides: slidesData, ...data } = req.body;

      const [slideshow] = await db.update(slideshows).set({
        ...data,
        slideCount: slidesData?.length ?? data.slideCount,
        totalDuration: slidesData
          ? slidesData.reduce((sum: number, s: any) => sum + (s.duration || data.slideDuration || 8), 0)
          : undefined,
        updatedAt: new Date(),
      }).where(eq(slideshows.id, req.params.id)).returning();

      if (!slideshow) return res.status(404).json({ error: 'Slideshow not found' });

      // Replace slides if provided
      if (slidesData) {
        await db.delete(slideshowSlides).where(eq(slideshowSlides.slideshowId, req.params.id));
        if (slidesData.length) {
          await db.insert(slideshowSlides).values(
            slidesData.map((s: any, i: number) => {
              // Convert base64 backgroundUrl to file if needed
              let bgUrl = s.backgroundUrl || null;
              if (bgUrl && bgUrl.startsWith('data:')) {
                const saved = saveBase64ToFile(bgUrl, 'slide-bg');
                if (saved) bgUrl = saved;
              }
              return {
                id: s.id || `sls-${Date.now()}-${i}`,
                slideshowId: req.params.id,
                order: s.order ?? i + 1,
                mediaId: s.mediaId || null,
                backgroundUrl: bgUrl,
                backgroundColor: s.backgroundColor || '#000000',
                headlineText: s.headlineText || null,
                subtitleText: s.subtitleText || null,
                bodyText: s.bodyText || null,
                ctaText: s.ctaText || null,
                ctaUrl: s.ctaUrl || null,
                textPosition: s.textPosition || 'bottom-left',
                textColor: s.textColor || '#FFFFFF',
                overlayOpacity: s.overlayOpacity ?? 40,
                duration: s.duration || null,
                transition: s.transition || null,
                kenBurns: s.kenBurns ?? true,
                parallax: s.parallax ?? false,
              };
            })
          );
        }
      }

      await logAudit(req, 'update', 'slideshow', req.params.id, { title: slideshow.title });
      res.json(slideshow);
    } catch (e) { next(e); }
  });

// ─── DELETE /api/slideshows/:id ─────────────────────────────
slideshowRouter.delete('/:id',
  authenticate as any, requirePermission('write:media') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      await db.delete(slideshows).where(eq(slideshows.id, req.params.id));
      await logAudit(req, 'delete', 'slideshow', req.params.id, {}, 'warning');
      res.json({ success: true, id: req.params.id });
    } catch (e) { next(e); }
  });


// ─── POST /api/slideshows/:id/publish — Publish as Media Item ─
// สร้าง media item type="slideshow" ใน Media Library
// เพื่อให้สามารถใส่ใน Playlist ได้ทันที
slideshowRouter.post('/:id/publish',
  authenticate as any, requirePermission('write:media') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      // Get slideshow with slides
      const slideshow = await db.query.slideshows.findFirst({
        where: eq(slideshows.id, req.params.id),
        with: { slides: { with: { media: true } } },
      });
      if (!slideshow) return res.status(404).json({ error: 'Slideshow not found' });
      if (slideshow.slides.length === 0) return res.status(400).json({ error: 'Slideshow has no slides' });

      // Use first slide's media as thumbnail
      const firstSlide = slideshow.slides.sort((a, b) => a.order - b.order)[0];
      const thumbnailUrl = firstSlide?.media?.thumbnailUrl || firstSlide?.media?.url || firstSlide?.backgroundUrl || '';

      const mediaId = slideshow.publishedMediaId || `med-sld-${Date.now()}`;

      // Create or update media item
      if (slideshow.publishedMediaId) {
        // Update existing
        await db.update(mediaItems).set({
          title: slideshow.title,
          duration: slideshow.totalDuration,
          thumbnailUrl,
          tags: [...(slideshow.tags || []), 'slideshow'],
          updatedAt: new Date(),
        }).where(eq(mediaItems.id, slideshow.publishedMediaId));
      } else {
        // Create new media item
        await db.insert(mediaItems).values({
          id: mediaId,
          title: `📊 ${slideshow.title}`,
          type: 'slideshow',
          url: `/api/slideshows/${slideshow.id}`,  // API endpoint as "url"
          duration: slideshow.totalDuration,
          sizeMb: '0',
          tags: [...(slideshow.tags || []), 'slideshow'],
          thumbnailUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Update slideshow status + publishedMediaId
      await db.update(slideshows).set({
        status: 'published',
        publishedMediaId: mediaId,
        updatedAt: new Date(),
      }).where(eq(slideshows.id, req.params.id));

      await logAudit(req, 'publish', 'slideshow', req.params.id, {
        title: slideshow.title, mediaId, slideCount: slideshow.slides.length,
      });

      res.json({
        success: true,
        message: `Slideshow "${slideshow.title}" published to Media Library`,
        mediaId,
        slideshowId: slideshow.id,
        status: 'published',
      });
    } catch (e) { next(e); }
  });

// ─── POST /api/slideshows/:id/unpublish — Remove from Media Library
slideshowRouter.post('/:id/unpublish',
  authenticate as any, requirePermission('write:media') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [slideshow] = await db.select().from(slideshows).where(eq(slideshows.id, req.params.id));
      if (!slideshow) return res.status(404).json({ error: 'Slideshow not found' });

      if (slideshow.publishedMediaId) {
        await db.delete(mediaItems).where(eq(mediaItems.id, slideshow.publishedMediaId));
      }

      await db.update(slideshows).set({
        status: 'draft',
        publishedMediaId: null,
        updatedAt: new Date(),
      }).where(eq(slideshows.id, req.params.id));

      res.json({ success: true, message: 'Slideshow unpublished', status: 'draft' });
    } catch (e) { next(e); }
  });
