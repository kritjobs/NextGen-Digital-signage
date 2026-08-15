/**
 * AI API Routes
 * POST /api/ai/generate       — Generate content (text/image)
 * GET  /api/ai/providers      — List providers
 * POST /api/ai/providers      — Add provider
 * PUT  /api/ai/providers/:id  — Update provider
 * DELETE /api/ai/providers/:id
 * POST /api/ai/providers/:id/test — Test connection
 * GET  /api/ai/tasks          — List task configs
 * PUT  /api/ai/tasks/:id      — Update task config
 */
import { Router } from 'express';
import { db } from '../db/index.js';
import { aiProviders, aiTaskConfigs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { aiGenerate, testProvider } from '../services/aiRouter.js';
import { saveBase64ToFile } from '../services/storage.js';
import {
  authenticate, requireRole, requirePermission,
  logAudit, AuthenticatedRequest,
} from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

export const aiRouter = Router();

// ─── POST /api/ai/generate — Main AI generation endpoint ────
aiRouter.post('/generate',
  authenticate as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { task, prompt, systemPrompt, options } = req.body;
      if (!task || !prompt) return res.status(400).json({ error: 'task and prompt are required' });

      const result = await aiGenerate({ task, prompt, systemPrompt, options });

      // If image generation returned base64, save to file and return URL
      if (result.success && result.imageUrl && result.imageUrl.startsWith('data:')) {
        const fileUrl = saveBase64ToFile(result.imageUrl, 'ai-gen');
        if (fileUrl) {
          result.imageUrl = fileUrl;
        }
      }

      if (result.success) {
        await logAudit(req, 'ai_generate', 'ai', task, { model: result.model, provider: result.provider, tokensUsed: result.tokensUsed });
      }

      res.json(result);
    } catch (e) { next(e); }
  });

// ─── GET /api/ai/providers ──────────────────────────────────
aiRouter.get('/providers',
  authenticate as any, requireRole('admin', 'super_admin') as any,
  async (_req, res, next) => {
    try {
      const rows = await db.select().from(aiProviders).orderBy(aiProviders.name);
      // Mask API keys (show only last 4 chars)
      const masked = rows.map(r => ({
        ...r,
        apiKey: r.apiKey ? `${'•'.repeat(20)}${r.apiKey.slice(-4)}` : null,
        apiKeySet: !!r.apiKey,
      }));
      res.json({ data: masked, total: masked.length });
    } catch (e) { next(e); }
  });

// ─── POST /api/ai/providers ─────────────────────────────────
aiRouter.post('/providers',
  authenticate as any, requireRole('admin', 'super_admin') as any, writeLimiter,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { id, name, type, baseUrl, apiKey, models } = req.body;
      const [row] = await db.insert(aiProviders).values({
        id: id || `aip-${Date.now()}`, name, type, baseUrl,
        apiKey: apiKey || null, models: models || [], isEnabled: true,
        lastTestStatus: 'untested',
      }).returning();
      await logAudit(req, 'create', 'ai_provider', row.id, { name, type });
      res.status(201).json(row);
    } catch (e) { next(e); }
  });

// ─── PUT /api/ai/providers/:id ──────────────────────────────
aiRouter.put('/providers/:id',
  authenticate as any, requireRole('admin', 'super_admin') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { apiKey, ...data } = req.body;
      const updateData: any = { ...data, updatedAt: new Date() };
      // Only update apiKey if explicitly provided (not masked)
      if (apiKey && !apiKey.startsWith('•')) updateData.apiKey = apiKey;
      const [row] = await db.update(aiProviders).set(updateData).where(eq(aiProviders.id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: 'Provider not found' });
      res.json(row);
    } catch (e) { next(e); }
  });

// ─── DELETE /api/ai/providers/:id ───────────────────────────
aiRouter.delete('/providers/:id',
  authenticate as any, requireRole('super_admin') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      await db.delete(aiProviders).where(eq(aiProviders.id, req.params.id));
      await logAudit(req, 'delete', 'ai_provider', req.params.id, {}, 'warning');
      res.json({ success: true });
    } catch (e) { next(e); }
  });

// ─── POST /api/ai/providers/:id/test ────────────────────────
aiRouter.post('/providers/:id/test',
  authenticate as any, requireRole('admin', 'super_admin') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await testProvider(req.params.id);
      // Update test status in DB
      await db.update(aiProviders).set({
        lastTestedAt: new Date(),
        lastTestStatus: result.success ? 'success' : 'failed',
        updatedAt: new Date(),
      }).where(eq(aiProviders.id, req.params.id));
      res.json(result);
    } catch (e) { next(e); }
  });

// ─── GET /api/ai/tasks ──────────────────────────────────────
aiRouter.get('/tasks',
  authenticate as any, requireRole('admin', 'super_admin') as any,
  async (_req, res, next) => {
    try {
      const rows = await db.query.aiTaskConfigs.findMany({ with: { provider: true } });
      res.json({ data: rows, total: rows.length });
    } catch (e) { next(e); }
  });

// ─── PUT /api/ai/tasks/:id ──────────────────────────────────
aiRouter.put('/tasks/:id',
  authenticate as any, requireRole('admin', 'super_admin') as any,
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const [row] = await db.update(aiTaskConfigs).set({
        ...req.body, updatedAt: new Date(),
      }).where(eq(aiTaskConfigs.id, req.params.id)).returning();
      if (!row) return res.status(404).json({ error: 'Task config not found' });
      res.json(row);
    } catch (e) { next(e); }
  });
