/**
 * Enterprise Input Validation Middleware
 * Zod schemas สำหรับทุก endpoint — ป้องกัน Mass Assignment + invalid data
 */
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

// ─── Generic Validator Middleware ────────────────────────────
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        issues: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    req.body = result.data;  // Replace with sanitized data
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        error: 'Invalid query parameters',
        code: 'VALIDATION_ERROR',
        issues: result.error.issues.map(i => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
      return;
    }
    next();
  };
}

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Screens
// ═══════════════════════════════════════════════════════════════

export const CreateScreenSchema = z.object({
  id:           z.string().max(50).optional(),
  pairingCode:  z.string().min(3).max(20),
  name:         z.string().min(1).max(200),
  group:        z.string().max(100).default(''),
  location:     z.string().max(300).default(''),
  orientation:  z.enum(['landscape', 'portrait', 'custom']).default('landscape'),
  resolution:   z.string().max(50).default('1920x1080 (FHD)'),
  volume:       z.number().int().min(0).max(100).default(75),
  isMuted:      z.boolean().default(false),
}).passthrough();

export const UpdateScreenSchema = z.object({
  name:              z.string().min(1).max(200).optional(),
  group:             z.string().max(100).optional(),
  location:          z.string().max(300).optional(),
  orientation:       z.enum(['landscape', 'portrait', 'custom']).optional(),
  resolution:        z.string().max(50).optional(),
  status:            z.enum(['online', 'offline', 'syncing', 'error', 'emergency']).optional(),
  volume:            z.number().int().min(0).max(100).optional(),
  isMuted:           z.boolean().optional(),
  currentLayoutId:   z.string().max(50).nullable().optional(),
  currentPlaylistId: z.string().max(50).nullable().optional(),
  firmwareVersion:   z.string().max(30).optional(),
}).passthrough();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Media Items
// ═══════════════════════════════════════════════════════════════

export const CreateMediaSchema = z.object({
  id:            z.string().max(50).optional(),
  title:         z.string().min(1).max(300),
  type:          z.enum(['image', 'video', 'ticker', 'weather', 'clock', 'webpage', 'announcement']),
  url:           z.string().max(2048).default(''),
  duration:      z.number().int().min(1).max(86400).default(10),
  sizeMb:        z.number().min(0).max(100000).default(0),
  tags:          z.array(z.string().max(50)).max(20).default([]),
  thumbnailUrl:  z.string().max(2048).default(''),
  tickerText:    z.string().max(2000).optional(),
  tickerSpeed:   z.number().int().min(1).max(200).optional(),
  weatherCity:   z.string().max(100).optional(),
  clockFormat:   z.enum(['12h', '24h']).optional(),
  announceHeader:z.string().max(200).optional(),
  announceBody:  z.string().max(2000).optional(),
  webUrl:        z.string().url().max(2048).optional(),
}).strict();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Playlists
// ═══════════════════════════════════════════════════════════════

export const CreatePlaylistSchema = z.object({
  id:          z.string().max(50).optional(),
  name:        z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
  tags:        z.array(z.string().max(50)).max(20).default([]),
  totalDuration: z.number().int().optional(),
  items:       z.array(z.object({
    id:         z.string().max(50).optional(),
    mediaId:    z.string().min(1).max(50),
    duration:   z.number().int().min(1).max(86400).default(10),
    order:      z.number().int().min(1).max(999),
    transition: z.enum(['fade', 'slide', 'zoom', 'none']).default('fade'),
  })).optional(),
}).passthrough();

export const UpdatePlaylistSchema = z.object({
  name:        z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  tags:        z.array(z.string().max(50)).max(20).optional(),
  totalDuration: z.number().optional(),
  items:       z.array(z.object({
    id:         z.string().max(50).optional(),
    mediaId:    z.string().min(1).max(50),
    duration:   z.number().int().min(1).max(86400).default(10),
    order:      z.number().int().min(1).max(999),
    transition: z.enum(['fade', 'slide', 'zoom', 'none']).default('fade'),
  })).optional(),
}).passthrough();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Schedules
// ═══════════════════════════════════════════════════════════════

export const CreateScheduleSchema = z.object({
  id:             z.string().max(50).optional(),
  name:           z.string().min(1).max(200),
  playlistId:     z.string().max(50).optional(),
  layoutId:       z.string().max(50).optional(),
  screenGroupIds: z.array(z.string().max(100)).default([]),
  screenIds:      z.array(z.string().max(50)).default([]),
  priority:       z.number().int().min(1).max(100).default(50),
  startDate:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime:      z.string().regex(/^\d{2}:\d{2}$/).default('00:00'),
  endTime:        z.string().regex(/^\d{2}:\d{2}$/).default('23:59'),
  daysOfWeek:     z.array(z.number().int().min(0).max(6)).min(1).default([1,2,3,4,5]),
  isActive:       z.boolean().default(true),
}).strict();

