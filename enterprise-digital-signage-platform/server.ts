import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns/promises';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { db, checkDbConnection, pool } from './src/db/index.js';
import {
  screens, mediaItems, layouts, layoutZones,
  playlists, playlistItems, schedules, campaigns,
  emergencyAlerts, telemetryLogs, proofOfPlayLogs, layoutVersions, auditLogs,
} from './src/db/schema.js';
import { eq, desc, asc, sql, and } from 'drizzle-orm';
import { priorityLevelOf, priorityRankOf } from './src/types/signage.js';
// i18n — server-side telemetry event messages (same dictionaries as the client)
import { translate, isSupportedLanguage } from './src/i18n/index.js';
import type { TranslationKey, TranslationVars } from './src/i18n/index.js';
import { heartbeatEventKey } from './src/i18n/telemetry.js';
import { createServer as createViteServer } from 'vite';

// ─── Security imports ────────────────────────────────────────
import {
  authenticate, optionalAuth, requireRole,
  requirePermission, logAudit, verifyAccessToken,
  webhookAuth, JWT_SECRET,
  AuthenticatedRequest,
} from './src/middleware/auth.js';
import { validateBody } from './src/middleware/validate.js';
import {
  CreateScreenSchema, UpdateScreenSchema,
  CreateMediaSchema, CreatePlaylistSchema, UpdatePlaylistSchema,
  CreateScheduleSchema, UpdateScheduleSchema,
  CreateCampaignSchema, UpdateCampaignSchema,
  TriggerEmergencySchema, ClearEmergencySchema,
  SendCommandSchema, HeartbeatSchema, ProofOfPlaySchema,
} from './src/middleware/validate.js';
import {
  generalLimiter, emergencyLimiter, commandLimiter,
  telemetryLimiter, writeLimiter, interactLimiter,
} from './src/middleware/rateLimiter.js';
import { authRouter } from './src/routes/auth.js';
import { uploadRouter } from './src/routes/upload.js';
import { slideshowRouter } from './src/routes/slideshows.js';
import { aiRouter } from './src/routes/ai.js';
import { UPLOAD_DIR } from './src/services/storage.js';
import {
  BACKUP_DIR, BACKUP_HOUR, BACKUP_RETENTION_DAYS,
  listBackups, runBackup, deleteBackupFile, resolveBackupFile, startBackupScheduler,
} from './src/services/backup.js';

// ─── Config ──────────────────────────────────────────────────
const __dirname = typeof __filename !== 'undefined'
  ? path.dirname(__filename)
  : path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.APP_PORT ?? process.env.PORT ?? 3100);
const WS_PATH = process.env.WS_PATH ?? '/ws';
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── SSRF Guard (block requests to private/internal networks) ──
function isPrivateIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return true;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true;                    // 0.0.0.0/8, 10/8, loopback
  if (a === 169 && b === 254) return true;                              // link-local / cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true;                     // 172.16/12
  if (a === 192 && b === 168) return true;                              // 192.168/16
  if (a === 100 && b >= 64 && b <= 127) return true;                    // CGNAT 100.64/10
  return false;
}

async function isPublicUrl(rawUrl: string): Promise<boolean> {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host === 'metadata.google.internal') return false;
    // Literal IPv4 literal — check directly
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return !isPrivateIp(host);
    // Resolve hostname and reject if ANY resolved address is private
    const addrs = await dns.lookup(host, { all: true });
    return !addrs.some((a) => isPrivateIp(a.address));
  } catch {
    return false;
  }
}

// ─── Client IP helper (ใช้เก็บ IP จริงของจอตอน pair / heartbeat) ──
function getClientIp(req: express.Request): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) {
    // เอา IP แรกสุด (client จริง) ถ้ามีหลาย hop
    return fwd.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}


async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // ─── Global Middleware ─────────────────────────────────
  app.set('trust proxy', 1);
  app.use(helmet({
    contentSecurityPolicy: false,   // ปิด CSP — media URL จาก external ต้องโหลดได้
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: true,   // อนุญาตทุก origin (สำหรับ internal network)
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(IS_PROD ? 'combined' : 'dev'));
  if (IS_PROD) app.use(generalLimiter); // Disabled in dev for convenience

  // ─── WebSocket Hub (with Auth) ─────────────────────────
  const wss = new WebSocketServer({ server: httpServer, path: WS_PATH });
  const connectedClients = new Map<WebSocket, { userId?: string; role?: string }>();

  wss.on('connection', (ws, req) => {
    // Authenticate WebSocket via query param ?token=xxx
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    let wsUser: { userId?: string; role?: string } = {};

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        wsUser = { userId: payload.userId, role: payload.role };
      }
    }
    // Allow anonymous connections for Player devices (they use API key for REST)
    connectedClients.set(ws, wsUser);
    console.log(`[WS] Connected (${wsUser.role || 'anonymous'}). Total: ${connectedClients.size}`);

    ws.send(JSON.stringify({
      type: 'INIT_CONNECTED',
      timestamp: new Date().toISOString(),
      authenticated: !!wsUser.userId,
      message: 'Connected to Enterprise Digital Signage Realtime Hub',
    }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        // ⚠️ Security: anonymous connections (player devices / kiosks) are RECEIVE-ONLY.
        // Only authenticated users may relay broadcast messages (e.g. EMERGENCY_TRIGGERED,
        // QUICK_POST, SCREEN_COMMAND) to other clients through the hub.
        if (!wsUser.userId) return;
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(msg));
        });
      } catch { /* ignore */ }
    });

    ws.on('close', () => {
      connectedClients.delete(ws);
      console.log(`[WS] Disconnected. Total: ${connectedClients.size}`);
    });
  });

  function broadcast(type: string, payload: unknown) {
    const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(data); });
  }

  // ═══════════════════════════════════════════════════════════
  // SERVER-SIDE SCHEDULER (REQ-003)
  // ─── ตัดสินใจจากฝั่ง server ว่าจอควรโชว์อะไรตามเวลา ───
  // ═══════════════════════════════════════════════════════════

  function localDateStr(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }
  function localTimeStr(d: Date): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  // หา schedule ที่ active สำหรับจอหนึ่ง ณ เวลานี้
  // กฎ: isActive + ช่วงวันที่ + วันในสัปดาห์ + ช่วงเวลา + เป้าหมาย (ทุกจอ / จอที่ระบุ / กลุ่ม)
  // ถ้าชนกันหลายรายการ → REQ-006: เลือกตาม 6-Level Priority ก่อน (emergency > critical > scheduled > campaign > default > standby)
  // แล้วค่อยเทียบตัวเลข priority ภายในระดับเดียวกัน (เลขมาก = สำคัญกว่า)
  async function getActiveScheduleForScreen(screenId: string, now: Date): Promise<(typeof schedules.$inferSelect) | null> {
    const [screen] = await db.select().from(screens).where(eq(screens.id, screenId));
    if (!screen) return null;

    const today = localDateStr(now);
    const nowTime = localTimeStr(now);
    const day = now.getDay(); // 0 = Sunday

    const rows = await db.select().from(schedules).where(eq(schedules.isActive, true));
    let best: (typeof schedules.$inferSelect) | null = null;

    for (const s of rows) {
      // schedule ต้องมีอะไรให้เล่นจริง (layout หรือ playlist) อย่างน้อยหนึ่งอย่าง
      if (!s.layoutId && !s.playlistId) continue;
      // ช่วงวันที่
      if (today < s.startDate || today > s.endDate) continue;
      // วันในสัปดาห์
      if (s.daysOfWeek && s.daysOfWeek.length && !s.daysOfWeek.includes(day)) continue;
      // ช่วงเวลา (เทียบ HH:MM)
      const st = (s.startTime ?? '00:00').slice(0, 5);
      const et = (s.endTime ?? '23:59').slice(0, 5);
      if (nowTime < st || nowTime > et) continue;
      // เป้าหมาย: ไม่ระบุ = ทุกจอ | ระบุ screenIds | ระบุกลุ่ม
      const targetsAll = (!s.screenIds || s.screenIds.length === 0) && (!s.screenGroupIds || s.screenGroupIds.length === 0);
      const targetsScreen = s.screenIds?.includes(screenId);
      const targetsGroup = s.screenGroupIds?.includes(screen.group ?? '');
      if (!targetsAll && !targetsScreen && !targetsGroup) continue;
      // REQ-006: เทียบระดับ (6-Level) ก่อน แล้วค่อยเทียบตัวเลขในระดับเดียวกัน
      const sRank = priorityRankOf(s.priority);
      const bestRank = best ? priorityRankOf(best.priority) : -1;
      if (!best || sRank > bestRank || (sRank === bestRank && s.priority > best.priority)) best = s;
    }
    return best;
  }

  // REQ-011: campaign ที่ active (global — ใช้กับทุกจอ; ถ้ามีหลายอันเลือกอันล่าสุด)
  async function getActiveCampaign(): Promise<(typeof campaigns.$inferSelect) | null> {
    const rows = await db.select().from(campaigns).where(eq(campaigns.isActive, true));
    if (!rows.length) return null;
    return rows.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
  }

  // campaign มี priority กลาง band campaign (21-40) — schedule ระดับเดียวกันต้องชนะ/แพ้ตามตัวเลข
  const CAMPAIGN_DEFAULT_PRIORITY = 30;

  // REQ-011: คำนวณ layout ปัจจุบันของ campaign (server-side rotation ตามเวลาตั้งแต่ createdAt)
  function campaignCurrentLayoutId(c: { layoutSequence: unknown; cycleMode: string; createdAt: Date }, now: Date): string | null {
    const seq: { layoutId: string; durationSec?: number }[] = Array.isArray(c.layoutSequence)
      ? (c.layoutSequence as any[]).filter((i: any) => i && i.layoutId)
      : [];
    if (!seq.length) return null;
    if (c.cycleMode === 'random') return seq[Math.floor(Math.random() * seq.length)].layoutId;
    const totalSec = seq.reduce((s, i) => s + (Number(i.durationSec) || 0), 0);
    if (!totalSec) return seq[0].layoutId;
    const epoch = new Date(c.createdAt).getTime();
    let elapsed = ((now.getTime() - epoch) % (totalSec * 1000)) / 1000;
    if (elapsed < 0) elapsed += totalSec;
    for (const i of seq) {
      const d = Number(i.durationSec) || 0;
      if (elapsed < d) return i.layoutId;
      elapsed -= d;
    }
    return seq[seq.length - 1].layoutId;
  }

  // ผลลัพธ์สุดท้ายว่าจอควรได้ layout/playlist ไหน (REQ-006/011: schedule > campaign > default ตามระดับ priority)
  // ลำดับการตัดสิน: schedule (ระดับตามตัวเลข) เทียบกับ campaign (ระดับ campaign, เลข 30) → ระดับสูงกว่าชนะ,
  // เท่ากัน → เลขสูงกว่าชนะ, เท่ากันอีก → schedule ชนะ (เจาะจงกว่าจอ)
  // Media Expiration + Embargo: media จะแสดงบนจอได้ก็ต่อเมื่อ
  // (1) ถึงวันเปิดตัวแล้ว (releaseDate <= now) และ (2) ยังไม่หมดอายุ (expiresAt > now)
  function isMediaPlayable(m: { expiresAt: Date | null; releaseDate: Date | null }, now: Date): boolean {
    if (m.releaseDate && new Date(m.releaseDate) > now) return false; // ยังไม่ถึงวันเปิดตัว
    if (m.expiresAt && new Date(m.expiresAt) <= now) return false;    // หมดอายุแล้ว
    return true;
  }

  // ── Content Approval: content จะขึ้นจอได้ก็ต่อเมื่อ status=published + approvalStatus=approved ──
  function isApprovedContent(c?: { status?: string | null; approvalStatus?: string | null } | null) {
    return !!c && c.status === 'published' && c.approvalStatus === 'approved';
  }

  // schedule ที่อ้าง layout/playlist ที่ยังไม่ approved → ไม่ขึ้นจอ (ข้ามไป priority ถัดไป)
  async function isScheduleContentApproved(schedule: typeof schedules.$inferSelect): Promise<boolean> {
    if (schedule.layoutId) {
      const [l] = await db.select({ status: layouts.status, approvalStatus: layouts.approvalStatus }).from(layouts).where(eq(layouts.id, schedule.layoutId));
      if (l && !isApprovedContent(l)) return false;
    }
    if (schedule.playlistId) {
      const [p] = await db.select({ status: playlists.status, approvalStatus: playlists.approvalStatus }).from(playlists).where(eq(playlists.id, schedule.playlistId));
      if (p && !isApprovedContent(p)) return false;
    }
    return true;
  }

  async function resolveScreenContent(screenId: string, now: Date) {
    let schedule = await getActiveScheduleForScreen(screenId, now);
    // Content Approval: schedule ที่อ้าง content ยังไม่ approved → ถือว่าไม่มี schedule (ไป priority ถัดไป)
    if (schedule && !(await isScheduleContentApproved(schedule))) schedule = null;
    const campaign = await getActiveCampaign();
    const campaignLayoutId = campaign ? campaignCurrentLayoutId(campaign, now) : null;
    const effectiveCampaign = campaign && campaignLayoutId ? campaign : null;

    const sRank = schedule ? priorityRankOf(schedule.priority) : -1;
    const cRank = effectiveCampaign ? priorityRankOf(CAMPAIGN_DEFAULT_PRIORITY) : -1;
    const scheduleWins = schedule
      && (sRank > cRank || (sRank === cRank && schedule.priority >= CAMPAIGN_DEFAULT_PRIORITY));

    if (scheduleWins) {
      return {
        schedule,
        campaign: null,
        layoutId: schedule.layoutId ?? null,
        playlistId: schedule.playlistId ?? null,
        priorityLevel: priorityLevelOf(schedule.priority),
        source: 'schedule' as const,
      };
    }
    if (effectiveCampaign) {
      return {
        schedule: null,
        campaign: effectiveCampaign,
        layoutId: campaignLayoutId,
        playlistId: null,
        priorityLevel: 'campaign' as const,
        source: 'campaign' as const,
      };
    }
    // ไม่มี schedule/campaign → จอใช้เนื้อหาปกติของตัวเอง (ระดับ default)
    // REQ-TagMatch: ถ้ามี playlist/layout ที่ tags ตรงกับจอ → ใช้เป็น content อัตโนมัติ (scale 1000+ จอ)
    const tagMatch = await findTagMatchedContent(screenId);
    if (tagMatch) {
      return {
        schedule: null, campaign: null,
        layoutId: tagMatch.layoutId, playlistId: tagMatch.playlistId,
        priorityLevel: 'default' as const, source: 'tag_match' as const,
      };
    }
    return { schedule: null, campaign: null, layoutId: null, playlistId: null, priorityLevel: 'default' as const, source: 'default' as const };
  }

  // ── REQ-TagMatch: จับคู่ tags อัตโนมัติ (playlist/layout ที่ tags ตรงกับจอ) ──
  // จอใหม่ที่ตั้ง tags ไว้ → ได้ content ตรงกลุ่มทันที โดยไม่ต้องสร้าง schedule
  // scoring: นับจำนวน tags ที่ตรงกัน — เลือกอันที่ตรงมากสุด; ถ้าเท่ากัน เลือกอันที่ updated ล่าสุด
  async function findTagMatchedContent(screenId: string) {
    const [screen] = await db.select().from(screens).where(eq(screens.id, screenId));
    if (!screen) return null;
    const screenTags: string[] = (screen.tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
    if (!screenTags.length) return null;

    const [allPl, allLay] = await Promise.all([
      db.select().from(playlists),
      db.select().from(layouts),
    ]);

    // หา best playlist + best layout แยกกัน แล้วจับคู่กัน (layout กำหนดโซน, playlist กำหนด content)
    // เฉพาะ content ที่ approved แล้วเท่านั้น (Content Approval Workflow)
    let bestPl: { id: string; score: number; updatedAt: Date } | null = null;
    let bestLay: { id: string; score: number; updatedAt: Date } | null = null;

    for (const p of allPl) {
      if (!isApprovedContent(p)) continue;
      const pTags: string[] = (p.tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      if (!pTags.length) continue;
      const score = pTags.filter((t) => screenTags.includes(t)).length;
      if (score > 0 && (!bestPl || score > bestPl.score || (score === bestPl.score && p.updatedAt > bestPl.updatedAt))) {
        bestPl = { id: p.id, score, updatedAt: p.updatedAt };
      }
    }
    for (const l of allLay) {
      if (!isApprovedContent(l)) continue;
      const lTags: string[] = (l.tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean);
      if (!lTags.length) continue;
      const score = lTags.filter((t) => screenTags.includes(t)).length;
      if (score > 0 && (!bestLay || score > bestLay.score || (score === bestLay.score && l.updatedAt > bestLay.updatedAt))) {
        bestLay = { id: l.id, score, updatedAt: l.updatedAt };
      }
    }
    if (!bestPl && !bestLay) return null;
    return { layoutId: bestLay?.id ?? null, playlistId: bestPl?.id ?? null };
  }

  // ตรวจจับว่า schedule ของแต่ละจอเปลี่ยนไป → broadcast ให้ player รู้ทันที
  const lastScheduleState = new Map<string, string>();
  async function pushScheduleUpdates() {
    try {
      const now = new Date();
      const all = await db.select().from(screens);
      for (const s of all) {
        const r = await resolveScreenContent(s.id, now);
        // key ต้องไม่รวม layoutId ของ campaign (server หมุน layout ตามเวลา) — ไม่งั้น broadcast
        // ทุก rotation → player รีเซ็ต campaignIndex=0 วนลูป stuck ที่ layout แรก
        const key = r.schedule
          ? `sch:${r.schedule.id}:${r.layoutId ?? ''}:${r.playlistId ?? ''}`
          : r.campaign
            ? `cmp:${r.campaign.id}`
            : r.source === 'tag_match'
              ? `tm:${r.layoutId ?? ''}:${r.playlistId ?? ''}`
              : '';
        if (lastScheduleState.get(s.id) !== key) {
          lastScheduleState.set(s.id, key);
          broadcast('SCHEDULE_CHANGED', {
            screenId: s.id,
            // layoutId/playlistId ครบทุกรูปแบบ — player ใช้ตอน tag_match (ตรงกับจอจริง)
            layoutId: r.layoutId,
            playlistId: r.playlistId,
            schedule: r.schedule
              ? { id: r.schedule.id, name: r.schedule.name, layoutId: r.layoutId, playlistId: r.playlistId, priority: r.schedule.priority, priorityLevel: r.priorityLevel }
              : null,
            campaign: r.campaign
              ? { id: r.campaign.id, name: r.campaign.name, layoutSequence: r.campaign.layoutSequence, cycleMode: r.campaign.cycleMode, createdAt: r.campaign.createdAt }
              : null,
            priorityLevel: r.priorityLevel,
            source: r.source,
          });
        }
      }
    } catch (e) {
      console.error('[Scheduler] pushScheduleUpdates error:', (e as Error).message);
    }
  }


  // ═══════════════════════════════════════════════════════════
  // PUBLIC ROUTES (no auth required)
  // ═══════════════════════════════════════════════════════════

  // ─── Health ────────────────────────────────────────────
  app.get('/api/health', async (_req, res) => {
    const dbOk = await checkDbConnection();
    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      service: 'Enterprise Digital Signage Engine',
      version: '0.2.0',
      uptime: process.uptime(),
      connectedClients: connectedClients.size,
      database: dbOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  });

  // ─── Auth Routes ───────────────────────────────────────
  app.use('/api/auth', authRouter);

  // ─── Static file serving (uploads) ────────────────────
  app.use('/uploads', express.static(UPLOAD_DIR, {
    maxAge: '7d',
    etag: true,
    lastModified: true,
  }));

  // ─── Media Proxy (for Android TV that can't load external URLs) ──
  app.get('/api/media-proxy', async (req, res) => {
    const url = req.query.url as string;
    if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    // ⚠️ SSRF guard: never proxy requests to private/internal networks
    if (!(await isPublicUrl(url))) {
      return res.status(400).json({ error: 'URL blocked: private or internal addresses are not allowed' });
    }
    try {
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).end();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 day
      res.setHeader('Access-Control-Allow-Origin', '*');
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (e) {
      res.status(502).json({ error: 'Proxy fetch failed' });
    }
  });

  // ─── Media Upload Routes ──────────────────────────────
  app.use('/api/media', uploadRouter);

  // ─── Widget Proxy: OpenWeather API ─────────────────────
  app.get('/api/widgets/weather', async (req: Request, res: Response) => {
    try {
      const city = (req.query.city as string) || 'Bangkok';
      const units = (req.query.units as string) || 'metric';
      const apiKey = (req.query.apiKey as string) || process.env.OPENWEATHER_API_KEY || '';

      if (!apiKey) {
        return res.status(400).json({ error: 'OpenWeather API key required. Set in API Keys settings or OPENWEATHER_API_KEY env.' });
      }

      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.message || 'Weather API error' });
      }

      res.json({
        city: data.name,
        country: data.sys?.country,
        temp: Math.round(data.main?.temp),
        feelsLike: Math.round(data.main?.feels_like),
        humidity: data.main?.humidity,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon,
        windSpeed: data.wind?.speed,
      });
    } catch (e: any) {
      res.status(502).json({ error: 'Weather proxy failed', details: e.message });
    }
  });

  // ─── Widget Proxy: RSS Feed Parser ─────────────────────
  app.get('/api/widgets/rss', async (req: Request, res: Response) => {
    try {
      const feedUrl = req.query.url as string;
      const maxItems = Math.min(Number(req.query.max) || 10, 20);

      if (!feedUrl || (!feedUrl.startsWith('http://') && !feedUrl.startsWith('https://'))) {
        return res.status(400).json({ error: 'Valid RSS feed URL required' });
      }

      // ⚠️ SSRF guard: reject private/internal feed hosts
      if (!(await isPublicUrl(feedUrl))) {
        return res.status(400).json({ error: 'RSS feed blocked: private or internal addresses are not allowed' });
      }

      const response = await fetch(feedUrl, {
        headers: { 'User-Agent': 'DigitalSignage-RSS/1.0' },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: `Failed to fetch RSS: ${response.statusText}` });
      }

      const xml = await response.text();

      // Simple XML parser for RSS/Atom feeds
      const items: Array<{ title: string; link: string; pubDate: string; description: string }> = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>|<entry>([\s\S]*?)<\/entry>/gi;
      let match;

      while ((match = itemRegex.exec(xml)) !== null && items.length < maxItems) {
        const block = match[1] || match[2] || '';
        const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s)?.[1] || '';
        const link = block.match(/<link[^>]*href="([^"]*)"/)?.[ 1] || block.match(/<link[^>]*>(.*?)<\/link>/s)?.[1] || '';
        const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || block.match(/<published>(.*?)<\/published>/s)?.[1] || '';
        const description = block.match(/<description[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/s)?.[1] || '';

        items.push({
          title: title.replace(/<[^>]+>/g, '').trim(),
          link: link.trim(),
          pubDate: pubDate.trim(),
          description: description.replace(/<[^>]+>/g, '').trim().slice(0, 200),
        });
      }

      // Get feed title
      const feedTitle = xml.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/s)?.[1]?.replace(/<[^>]+>/g, '').trim() || 'RSS Feed';

      res.json({ title: feedTitle, items, fetchedAt: new Date().toISOString() });
    } catch (e: any) {
      res.status(502).json({ error: 'RSS proxy failed', details: e.message });
    }
  });

  // ─── Widget Proxy: Google Calendar Events ──────────────
  app.get('/api/widgets/calendar', async (req: Request, res: Response) => {
    try {
      const calendarId = req.query.calendarId as string;
      const apiKey = (req.query.apiKey as string) || process.env.GOOGLE_API_KEY || '';
      const daysAhead = Math.min(Number(req.query.days) || 7, 30);

      if (!calendarId || !apiKey) {
        return res.status(400).json({ error: 'Calendar ID and Google API key required' });
      }

      const now = new Date();
      const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${now.toISOString()}&timeMax=${future.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=20`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'Google Calendar API error' });
      }

      const events = (data.items || []).map((ev: any) => ({
        id: ev.id,
        title: ev.summary || 'Untitled',
        start: ev.start?.dateTime || ev.start?.date,
        end: ev.end?.dateTime || ev.end?.date,
        location: ev.location || '',
        description: (ev.description || '').slice(0, 100),
      }));

      res.json({ events, fetchedAt: new Date().toISOString() });
    } catch (e: any) {
      res.status(502).json({ error: 'Calendar proxy failed', details: e.message });
    }
  });


  // ─── Slideshow Routes ─────────────────────────────────
  app.use('/api/slideshows', slideshowRouter);

  // ─── AI Routes ────────────────────────────────────────
  app.use('/api/ai', aiRouter);

  // ═══════════════════════════════════════════════════════════
  // PROTECTED ROUTES (auth required)
  // ═══════════════════════════════════════════════════════════

  // ─── Screens (read: viewer+ | write: admin+) ──────────
  app.get('/api/screens',
    authenticate as any, requirePermission('read:screens') as any,
    async (_req, res, next) => {
      try {
        const rows = await db.select().from(screens).orderBy(screens.name);
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  app.get('/api/screens/:id',
    authenticate as any, requirePermission('read:screens') as any,
    async (req, res, next) => {
      try {
        const [row] = await db.select().from(screens).where(eq(screens.id, req.params.id));
        if (!row) return res.status(404).json({ error: 'Screen not found', code: 'NOT_FOUND' });
        res.json(row);
      } catch (e) { next(e); }
    });

  app.post('/api/screens',
    authenticate as any, requirePermission('write:screens') as any,
    writeLimiter, validateBody(CreateScreenSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const [row] = await db.insert(screens).values({
          ...req.body, id: req.body.id ?? `scr-${Date.now()}`,
          createdAt: new Date(), updatedAt: new Date(),
        }).returning();
        await logAudit(req, 'create', 'screen', row.id, { name: row.name });
        broadcast('SCREEN_ADDED', row);
        res.status(201).json(row);
      } catch (e) { next(e); }
    });

  app.patch('/api/screens/:id',
    authenticate as any, requirePermission('write:screens') as any,
    writeLimiter, validateBody(UpdateScreenSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const [row] = await db.update(screens)
          .set({ ...req.body, updatedAt: new Date() })
          .where(eq(screens.id, req.params.id)).returning();
        if (!row) return res.status(404).json({ error: 'Screen not found' });
        await logAudit(req, 'update', 'screen', row.id, req.body);
        broadcast('SCREEN_UPDATED', row);
        res.json(row);
      } catch (e) { next(e); }
    });

  app.delete('/api/screens/:id',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await db.delete(screens).where(eq(screens.id, req.params.id));
        await logAudit(req, 'delete', 'screen', req.params.id, {}, 'warning');
        res.json({ success: true, id: req.params.id });
      } catch (e) { next(e); }
    });


  // ─── Media Items (read: viewer+ | write: staff+) ──────
  app.get('/api/media',
    authenticate as any, requirePermission('read:media') as any,
    async (req, res, next) => {
      try {
        const { type } = req.query;
        const rows = type
          ? await db.select().from(mediaItems).where(eq(mediaItems.type, type as string)).orderBy(desc(mediaItems.createdAt))
          : await db.select().from(mediaItems).orderBy(desc(mediaItems.createdAt));
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  app.post('/api/media',
    authenticate as any, requirePermission('write:media') as any,
    writeLimiter, validateBody(CreateMediaSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        // expiresAt/releaseDate รับเป็น ISO string จาก client → แปลงเป็น Date ให้ drizzle
        const b = { ...req.body };
        if (b.expiresAt) b.expiresAt = new Date(b.expiresAt);
        if (b.releaseDate) b.releaseDate = new Date(b.releaseDate);
        const [row] = await db.insert(mediaItems).values({
          ...b, id: b.id ?? `med-${Date.now()}`,
          createdAt: new Date(), updatedAt: new Date(),
        }).returning();
        await logAudit(req, 'create', 'media', row.id, { title: row.title });
        res.status(201).json(row);
      } catch (e) { next(e); }
    });

  app.delete('/api/media/:id',
    authenticate as any, requirePermission('write:media') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await db.delete(mediaItems).where(eq(mediaItems.id, req.params.id));
        await logAudit(req, 'delete', 'media', req.params.id, {}, 'warning');
        res.json({ success: true, id: req.params.id });
      } catch (e) { next(e); }
    });

  // ─── Layouts (read: viewer+ | write: staff+) ──────────
  app.get('/api/layouts',
    authenticate as any, requirePermission('read:layouts') as any,
    async (_req, res, next) => {
      try {
        const rows = await db.query.layouts.findMany({ with: { zones: true }, orderBy: [layouts.name] });
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  app.get('/api/layouts/:id',
    authenticate as any, requirePermission('read:layouts') as any,
    async (req, res, next) => {
      try {
        const row = await db.query.layouts.findFirst({ where: eq(layouts.id, req.params.id), with: { zones: true } });
        if (!row) return res.status(404).json({ error: 'Layout not found' });
        res.json(row);
      } catch (e) { next(e); }
    });

  app.post('/api/layouts',
    authenticate as any, requirePermission('write:layouts') as any,
    writeLimiter,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { zones: zonesData, ...layoutData } = req.body;
        const [layout] = await db.insert(layouts).values({
          ...layoutData, id: layoutData.id ?? `lay-${Date.now()}`,
          // Content Approval: layout ใหม่ต้องผ่าน approval ก่อนขึ้นจอ (กัน client ส่ง approved เอง)
          approvalStatus: 'pending',
          createdAt: new Date(), updatedAt: new Date(),
        }).returning();
        if (zonesData?.length) {
          await db.insert(layoutZones).values(
            zonesData.map((z: any) => ({
              ...z,
              layoutId: layout.id,
              id: z.id ?? `lz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              mediaType: z.mediaType || z.media_type || null,
              contentData: z.contentData || z.content_data || null,
            }))
          );
        }
        await logAudit(req, 'create', 'layout', layout.id, { name: layout.name });
        res.status(201).json(layout);
      } catch (e) { next(e); }
    });

  app.put('/api/layouts/:id',
    authenticate as any, requirePermission('write:layouts') as any,
    writeLimiter,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { zones: zonesData, ...layoutData } = req.body;
        // Update layout metadata
        const [layout] = await db.update(layouts).set({
          ...layoutData, updatedAt: new Date(),
        }).where(eq(layouts.id, req.params.id)).returning();
        if (!layout) return res.status(404).json({ error: 'Layout not found' });

        // Replace zones if provided
        if (zonesData) {
          await db.delete(layoutZones).where(eq(layoutZones.layoutId, req.params.id));
          if (zonesData.length) {
            await db.insert(layoutZones).values(
              zonesData.map((z: any) => ({
                id: z.id ?? `lz-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                layoutId: req.params.id,
                name: z.name || 'Zone',
                x: z.x ?? 0,
                y: z.y ?? 0,
                width: z.width ?? 100,
                height: z.height ?? 100,
                zIndex: z.zIndex ?? z.z_index ?? 1,
                playlistId: z.playlistId || z.playlist_id || null,
                mediaType: z.mediaType || z.media_type || null,
                backgroundColor: z.backgroundColor || z.background_color || '#000000',
                isLocked: z.isLocked ?? z.is_locked ?? false,
                contentData: z.contentData || z.content_data || null,
              }))
            );
          }
        }

        await logAudit(req, 'update', 'layout', req.params.id, { name: layout.name });
        res.json(layout);
      } catch (e) { next(e); }
    });

  app.delete('/api/layouts/:id',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await db.delete(layouts).where(eq(layouts.id, req.params.id));
        await logAudit(req, 'delete', 'layout', req.params.id, {}, 'warning');
        res.json({ success: true, id: req.params.id });
      } catch (e) { next(e); }
    });


  // ─── Playlists (read: viewer+ | write: staff+) ────────
  app.get('/api/playlists',
    authenticate as any, requirePermission('read:playlists') as any,
    async (_req, res, next) => {
      try {
        const rows = await db.query.playlists.findMany({ with: { items: { with: { media: true } } }, orderBy: [playlists.name] });
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  app.get('/api/playlists/:id',
    authenticate as any, requirePermission('read:playlists') as any,
    async (req, res, next) => {
      try {
        const row = await db.query.playlists.findFirst({ where: eq(playlists.id, req.params.id), with: { items: { with: { media: true } } } });
        if (!row) return res.status(404).json({ error: 'Playlist not found' });
        res.json(row);
      } catch (e) { next(e); }
    });

  app.post('/api/playlists',
    authenticate as any, requirePermission('write:playlists') as any,
    writeLimiter, validateBody(CreatePlaylistSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { items: itemsData, ...pData } = req.body;
        const [playlist] = await db.insert(playlists).values({
          ...pData, id: pData.id ?? `pl-${Date.now()}`,
          // Content Approval: เพลย์ลิสต์ใหม่ต้องผ่าน approval ก่อนขึ้นจอ
          approvalStatus: 'pending',
          createdAt: new Date(), updatedAt: new Date(),
        }).returning();
        if (itemsData?.length) {
          await db.insert(playlistItems).values(itemsData.map((it: any, i: number) => ({ ...it, playlistId: playlist.id, id: it.id ?? `pli-${Date.now()}-${i}` })));
        }
        await logAudit(req, 'create', 'playlist', playlist.id, { name: playlist.name });
        res.status(201).json(playlist);
      } catch (e) { next(e); }
    });

  app.put('/api/playlists/:id',
    authenticate as any, requirePermission('write:playlists') as any,
    writeLimiter, validateBody(UpdatePlaylistSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { items: itemsData, ...pData } = req.body;
        const [playlist] = await db.update(playlists).set({ ...pData, updatedAt: new Date() }).where(eq(playlists.id, req.params.id)).returning();
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        if (itemsData) {
          await db.delete(playlistItems).where(eq(playlistItems.playlistId, req.params.id));
          if (itemsData.length) await db.insert(playlistItems).values(itemsData.map((it: any, i: number) => ({ ...it, playlistId: playlist.id, id: it.id ?? `pli-${Date.now()}-${i}` })));
        }
        await logAudit(req, 'update', 'playlist', playlist.id, { name: playlist.name });
        res.json(playlist);
      } catch (e) { next(e); }
    });

  app.delete('/api/playlists/:id',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await db.delete(playlists).where(eq(playlists.id, req.params.id));
        await logAudit(req, 'delete', 'playlist', req.params.id, {}, 'warning');
        res.json({ success: true, id: req.params.id });
      } catch (e) { next(e); }
    });

  // ─── Schedules (read: viewer+ | write: staff+) ────────
  app.get('/api/schedules',
    authenticate as any, requirePermission('read:schedules') as any,
    async (_req, res, next) => {
      try {
        const rows = await db.select().from(schedules).orderBy(desc(schedules.priority));
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  app.post('/api/schedules',
    authenticate as any, requirePermission('write:schedules') as any,
    writeLimiter, validateBody(CreateScheduleSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const [row] = await db.insert(schedules).values({ ...req.body, id: req.body.id ?? `sch-${Date.now()}`, createdAt: new Date(), updatedAt: new Date() }).returning();
        await logAudit(req, 'create', 'schedule', row.id, { name: row.name });
        setTimeout(() => { void pushScheduleUpdates(); }, 100);
        res.status(201).json(row);
      } catch (e) { next(e); }
    });

  app.patch('/api/schedules/:id',
    authenticate as any, requirePermission('write:schedules') as any,
    writeLimiter, validateBody(UpdateScheduleSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const [row] = await db.update(schedules).set({ ...req.body, updatedAt: new Date() }).where(eq(schedules.id, req.params.id)).returning();
        if (!row) return res.status(404).json({ error: 'Schedule not found' });
        await logAudit(req, 'update', 'schedule', row.id, req.body);
        setTimeout(() => { void pushScheduleUpdates(); }, 100);
        res.json(row);
      } catch (e) { next(e); }
    });

  app.delete('/api/schedules/:id',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await db.delete(schedules).where(eq(schedules.id, req.params.id));
        await logAudit(req, 'delete', 'schedule', req.params.id, {}, 'warning');
        setTimeout(() => { void pushScheduleUpdates(); }, 100);
        res.json({ success: true, id: req.params.id });
      } catch (e) { next(e); }
    });

  // ─── Campaigns (REQ-011: CRUD ฝั่ง server — เดิมเก็บ localStorage ฝั่ง client) ────
  app.get('/api/campaigns',
    authenticate as any, requirePermission('read:schedules') as any,
    async (_req, res, next) => {
      try {
        const rows = await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  app.post('/api/campaigns',
    authenticate as any, requirePermission('write:schedules') as any,
    writeLimiter, validateBody(CreateCampaignSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const id = req.body.id ?? `cmp-${Date.now()}`;
        const now = new Date();
        const [row] = await db.insert(campaigns).values({
          id,
          name: req.body.name,
          description: req.body.description ?? '',
          isActive: req.body.isActive ?? true,
          layoutSequence: req.body.layoutSequence ?? [],
          cycleMode: req.body.cycleMode ?? 'sequential',
          createdAt: now,
          updatedAt: now,
        }).returning();
        await logAudit(req, 'create', 'campaign', row.id, { name: row.name });
        setTimeout(() => { void pushScheduleUpdates(); }, 100);
        res.status(201).json(row);
      } catch (e) { next(e); }
    });

  app.patch('/api/campaigns/:id',
    authenticate as any, requirePermission('write:schedules') as any,
    writeLimiter, validateBody(UpdateCampaignSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const [row] = await db.update(campaigns).set({ ...req.body, updatedAt: new Date() }).where(eq(campaigns.id, req.params.id)).returning();
        if (!row) return res.status(404).json({ error: 'Campaign not found' });
        await logAudit(req, 'update', 'campaign', row.id, req.body);
        setTimeout(() => { void pushScheduleUpdates(); }, 100);
        res.json(row);
      } catch (e) { next(e); }
    });

  app.delete('/api/campaigns/:id',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        await db.delete(campaigns).where(eq(campaigns.id, req.params.id));
        await logAudit(req, 'delete', 'campaign', req.params.id, {}, 'warning');
        setTimeout(() => { void pushScheduleUpdates(); }, 100);
        res.json({ success: true, id: req.params.id });
      } catch (e) { next(e); }
    });

  // GET /api/schedules/resolve — ดูว่า schedule ไหน active สำหรับจอตอนนี้ (admin/debug)
  app.get('/api/schedules/resolve',
    authenticate as any,
    async (req, res, next) => {
      try {
        const screenId = req.query.screenId as string;
        if (!screenId) return res.status(400).json({ error: 'screenId query param required' });
        const r = await resolveScreenContent(screenId, new Date());
        res.json({
          screenId,
          // layoutId/playlistId ของ resolution ครบทุกรูปแบบ (schedule/campaign/tag_match/default)
          // — TV Player ใช้ตัวนี้แทน currentPlaylistId ตอน tag_match (preview ตรงกับจอจริง)
          layoutId: r.layoutId,
          playlistId: r.playlistId,
          schedule: r.schedule
            ? { id: r.schedule.id, name: r.schedule.name, layoutId: r.layoutId, playlistId: r.playlistId, priority: r.schedule.priority, priorityLevel: r.priorityLevel }
            : null,
          campaign: r.campaign
            ? { id: r.campaign.id, name: r.campaign.name, layoutSequence: r.campaign.layoutSequence, cycleMode: r.campaign.cycleMode, createdAt: r.campaign.createdAt }
            : null,
          priorityLevel: r.priorityLevel,
          source: r.source,
        });
      } catch (e) { next(e); }
    });


  // ─── Emergency (admin+ only) ───────────────────────────
  app.post('/api/emergency/trigger',
    authenticate as any, requirePermission('write:emergencies') as any,
    emergencyLimiter, validateBody(TriggerEmergencySchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const now = new Date();
        const alertId = `emg-${Date.now()}`;
        const alertData = {
          id: alertId,
          title:           req.body.title    ?? 'EMERGENCY BROADCAST ALERT',
          message:         req.body.message  ?? 'ATTENTION ALL OCCUPANTS: Follow emergency guidelines.',
          type:            req.body.type     ?? 'custom',
          severity:        req.body.severity ?? 'critical',
          targetScreenIds: req.body.targetScreenIds ?? [],
          isActive:        true,
          triggeredAt:     now,
          triggeredBy:     req.user?.email || 'System',
        };

        await db.update(emergencyAlerts).set({ isActive: false }).where(eq(emergencyAlerts.isActive, true));
        const [alert] = await db.insert(emergencyAlerts).values(alertData).returning();

        if (alertData.targetScreenIds.length === 0) {
          await db.update(screens).set({ status: 'emergency', activeEmergencyId: alertId, updatedAt: now });
        } else {
          for (const sid of alertData.targetScreenIds) {
            await db.update(screens).set({ status: 'emergency', activeEmergencyId: alertId, updatedAt: now }).where(eq(screens.id, sid));
          }
        }

        await logAudit(req, 'emergency_trigger', 'emergency', alertId, alertData, 'critical');
        broadcast('EMERGENCY_TRIGGERED', alert);
        res.json({ success: true, alert });
      } catch (e) { next(e); }
    });

  app.post('/api/emergency/clear',
    authenticate as any, requirePermission('write:emergencies') as any,
    validateBody(ClearEmergencySchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { alertId } = req.body;
        const now = new Date();
        await db.update(emergencyAlerts).set({ isActive: false, clearedAt: now, clearedBy: req.user?.email || 'Admin' }).where(eq(emergencyAlerts.id, alertId));
        await db.update(screens).set({ status: 'online', activeEmergencyId: null, updatedAt: now }).where(eq(screens.activeEmergencyId, alertId));
        await logAudit(req, 'emergency_clear', 'emergency', alertId, {}, 'critical');
        broadcast('EMERGENCY_CLEARED', { alertId });
        res.json({ success: true, alertId });
      } catch (e) { next(e); }
    });

  // ─── Control Commands (admin+ only) ────────────────────
  app.post('/api/control/command',
    authenticate as any, requirePermission('write:commands') as any,
    commandLimiter, validateBody(SendCommandSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { screenId, command, payload } = req.body;
        const now = new Date();
        if (command === 'REBOOT') await db.update(screens).set({ status: 'syncing', uptimeSeconds: 0, updatedAt: now }).where(eq(screens.id, screenId));
        else if (command === 'PURGE_CACHE') await db.update(screens).set({ storageUsageMb: 250, bufferCachedItems: 0, updatedAt: now }).where(eq(screens.id, screenId));
        else if (command === 'SET_LAYOUT' && payload?.layoutId) await db.update(screens).set({ currentLayoutId: payload.layoutId as string, updatedAt: now }).where(eq(screens.id, screenId));
        else if (command === 'SET_VOLUME' && payload?.volume !== undefined) await db.update(screens).set({ volume: Number(payload.volume), isMuted: Number(payload.volume) === 0, updatedAt: now }).where(eq(screens.id, screenId));
        else if (command === 'UNPAIR_DEVICE') await db.update(screens).set({ status: 'offline', updatedAt: now }).where(eq(screens.id, screenId));

        const [scr] = await db.select({ name: screens.name }).from(screens).where(eq(screens.id, screenId));
        await db.insert(telemetryLogs).values({ screenId, screenName: scr?.name ?? 'Unknown', eventType: 'command_exec', message: `${command} ${payload ? JSON.stringify(payload) : ''}`, details: { eventKey: 'evt.cmdExec', params: { command, payload: payload ? JSON.stringify(payload) : '' } } });
        await logAudit(req, 'command_sent', 'screen', screenId, { command, payload });
        broadcast('SCREEN_COMMAND', { screenId, command, payload });
        res.json({ success: true, screenId, command, payload });
      } catch (e) { next(e); }
    });

  // ─── Quick Post (instant notice to screens) ─────────────
  app.post('/api/quick-post',
    authenticate as any, requirePermission('write:emergencies') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { message, style, targetScreenIds, duration } = req.body;
        const post = {
          id: `qp-${Date.now()}`,
          message: message || 'Quick notice',
          style: style || 'info',
          targetScreenIds: targetScreenIds || [],
          duration: duration || 30,
          createdBy: req.user?.email || 'admin',
          isActive: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + (duration || 30) * 1000).toISOString(),
        };
        // Broadcast to all connected screens via WebSocket (including sender)
        const data = JSON.stringify({ type: 'QUICK_POST', payload: post, timestamp: new Date().toISOString() });
        wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(data); });
        await logAudit(req, 'quick_post', 'notice', post.id, { message: post.message });
        res.json({ success: true, post });
      } catch (e) { next(e); }
    });

  // ─── Content Trigger (Webhook for IoT/POS/Alarm) ───────
  // External systems can call this to change screen content instantly
  // POST /api/trigger { action: "set_layout"|"set_playlist"|"show_message"|"refresh", target: { screenIds?, group?, all? }, payload: { layoutId?, playlistId?, message?, style? } }
  app.post('/api/trigger',
    webhookAuth as any,
    async (req: Request, res: Response, next) => {
      try {
        const { action, target, payload } = req.body;

        if (!action) return res.status(400).json({ error: 'action required (set_layout, set_playlist, show_message, refresh)' });

        // Resolve target screens
        let targetScreenIds: string[] = [];
        if (target?.all) {
          const allScreens = await db.select({ id: screens.id }).from(screens);
          targetScreenIds = allScreens.map(s => s.id);
        } else if (target?.screenIds?.length) {
          targetScreenIds = target.screenIds;
        } else if (target?.group) {
          const groupScreens = await db.select({ id: screens.id }).from(screens).where(eq(screens.group, target.group));
          targetScreenIds = groupScreens.map(s => s.id);
        } else {
          return res.status(400).json({ error: 'target required: { all: true } or { screenIds: [...] } or { group: "name" }' });
        }

        const now = new Date();

        switch (action) {
          case 'set_layout':
            if (!payload?.layoutId) return res.status(400).json({ error: 'payload.layoutId required' });
            for (const id of targetScreenIds) {
              await db.update(screens).set({ currentLayoutId: payload.layoutId, updatedAt: now }).where(eq(screens.id, id));
            }
            broadcast('SCREEN_UPDATED', { screenIds: targetScreenIds, action: 'set_layout', layoutId: payload.layoutId });
            break;

          case 'set_playlist':
            if (!payload?.playlistId) return res.status(400).json({ error: 'payload.playlistId required' });
            for (const id of targetScreenIds) {
              await db.update(screens).set({ currentPlaylistId: payload.playlistId, updatedAt: now }).where(eq(screens.id, id));
            }
            broadcast('SCREEN_UPDATED', { screenIds: targetScreenIds, action: 'set_playlist', playlistId: payload.playlistId });
            break;

          case 'show_message': {
            const post = {
              id: `trigger-${Date.now()}`,
              message: payload?.message || 'Triggered notification',
              style: payload?.style || 'info',
              targetScreenIds,
              duration: payload?.duration || 30,
              createdBy: 'webhook-trigger',
              isActive: true,
              createdAt: now.toISOString(),
              expiresAt: new Date(now.getTime() + (payload?.duration || 30) * 1000).toISOString(),
            };
            const data = JSON.stringify({ type: 'QUICK_POST', payload: post, timestamp: now.toISOString() });
            wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(data); });
            break;
          }

          case 'refresh':
            broadcast('SCREEN_COMMAND', { screenId: 'ALL', command: 'REFRESH_CONTENT' });
            break;

          default:
            return res.status(400).json({ error: `Unknown action: ${action}. Use: set_layout, set_playlist, show_message, refresh` });
        }

        res.json({ success: true, action, targetScreens: targetScreenIds.length, timestamp: now.toISOString() });
      } catch (e) { next(e); }
    });

  // ─── Tag-Based Content Distribution ────────────────────
  // POST /api/trigger/by-tags { tags: ["lobby", "food"], action, payload }
  // Automatically targets screens that have ANY of the specified tags
  app.post('/api/trigger/by-tags',
    webhookAuth as any,
    async (req: Request, res: Response, next) => {
      try {
        const { tags, action, payload } = req.body;
        if (!tags?.length) return res.status(400).json({ error: 'tags array required' });
        if (!action) return res.status(400).json({ error: 'action required' });

        // Find screens with matching tags (ANY match)
        const allScreens = await db.select().from(screens);
        const matchingScreens = allScreens.filter(s => {
          const screenTags: string[] = (s as any).tags || [];
          return screenTags.some((t: string) => tags.includes(t));
        });

        if (matchingScreens.length === 0) {
          return res.json({ success: true, matched: 0, message: 'No screens match the specified tags' });
        }

        const targetScreenIds = matchingScreens.map(s => s.id);
        const now = new Date();

        if (action === 'set_layout' && payload?.layoutId) {
          for (const id of targetScreenIds) {
            await db.update(screens).set({ currentLayoutId: payload.layoutId, updatedAt: now }).where(eq(screens.id, id));
          }
          broadcast('SCREEN_UPDATED', { screenIds: targetScreenIds, action: 'set_layout', layoutId: payload.layoutId, matchedByTags: tags });
        } else if (action === 'set_playlist' && payload?.playlistId) {
          for (const id of targetScreenIds) {
            await db.update(screens).set({ currentPlaylistId: payload.playlistId, updatedAt: now }).where(eq(screens.id, id));
          }
          broadcast('SCREEN_UPDATED', { screenIds: targetScreenIds, action: 'set_playlist', playlistId: payload.playlistId, matchedByTags: tags });
        } else if (action === 'show_message') {
          const data = JSON.stringify({ type: 'QUICK_POST', payload: { id: `tag-${Date.now()}`, message: payload?.message || '', style: payload?.style || 'info', targetScreenIds, duration: payload?.duration || 30, createdAt: now.toISOString() }, timestamp: now.toISOString() });
          wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(data); });
        }

        res.json({ success: true, matched: matchingScreens.length, screenNames: matchingScreens.map(s => s.name), tags, action });
      } catch (e) { next(e); }
    });

  // ─── Layout Version History ─────────────────────────────
  app.get('/api/layouts/:id/versions',
    authenticate as any, requirePermission('read:layouts') as any,
    async (req, res, next) => {
      try {
        const versions = await db.select().from(layoutVersions).where(eq(layoutVersions.layoutId, req.params.id)).orderBy(desc(layoutVersions.createdAt));
        res.json({ data: versions });
      } catch (e) { next(e); }
    });

  app.post('/api/layouts/:id/versions',
    authenticate as any, requirePermission('write:layouts') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const layout = await db.query.layouts.findFirst({ where: eq(layouts.id, req.params.id), with: { zones: true } });
        if (!layout) return res.status(404).json({ error: 'Layout not found' });
        // Count existing versions
        const existing = await db.select({ id: layoutVersions.id }).from(layoutVersions).where(eq(layoutVersions.layoutId, req.params.id));
        const [version] = await db.insert(layoutVersions).values({
          layoutId: req.params.id,
          version: existing.length + 1,
          snapshot: layout as any,
          changedBy: req.user?.email || 'system',
          changeNote: req.body.note || 'Manual save',
        }).returning();
        res.json(version);
      } catch (e) { next(e); }
    });

  app.post('/api/layouts/:id/rollback/:versionId',
    authenticate as any, requirePermission('write:layouts') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const [version] = await db.select().from(layoutVersions).where(eq(layoutVersions.id, Number(req.params.versionId)));
        if (!version) return res.status(404).json({ error: 'Version not found' });
        const snapshot = version.snapshot as any;
        // Restore layout metadata
        await db.update(layouts).set({
          name: snapshot.name, description: snapshot.description, orientation: snapshot.orientation,
          aspectRatio: snapshot.aspectRatio || snapshot.aspect_ratio, updatedAt: new Date(),
        }).where(eq(layouts.id, req.params.id));
        // Restore zones
        await db.delete(layoutZones).where(eq(layoutZones.layoutId, req.params.id));
        if (snapshot.zones?.length) {
          await db.insert(layoutZones).values(snapshot.zones.map((z: any) => ({
            id: z.id, layoutId: req.params.id, name: z.name,
            x: z.x, y: z.y, width: z.width, height: z.height,
            zIndex: z.zIndex || z.z_index || 1,
            playlistId: z.playlistId || z.playlist_id || null,
            mediaType: z.mediaType || z.media_type || null,
            isLocked: z.isLocked ?? z.is_locked ?? false,
            backgroundColor: z.backgroundColor || z.background_color || '#000000',
            contentData: z.contentData || z.content_data || null,
          })));
        }
        await logAudit(req, 'rollback', 'layout', req.params.id, { toVersion: version.version });
        res.json({ success: true, restoredVersion: version.version });
      } catch (e) { next(e); }
    });

  // ─── Content Approval ──────────────────────────────────
  app.patch('/api/layouts/:id/approve',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const status = req.body.approvalStatus; // 'approved' | 'rejected'
        if (!['approved', 'rejected', 'pending'].includes(status)) {
          return res.status(400).json({ error: 'approvalStatus must be: approved, rejected, or pending' });
        }
        const [layout] = await db.update(layouts).set({ approvalStatus: status, updatedAt: new Date() }).where(eq(layouts.id, req.params.id)).returning();
        if (!layout) return res.status(404).json({ error: 'Layout not found' });
        await logAudit(req, `approval_${status}`, 'layout', req.params.id, { name: layout.name });
        broadcast('LAYOUT_APPROVAL', { layoutId: req.params.id, status });
        res.json({ success: true, layout });
      } catch (e) { next(e); }
    });

  // ─── Content Approval: playlist (mirror ของ layouts) ────
  app.patch('/api/playlists/:id/approve',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const status = req.body.approvalStatus; // 'approved' | 'rejected' | 'pending'
        if (!['approved', 'rejected', 'pending'].includes(status)) {
          return res.status(400).json({ error: 'approvalStatus must be: approved, rejected, or pending' });
        }
        const [playlist] = await db.update(playlists).set({ approvalStatus: status, updatedAt: new Date() }).where(eq(playlists.id, req.params.id)).returning();
        if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
        await logAudit(req, `approval_${status}`, 'playlist', req.params.id, { name: playlist.name });
        broadcast('PLAYLIST_APPROVAL', { playlistId: req.params.id, status });
        res.json({ success: true, playlist });
      } catch (e) { next(e); }
    });

  // ─── Slack/Teams Webhook Integration ───────────────────
  // Receives messages from Slack/Teams outgoing webhook → displays on screens
  app.post('/api/integrations/slack',
    webhookAuth as any,
    async (req: Request, res: Response) => {
      try {
        const { text, channel_name, user_name } = req.body;
        const message = text || req.body.message || '';
        if (!message) return res.json({ text: 'No message to display' });

        // Broadcast as quick post to all screens
        const post = {
          id: `slack-${Date.now()}`,
          message: `${user_name || 'Slack'}: ${message}`,
          style: 'info',
          targetScreenIds: [],
          duration: 30,
          createdBy: `slack/${channel_name || 'general'}`,
          createdAt: new Date().toISOString(),
        };
        const data = JSON.stringify({ type: 'QUICK_POST', payload: post, timestamp: new Date().toISOString() });
        wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(data); });

        // Slack expects a response
        res.json({ text: `✅ Displayed on ${connectedClients.size} screens: "${message}"` });
      } catch (e) {
        res.json({ text: '❌ Failed to display message' });
      }
    });

  // ─── QR Scan-to-Interact ───────────────────────────────
  // Returns a control page URL that viewers can use to trigger content
  app.get('/api/interact/:screenId',
    async (req: Request, res: Response) => {
      try {
        const [screen] = await db.select().from(screens).where(eq(screens.id, req.params.screenId));
        if (!screen) return res.status(404).json({ error: 'Screen not found' });

        const allLayouts = await db.select({ id: layouts.id, name: layouts.name }).from(layouts);
        const allPlaylists = await db.select({ id: playlists.id, name: playlists.name }).from(playlists);

        res.json({
          screen: { id: screen.id, name: screen.name, group: screen.group },
          availableActions: ['set_layout', 'set_playlist', 'show_message'],
          layouts: allLayouts,
          playlists: allPlaylists,
        });
      } catch (e) { res.status(500).json({ error: 'Failed to load interact data' }); }
    });

  // POST /api/interact/:screenId/action — execute viewer action
  app.post('/api/interact/:screenId/action',
    optionalAuth as any, interactLimiter,
    async (req: AuthenticatedRequest, res: Response, next) => {
      try {
        const { action, payload } = req.body;
        const screenId = req.params.screenId;
        const now = new Date();

        // ⚠️ Security: anonymous (QR viewers) may only post a quick message.
        // Changing layouts/playlists requires a logged-in user.
        if (!req.user?.userId && action !== 'show_message') {
          return res.status(403).json({ error: 'Authentication required to change layout/playlist. Use show_message for quick notices.' });
        }

        if (action === 'set_layout' && payload?.layoutId) {
          await db.update(screens).set({ currentLayoutId: payload.layoutId, updatedAt: now }).where(eq(screens.id, screenId));
          broadcast('SCREEN_UPDATED', { screenIds: [screenId], action: 'set_layout', layoutId: payload.layoutId });
        } else if (action === 'set_playlist' && payload?.playlistId) {
          await db.update(screens).set({ currentPlaylistId: payload.playlistId, updatedAt: now }).where(eq(screens.id, screenId));
          broadcast('SCREEN_UPDATED', { screenIds: [screenId], action: 'set_playlist', playlistId: payload.playlistId });
        } else if (action === 'show_message' && payload?.message) {
          const data = JSON.stringify({ type: 'QUICK_POST', payload: { id: `qr-${Date.now()}`, message: payload.message, style: payload.style || 'info', targetScreenIds: [screenId], duration: payload.duration || 15, createdAt: now.toISOString() }, timestamp: now.toISOString() });
          wss.clients.forEach((c) => { if (c.readyState === WebSocket.OPEN) c.send(data); });
        } else {
          return res.status(400).json({ error: 'Invalid action or missing payload' });
        }

        res.json({ success: true, action, screenId });
      } catch (e) { next(e); }
    });

  // ─── Admin Module Control ──────────────────────────────
  // GET/PUT widget module settings (which widgets are enabled)
  app.get('/api/settings/modules',
    authenticate as any,
    async (_req, res) => {
      try {
        // Read from a simple JSON stored in DB or file; for now use localStorage on client
        res.json({ enabledWidgets: 'all', message: 'Module control managed client-side via localStorage signage_disabled_widgets' });
      } catch (e) { res.status(500).json({ error: 'Failed' }); }
    });

  // ─── Telemetry (device + admin) ────────────────────────
  app.post('/api/telemetry/heartbeat',
    authenticate as any, telemetryLimiter, validateBody(HeartbeatSchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { screenId, status, storageUsageMb, uptimeSeconds } = req.body;
        // ⚠️ อัปเดต IP/MAC จริงทุก heartbeat — จอที่รายงานตัวจะได้ค่าจริงแทน mock เก่า
        // REQ-002: connection IP เป็นหลัก (spoof ไม่ได้) → reported IP เป็น fallback
        const clientIp = getClientIp(req);
        const reportedIp = typeof req.body?.ipAddress === 'string' && req.body.ipAddress.trim()
          ? req.body.ipAddress.trim()
          : null;
        const reportedMac = typeof req.body?.macAddress === 'string' && req.body.macAddress.trim()
          ? req.body.macAddress.trim().slice(0, 17)
          : null;
        await db.update(screens).set({
          status, lastHeartbeat: new Date(), updatedAt: new Date(),
          ...(storageUsageMb !== undefined && { storageUsageMb }),
          ...(uptimeSeconds !== undefined && { uptimeSeconds }),
          ...(clientIp ? { ipAddress: clientIp } : (reportedIp ? { ipAddress: reportedIp } : {})),
          ...(reportedMac ? { macAddress: reportedMac } : {}),
        }).where(eq(screens.id, screenId));
        await db.insert(telemetryLogs).values({ screenId, screenName: screenId, eventType: 'heartbeat', message: `Status: ${status}`, details: { eventKey: heartbeatEventKey(status), params: { status } } });
        broadcast('SCREEN_HEARTBEAT', { screenId, status, storageUsageMb, uptimeSeconds });
        res.json({ success: true, receivedAt: new Date().toISOString() });
      } catch (e) { next(e); }
    });

  // ─── Analytics (viewer+) ───────────────────────────────
  app.get('/api/analytics/proof-of-play',
    authenticate as any, requirePermission('read:analytics') as any,
    async (req, res, next) => {
      try {
        const limit = Math.min(Number(req.query.limit ?? 100), 500);
        const rows = await db.select().from(proofOfPlayLogs).orderBy(desc(proofOfPlayLogs.playedAt)).limit(limit);
        res.json({ data: rows, total: rows.length });
      } catch (e) { next(e); }
    });

  // ─── POST /api/analytics/proof-of-play (REQ-005) ────────
  // player/kiosk รายงานการเล่นสื่อจริง → Analytics มีข้อมูลจริง
  app.post('/api/analytics/proof-of-play',
    authenticate as any, telemetryLimiter, validateBody(ProofOfPlaySchema),
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { screenId, screenName, mediaId, mediaTitle, playedAt, durationSeconds, status } = req.body;
        // ⚠️ Security: display token รายงานได้เฉพาะจอของตัวเอง (admin รายงานได้ทุกจอ)
        const tok = req.user as any;
        if (tok?.type === 'display' && tok.screenId && tok.screenId !== screenId) {
          return res.status(403).json({ error: 'Display token can only report for its own screen' });
        }
        await db.insert(proofOfPlayLogs).values({
          screenId,
          screenName: screenName || screenId,
          mediaId,
          mediaTitle: mediaTitle || mediaId,
          playedAt: playedAt ? new Date(playedAt) : new Date(),
          durationSeconds: durationSeconds ?? 0,
          status: status || 'completed',
        });
        res.status(201).json({ success: true });
      } catch (e) { next(e); }
    });

  app.get('/api/analytics/telemetry',
    authenticate as any, requirePermission('read:analytics') as any,
    async (req, res, next) => {
      try {
        const limit = Math.min(Number(req.query.limit ?? 100), 500);
        // Server-side i18n: รับภาษา client ผ่าน ?lang= หรือ Accept-Language header
        let lang = typeof req.query.lang === 'string' && isSupportedLanguage(req.query.lang)
          ? req.query.lang
          : (req.headers['accept-language'] ?? '').split(',')[0]?.trim().slice(0, 2).toLowerCase();
        if (!isSupportedLanguage(lang)) lang = 'en';
        const rows = await db.select().from(telemetryLogs).orderBy(desc(telemetryLogs.createdAt)).limit(limit);
        const data = rows.map((r) => {
          const details = (r.details ?? {}) as Record<string, unknown>;
          const eventKey = typeof details.eventKey === 'string' ? details.eventKey : null;
          if (!eventKey) return r; // rows ที่เขียนก่อนมี eventKey → คืน message เดิม (fallback)
          const params = (details.params ?? undefined) as TranslationVars | undefined;
          return { ...r, message: translate(lang as string, eventKey as TranslationKey, params) };
        });
        res.json({ data, total: data.length });
      } catch (e) { next(e); }
    });

  app.get('/api/analytics/summary',
    authenticate as any, requirePermission('read:analytics') as any,
    async (_req, res, next) => {
      try {
        const [popCount] = await db.select({ count: sql<number>`count(*)::int` }).from(proofOfPlayLogs);
        const [telCount] = await db.select({ count: sql<number>`count(*)::int` }).from(telemetryLogs);
        const [errCount] = await db.select({ count: sql<number>`count(*)::int` }).from(telemetryLogs).where(eq(telemetryLogs.eventType, 'error'));
        const [onlineCount] = await db.select({ count: sql<number>`count(*)::int` }).from(screens).where(eq(screens.status, 'online'));
        res.json({ totalPlayEvents: popCount?.count ?? 0, totalTelemetryLogs: telCount?.count ?? 0, errorCount: errCount?.count ?? 0, onlineScreens: onlineCount?.count ?? 0 });
      } catch (e) { next(e); }
    });


  // ─── Display Token (for TV Kiosk — no login required) ──
  // POST /api/display/generate-token — Admin สร้าง display token สำหรับจอ
  app.post('/api/display/generate-token',
    authenticate as any, requireRole('admin', 'super_admin') as any,
    async (req: AuthenticatedRequest, res, next) => {
      try {
        const { screenId } = req.body;
        if (!screenId) return res.status(400).json({ error: 'screenId required' });
        const [screen] = await db.select().from(screens).where(eq(screens.id, screenId));
        if (!screen) return res.status(404).json({ error: 'Screen not found' });

        // Generate a long-lived JWT (30 days) for display kiosk
        const jwt = await import('jsonwebtoken');
        const displayToken = jwt.default.sign(
          { screenId, type: 'display', name: screen.name },
          JWT_SECRET,
          { expiresIn: '365d' }
        );

        // Protocol-agnostic (โหมดสลับ HTTP/HTTPS ไม่ต้องแก้ config/redeploy):
        // ใช้ protocol+host จาก request — ผ่าน Caddy (trust proxy เปิดอยู่)
        // ได้ https:// อัตโนมัติ, เข้าตรง :3100 ได้ http:// — APP_URL เป็น fallback
        const host = req.get('host');
        const baseUrl = host ? `${req.protocol}://${host}` : (process.env.APP_URL || `http://localhost:${PORT}`);
        const displayUrl = `${baseUrl}/display/${screenId}?token=${displayToken}`;
        await logAudit(req, 'generate_display_token', 'screen', screenId, { name: screen.name });
        res.json({ success: true, screenId, displayToken, displayUrl, expiresIn: '30 days' });
      } catch (e) { next(e); }
    });

  // POST /api/display/pair — TV ส่ง pairing code มา → ได้ display token กลับ
  app.post('/api/display/pair', async (req, res, next) => {
    try {
      const { pairingCode, deviceInfo } = req.body;
      if (!pairingCode) return res.status(400).json({ error: 'pairingCode is required' });

      // Find screen by pairing code (case-insensitive)
      const [screen] = await db.select().from(screens)
        .where(eq(screens.pairingCode, pairingCode.toUpperCase().trim()));

      if (!screen) {
        return res.status(404).json({
          error: 'Invalid pairing code. Check the code and try again.',
          code: 'PAIRING_CODE_INVALID',
        });
      }

      // Enforce 1 code = 1 device — if screen was recently active (heartbeat < 2 min), reject
      if (screen.status === 'online' && screen.lastHeartbeat) {
        const lastBeat = new Date(screen.lastHeartbeat).getTime();
        const twoMinAgo = Date.now() - 2 * 60 * 1000;
        if (lastBeat > twoMinAgo) {
          return res.status(409).json({
            error: 'This display is already paired and active. Admin must unpair it first.',
            code: 'ALREADY_PAIRED',
          });
        }
      }

      // Update screen with device info
      // REQ-002: connection IP เป็นหลัก (spoof ไม่ได้) → reported IP จาก device เป็น fallback
      const clientIp = getClientIp(req);
      const updates: any = { status: 'online', lastHeartbeat: new Date(), updatedAt: new Date() };
      const reportedIp = typeof deviceInfo?.ipAddress === 'string' && deviceInfo.ipAddress.trim()
        ? deviceInfo.ipAddress.trim()
        : null;
      if (clientIp) updates.ipAddress = clientIp;
      else if (reportedIp) updates.ipAddress = reportedIp;
      if (typeof deviceInfo?.macAddress === 'string' && deviceInfo.macAddress.trim()) {
        updates.macAddress = deviceInfo.macAddress.trim().slice(0, 17);
      }
      if (deviceInfo?.resolution) updates.resolution = deviceInfo.resolution;
      if (deviceInfo?.userAgent) updates.firmwareVersion = deviceInfo.userAgent.slice(0, 30);
      await db.update(screens).set(updates).where(eq(screens.id, screen.id));

      // Generate display token (30 days)
      const jwt = await import('jsonwebtoken');
      const displayToken = jwt.default.sign(
        { screenId: screen.id, type: 'display', name: screen.name, pairedAt: new Date().toISOString() },
        JWT_SECRET,
        { expiresIn: '365d' }
      );

      // Log telemetry
      await db.insert(telemetryLogs).values({
        screenId: screen.id, screenName: screen.name,
        eventType: 'command_exec',
        message: `Device paired successfully via code: ${pairingCode}`,
        details: { eventKey: 'evt.pairOk', params: { code: pairingCode } },
      });

      const displayUrl = `/display/${screen.id}?token=${displayToken}`;

      res.json({
        success: true,
        screen: { id: screen.id, name: screen.name, group: screen.group, location: screen.location },
        displayToken,
        displayUrl,
        expiresIn: '30 days',
      });
    } catch (e) { next(e); }
  });

  // GET /api/display/:screenId/data — Public (token in query) player data endpoint
  app.get('/api/display/:screenId/data', async (req, res, next) => {
    try {
      const token = req.query.token as string;
      if (!token) return res.status(401).json({ error: 'Display token required (?token=xxx)' });

      const jwt = await import('jsonwebtoken');
      let payload: any;
      try {
        payload = jwt.default.verify(token, JWT_SECRET);
      } catch {
        return res.status(401).json({ error: 'Invalid or expired display token' });
      }

      if (payload.screenId !== req.params.screenId) {
        return res.status(403).json({ error: 'Token does not match this screen' });
      }

      // Get screen + layout + zones + playlists + media
      const [screen] = await db.select().from(screens).where(eq(screens.id, req.params.screenId));
      if (!screen) return res.status(404).json({ error: 'Screen not found' });

      // Update heartbeat — proves the display is alive and fetching data
      await db.update(screens).set({
        lastHeartbeat: new Date(),
        status: screen.status === 'offline' ? 'online' : screen.status,
      }).where(eq(screens.id, req.params.screenId));

      // ── REQ-003: Server-side scheduler — ตัดสินใจจากฝั่ง server ว่าจอโชว์อะไร ──
      // ถ้ามี schedule active → ใช้ layout/playlist ของ schedule (ไม่ต้องพึ่งจอเปิดอยู่ตอนสร้าง schedule)
      const now = new Date();
      const resolution = await resolveScreenContent(req.params.screenId, now);

      // Content Approval: จอเห็นเฉพาะเพลย์ลิสต์/layout ที่ approved + published เท่านั้น
      const allPlaylists = (await db.query.playlists.findMany({ with: { items: true } })).filter((p) => isApprovedContent(p));
      const approvedPlaylistIds = new Set(allPlaylists.map((p) => p.id));

      let effectiveLayoutId = resolution.layoutId || screen.currentLayoutId || null;
      let layout = null;
      if (effectiveLayoutId) {
        const l = await db.query.layouts.findFirst({ where: eq(layouts.id, effectiveLayoutId), with: { zones: true } });
        if (l && isApprovedContent(l)) layout = l;
        else effectiveLayoutId = null; // layout ยังไม่ approved → ไม่ส่งให้จอ (จอใช้ fallback ของตัวเอง)
      }

      let effectivePlaylistId =
        resolution.playlistId && approvedPlaylistIds.has(resolution.playlistId)
          ? resolution.playlistId
          : screen.currentPlaylistId && approvedPlaylistIds.has(screen.currentPlaylistId)
            ? screen.currentPlaylistId
            : null;
      const allMedia = await db.select().from(mediaItems);
      // Media Expiration + Embargo: จอไม่ได้รับ media ที่หมดอายุแล้ว หรือยังไม่ถึงวันเปิดตัว
      const visibleMedia = allMedia.filter((m) => isMediaPlayable(m, now));

      // Emergency: alert ที่ active สำหรับจอนี้ (kiosk ที่เปิดค้าง/เพิ่ง reconnect จะขึ้น overlay ทันที)
      const activeEmergency = screen.activeEmergencyId
        ? (await db.select().from(emergencyAlerts).where(eq(emergencyAlerts.id, screen.activeEmergencyId)))[0] ?? null
        : null;

      res.json({
        screen,
        layout,
        playlists: allPlaylists,
        mediaItems: visibleMedia,
        serverTime: now.toISOString(),
        // REQ-003/006/011: ข้อมูล schedule/campaign ที่ active อยู่ + ระดับ priority
        schedule: resolution.schedule
          ? { id: resolution.schedule.id, name: resolution.schedule.name, layoutId: resolution.layoutId, playlistId: resolution.playlistId, priority: resolution.schedule.priority, priorityLevel: resolution.priorityLevel }
          : null,
        campaign: resolution.campaign
          ? { id: resolution.campaign.id, name: resolution.campaign.name, layoutSequence: resolution.campaign.layoutSequence, cycleMode: resolution.campaign.cycleMode, createdAt: resolution.campaign.createdAt }
          : null,
        priorityLevel: resolution.priorityLevel,
        contentSource: resolution.source,
        effectivePlaylistId,
        emergency: activeEmergency?.isActive ? activeEmergency : null,
      });
    } catch (e) { next(e); }
  });

  // ─── Global Error Handler ──────────────────────────────
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size: 500MB', code: 'FILE_TOO_LARGE' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum: 5', code: 'TOO_MANY_FILES' });
    }
    if (err.message?.includes('File type not allowed')) {
      return res.status(415).json({ error: err.message, code: 'INVALID_FILE_TYPE' });
    }
    console.error('[Error]', err.message || err);
    res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  });

  // ─── Static / Vite ─────────────────────────────────────
  // GET /api/monitoring/status — สถานะ monitoring รายจอ (heartbeat, ระยะเวลา offline, alert)
  // ⚠️ ต้องมาก่อน SPA fallback (app.get('*')) — ไม่งั้น route ไม่เคย match
  app.get('/api/monitoring/status',
    authenticate as any, requirePermission('read:analytics') as any,
    async (_req, res, next) => {
      try {
        const now = new Date();
        const threshold = new Date(now.getTime() - MONITOR_OFFLINE_MINUTES * 60 * 1000);
        const all = await db.select().from(screens).orderBy(asc(screens.name));
        const list = all.map((s) => {
          const hb = s.lastHeartbeat;
          const offlineMinutes = hb ? Math.max(0, Math.floor((now.getTime() - hb.getTime()) / 60_000)) : null;
          const state = monitorState.get(s.id);
          return {
            id: s.id,
            name: s.name,
            group: s.group ?? '',
            status: s.status,
            lastHeartbeat: hb?.toISOString() ?? null,
            offlineForMinutes: offlineMinutes,
            isStale: !!hb && hb < threshold,
            alertActive: state?.alertActive ?? false,
            alertSince: state?.alertedAt?.toISOString() ?? null,
          };
        });
        const offline = list.filter((s) => s.isStale);
        const online = list.filter((s) => !s.isStale);
        res.json({
          summary: {
            total: list.length,
            online: online.length,
            offline: offline.length,
            alerting: list.filter((s) => s.alertActive).length,
            offlineThresholdMinutes: MONITOR_OFFLINE_MINUTES,
            checkedAt: now.toISOString(),
          },
          screens: list,
          alerts: offline.map((s) => ({
            screenId: s.id, name: s.name, group: s.group,
            offlineForMinutes: s.offlineForMinutes,
            since: s.alertSince,
          })),
        });
      } catch (e) { next(e); }
    });

  // GET /api/audit-logs — REQ-010: ดู audit log ย้อนหลัง (admin+)
  // filter: action, resource, q (email/resourceId), limit
  app.get('/api/audit-logs',
    authenticate as any, requirePermission('read:audit') as any,
    async (req, res, next) => {
      try {
        const limit = Math.min(Number(req.query.limit ?? 100), 500);
        const action = typeof req.query.action === 'string' && req.query.action ? req.query.action : null;
        const resource = typeof req.query.resource === 'string' && req.query.resource ? req.query.resource : null;
        const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : null;
        const page = Math.max(0, Number(req.query.page ?? 0));

        const conditions = [];
        if (action) conditions.push(eq(auditLogs.action, action));
        if (resource) conditions.push(eq(auditLogs.resource, resource));
        if (q) conditions.push(sql`(
          ${auditLogs.userEmail} ILIKE ${'%' + q + '%'}
          OR ${auditLogs.resourceId} ILIKE ${'%' + q + '%'}
        )`);

        const where = conditions.length ? and(...conditions) : undefined;
        const rows = await db.select().from(auditLogs)
          .where(where)
          .orderBy(desc(auditLogs.createdAt))
          .limit(limit)
          .offset(page * limit);
        const [cnt] = await db.select({ n: sql<number>`count(*)::int` }).from(auditLogs).where(where);
        res.json({ data: rows, total: cnt?.n ?? rows.length, limit, page });
      } catch (e) { next(e); }
    });

  // ─── Backups (REQ-007) ──────────────────────────────────
  // ต้องมาก่อน SPA fallback (app.get('*')) — ไม่งั้น route ไม่เคย match
  app.get('/api/backups',
    authenticate as any, requirePermission('read:backups') as any,
    (_req, res, next) => {
      try {
        const list = listBackups();
        res.json({
          data: list,
          config: {
            dir: BACKUP_DIR,
            retentionDays: BACKUP_RETENTION_DAYS,
            scheduleHour: BACKUP_HOUR,
          },
          lastRun: list[0]?.createdAt ?? null,
        });
      } catch (e) { next(e); }
    });

  app.post('/api/backups/run',
    authenticate as any, requirePermission('write:backups') as any,
    async (req, res, next) => {
      try {
        const files = await runBackup();
        await logAudit(req, 'create', 'backup', undefined, {
          db: path.basename(files.db),
          uploads: path.basename(files.uploads),
        });
        const list = listBackups();
        res.status(201).json({ ok: true, files, lastRun: list[0]?.createdAt ?? null, data: list });
      } catch (e) { next(e); }
    });

  app.get('/api/backups/:file/download',
    authenticate as any, requirePermission('read:backups') as any,
    (req, res, next) => {
      try {
        const full = resolveBackupFile(req.params.file);
        if (!full) return res.status(404).json({ error: 'Backup file not found' });
        res.download(full, req.params.file);
      } catch (e) { next(e); }
    });

  app.delete('/api/backups/:file',
    authenticate as any, requirePermission('write:backups') as any,
    async (req, res, next) => {
      try {
        const removed = deleteBackupFile(req.params.file);
        if (!removed) return res.status(404).json({ error: 'Backup file not found' });
        await logAudit(req, 'delete', 'backup', req.params.file, {}, 'warning');
        res.json({ ok: true });
      } catch (e) { next(e); }
    });

  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Assets (JS/CSS with hash) → cache long
    app.use('/assets', express.static(path.join(distPath, 'assets'), { maxAge: '30d' }));
    // Other static files
    app.use(express.static(distPath, { maxAge: 0 }));
    // SPA fallback — no-cache index.html so WebView always gets latest JS bundle reference
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // ─── REQ-008: Monitoring & Alerting ──────────────────────
  // ทุก 30 วิ: ตรวจ heartbeat ของทุกจอ — จอที่เงียบเกิน threshold → เปลี่ยนเป็น offline
  // + บันทึกเหตุการณ์ (telemetry) + แจ้งเตือน (webhook ถ้าตั้ง SLACK_ALERT_WEBHOOK_URL) + broadcast
  const MONITOR_OFFLINE_MINUTES = Math.max(1, Number(process.env.MONITOR_OFFLINE_MINUTES || 5));
  const monitorState = new Map<string, { alertActive: boolean; alertedAt: Date }>();

  async function fireMonitorAlert(kind: 'offline' | 'online', s: { id: string; name: string; group: string | null }) {
    const url = process.env.SLACK_ALERT_WEBHOOK_URL;
    if (!url) return;
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🖥️ *Signage Monitor*: ${s.name} (${s.id}) — ${kind === 'offline' ? '🔴 OFFLINE' : '🟢 back ONLINE'}`,
          attachments: [{
            color: kind === 'offline' ? '#ef4444' : '#22c55e',
            fields: [
              { title: 'Screen', value: s.name, short: true },
              { title: 'Group', value: s.group || '—', short: true },
              { title: 'ID', value: s.id, short: true },
            ],
          }],
        }),
      });
    } catch (e) {
      console.error('[Monitor] webhook alert failed:', (e as Error).message);
    }
  }

  async function runMonitoringCheck() {
    try {
      const now = new Date();
      const threshold = new Date(now.getTime() - MONITOR_OFFLINE_MINUTES * 60 * 1000);
      const all = await db.select().from(screens);
      for (const s of all) {
        // จอที่ยังไม่เคยส่ง heartbeat เลย (เช่น seed ที่ยังไม่ pair) → ไม่เตือน
        const hb = s.lastHeartbeat;
        const isStale = !!hb && hb < threshold;
        const state = monitorState.get(s.id) ?? { alertActive: false, alertedAt: now };

        if (isStale && ['online', 'syncing', 'app_inactive'].includes(s.status)) {
          // เพิ่ง offline (ไม่มี heartbeat เกิน threshold)
          await db.update(screens).set({ status: 'offline', updatedAt: now }).where(eq(screens.id, s.id));
          await db.insert(telemetryLogs).values({
            screenId: s.id, screenName: s.name,
            eventType: 'screen_offline',
            message: `Screen offline — no heartbeat for ${MONITOR_OFFLINE_MINUTES}+ min`,
            details: { eventKey: 'evt.monOffline', params: { minutes: MONITOR_OFFLINE_MINUTES }, offlineThresholdMinutes: MONITOR_OFFLINE_MINUTES, lastHeartbeat: hb.toISOString() },
          });
          monitorState.set(s.id, { alertActive: true, alertedAt: now });
          void fireMonitorAlert('offline', s);
          broadcast('SCREEN_OFFLINE', { screenId: s.id, name: s.name, since: now.toISOString() });
        } else if (state.alertActive && hb && !isStale) {
          // จอกลับมา online แล้ว (heartbeat สด) — ยกเลิก alert + แจ้งกลับ
          monitorState.set(s.id, { alertActive: false, alertedAt: now });
          await db.insert(telemetryLogs).values({
            screenId: s.id, screenName: s.name,
            eventType: 'screen_online',
            message: 'Screen back online (monitor resolved)',
            details: { eventKey: 'evt.monOnline', lastHeartbeat: hb.toISOString() },
          });
          void fireMonitorAlert('online', s);
          broadcast('SCREEN_ONLINE', { screenId: s.id, name: s.name });
        }
      }
    } catch (e) {
      console.error('[Monitor] check failed:', (e as Error).message);
    }
  }

  // ตรวจทุก 30 วิ (รอบเดียวกับ scheduler ticker)
  setInterval(() => { void runMonitoringCheck(); }, 30_000);

  // ─── Backup Scheduler (REQ-007) ──────────────────────────
  // อัตโนมัติ 1 ครั้ง/วัน (BACKUP_HOUR) + ลบไฟล์เก่าเกิน retention
  startBackupScheduler();

  // ─── Schedule Ticker (REQ-003) ───────────────────────────
  // ทุก 30 วิ: ตรวจว่า schedule ของแต่ละจอเปลี่ยนไปไหม → broadcast SCHEDULE_CHANGED
  // (จอที่ offline อยู่ตอน schedule เริ่ม จะได้ content ที่ถูกต้องทันทีที่ reconnect — ผ่าน endpoint /api/display/:id/data)
  setInterval(() => { void pushScheduleUpdates(); }, 30_000);
  void pushScheduleUpdates(); // sync ครั้งแรก (ยังบังคับให้ client ที่ connect ค้างอยู่ refresh ด้วย)

  // ─── Start ─────────────────────────────────────────────
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🖥️  NextGen Digital Signage Engine v0.2.0`);
    console.log(`   HTTP  → http://0.0.0.0:${PORT}`);
    console.log(`   WS    → ws://0.0.0.0:${PORT}${WS_PATH}`);
    console.log(`   Mode  → ${IS_PROD ? 'production' : 'development'}`);
    console.log(`   Auth  → JWT + RBAC + API Key`);
    console.log(`   Rate  → Enabled (6 tiers)\n`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal] Server startup failed:', err);
  pool.end().finally(() => process.exit(1));
});