export const UpdateScheduleSchema = z.object({
  name:           z.string().min(1).max(200).optional(),
  playlistId:     z.string().max(50).nullable().optional(),
  layoutId:       z.string().max(50).nullable().optional(),
  screenGroupIds: z.array(z.string().max(100)).optional(),
  screenIds:      z.array(z.string().max(50)).optional(),
  priority:       z.number().int().min(1).max(100).optional(),
  startDate:      z.string().optional(),
  endDate:        z.string().optional(),
  startTime:      z.string().optional(),
  endTime:        z.string().optional(),
  daysOfWeek:     z.array(z.number().int().min(0).max(6)).min(1).optional(),
  isActive:       z.boolean().optional(),
}).passthrough();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Campaigns (REQ-011)
// ═══════════════════════════════════════════════════════════════

export const CampaignLayoutItemSchema = z.object({
  layoutId:    z.string().min(1).max(50),
  durationSec: z.number().int().min(5).max(3600),
});

export const CreateCampaignSchema = z.object({
  id:             z.string().max(50).optional(),
  name:           z.string().min(1).max(200),
  description:    z.string().max(2000).optional().default(''),
  isActive:       z.boolean().optional().default(true),
  layoutSequence: z.array(CampaignLayoutItemSchema).default([]),
  cycleMode:      z.enum(['sequential', 'random']).optional().default('sequential'),
}).strict();

export const UpdateCampaignSchema = z.object({
  name:           z.string().min(1).max(200).optional(),
  description:    z.string().max(2000).optional(),
  isActive:       z.boolean().optional(),
  layoutSequence: z.array(CampaignLayoutItemSchema).optional(),
  cycleMode:      z.enum(['sequential', 'random']).optional(),
}).passthrough();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Emergency
// ═══════════════════════════════════════════════════════════════

export const TriggerEmergencySchema = z.object({
  title:           z.string().min(1).max(200).optional(),
  message:         z.string().max(2000).optional(),
  type:            z.enum(['fire', 'weather', 'lockdown', 'custom', 'all-clear']).default('custom'),
  severity:        z.enum(['critical', 'warning', 'info']).default('critical'),
  targetScreenIds: z.array(z.string().max(50)).default([]),
}).strict();

export const ClearEmergencySchema = z.object({
  alertId: z.string().min(1).max(50),
}).strict();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Control Commands
// ═══════════════════════════════════════════════════════════════

export const SendCommandSchema = z.object({
  screenId: z.string().min(1).max(50),
  command:  z.enum(['REBOOT', 'TAKE_SCREENSHOT', 'SYNC_PLAYBACK', 'PURGE_CACHE', 'SET_LAYOUT', 'SET_VOLUME', 'UNPAIR_DEVICE', 'FORCE_DISPLAY']),
  payload:  z.record(z.string(), z.unknown()).optional(),
}).strict();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Telemetry
// ═══════════════════════════════════════════════════════════════

export const ProofOfPlaySchema = z.object({
  screenId:        z.string().min(1).max(50),
  screenName:      z.string().max(200).optional().default(''),
  mediaId:         z.string().min(1).max(50),
  mediaTitle:      z.string().max(300).optional().default(''),
  playedAt:        z.string().optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional().default(0),
  status:          z.enum(['completed', 'interrupted', 'buffered', 'playing']).optional().default('completed'),
}).strict();

export const HeartbeatSchema = z.object({
  screenId:       z.string().min(1).max(50),
  status:         z.enum(['online', 'offline', 'syncing', 'error', 'emergency']),
  storageUsageMb: z.number().int().min(0).optional(),
  uptimeSeconds:  z.number().int().min(0).optional(),
  // Network info จริงจาก device (REQ-001) — server จะใช้ req.ip เป็น fallback
  ipAddress:      z.string().max(45).optional(),
  macAddress:     z.string().max(17).optional(),
}).strict();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS — Auth
// ═══════════════════════════════════════════════════════════════

export const LoginSchema = z.object({
  email:    z.string().email().max(255),
  password: z.string().min(8).max(128),
}).strict();

export const RegisterSchema = z.object({
  email:       z.string().email().max(255),
  password:    z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  displayName: z.string().min(2).max(200),
  role:        z.enum(['admin', 'staff', 'viewer']).default('viewer'),
}).strict();

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
}).strict();
