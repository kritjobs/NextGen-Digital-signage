/**
 * Enterprise Authentication & Authorization Middleware
 * - JWT Bearer Token verification
 * - Role-Based Access Control (RBAC)
 * - API Key authentication (for devices)
 * - Audit logging helper
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, apiKeys, auditLogs, refreshTokens } from '../db/schema.js';
import { eq, and, gt } from 'drizzle-orm';

// ─── Types ──────────────────────────────────────────────────
export type UserRole = 'super_admin' | 'admin' | 'staff' | 'viewer' | 'device';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  displayName: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  apiKeyId?: string;
}

// ─── Config ─────────────────────────────────────────────────
const DEFAULT_JWT_SECRET = 'CHANGE_THIS_IN_PRODUCTION_64_CHARS_MIN';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

// Fail fast: production must never run with the well-known default secret
if (process.env.NODE_ENV === 'production' && JWT_SECRET === DEFAULT_JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET must be set to a strong value in production. Add it to .env and restart.');
}

const JWT_EXPIRES_IN = '15m';           // Access token: 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = 7;     // Refresh token: 7 days
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MIN = 15;

export { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MIN };

// ─── Role Hierarchy (higher number = more permissions) ──────
const ROLE_LEVELS: Record<UserRole, number> = {
  device:      0,
  viewer:      1,
  staff:       2,
  admin:       3,
  super_admin: 4,
};

// ─── Permission Matrix ──────────────────────────────────────
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  device: [
    'read:screens', 'write:heartbeat', 'read:playlists', 'read:layouts', 'read:media',
  ],
  viewer: [
    'read:screens', 'read:media', 'read:playlists', 'read:layouts',
    'read:schedules', 'read:analytics', 'read:emergencies',
  ],
  staff: [
    'read:screens', 'read:media', 'read:playlists', 'read:layouts',
    'read:schedules', 'read:analytics', 'read:emergencies',
    'write:media', 'write:playlists', 'write:layouts', 'write:schedules',
  ],
  admin: [
    'read:screens', 'read:media', 'read:playlists', 'read:layouts',
    'read:schedules', 'read:analytics', 'read:emergencies', 'read:users',
    'read:audit', // REQ-010: ดู audit log ย้อนหลัง
    'read:backups', 'write:backups', // REQ-007: backup DB + uploads
    'write:media', 'write:playlists', 'write:layouts', 'write:schedules',
    'write:screens', 'write:commands', 'write:emergencies',
  ],
  super_admin: ['*'],  // All permissions
};

// ─── Token Generation ───────────────────────────────────────
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Password Utilities ─────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── Middleware: Authenticate (JWT or API Key) ──────────────
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  // Option 1: Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired access token', code: 'TOKEN_INVALID' });
      return;
    }

    req.user = payload;
    next();
    return;
  }

  // Option 2: API Key (for devices)
  if (apiKeyHeader) {
    authenticateApiKey(apiKeyHeader, req, res, next);
    return;
  }

  res.status(401).json({
    error: 'Authentication required. Provide Bearer token or X-API-Key header.',
    code: 'AUTH_REQUIRED',
  });
}

// ─── API Key Authentication (async) ─────────────────────────
async function authenticateApiKey(key: string, req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const prefix = key.slice(0, 8);
    const [apiKey] = await db.select().from(apiKeys)
      .where(and(eq(apiKeys.keyPrefix, prefix), eq(apiKeys.isActive, true)));

    if (!apiKey) {
      res.status(401).json({ error: 'Invalid API key', code: 'API_KEY_INVALID' });
      return;
    }

    // Check expiry
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      res.status(401).json({ error: 'API key expired', code: 'API_KEY_EXPIRED' });
      return;
    }

    // Verify key hash
    const isValid = await bcrypt.compare(key, apiKey.keyHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid API key', code: 'API_KEY_INVALID' });
      return;
    }

    // Update lastUsedAt
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, apiKey.id));

    // Set device user context
    req.user = {
      userId: apiKey.id,
      email: `device:${apiKey.name}`,
      role: 'device',
      displayName: apiKey.name,
    };
    req.apiKeyId = apiKey.id;
    next();
  } catch (err) {
    res.status(500).json({ error: 'API key validation failed', code: 'AUTH_ERROR' });
  }
}

// ─── Middleware: Optional Auth (doesn't block if no token) ──
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (payload) req.user = payload;
  }
  next();
}

// ─── Middleware: Webhook Auth (IoT/POS/Alarm/Slack) ────────
// External systems call trigger endpoints without a user login.
//   • If WEBHOOK_TOKEN is set: accept `X-Webhook-Token: <token>` (or `?token=` / body `token`)
//   • Otherwise fall back to a valid admin JWT (Bearer / API key)
//   • In production with no WEBHOOK_TOKEN configured: endpoint is disabled (503)
export function webhookAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const configured = process.env.WEBHOOK_TOKEN;
  const provided =
    (req.headers['x-webhook-token'] as string) ||
    (req.query.token as string) ||
    (typeof req.body?.token === 'string' ? req.body.token : undefined);

  if (configured) {
    if (provided && provided === configured) {
      next();
      return;
    }
    // Wrong/absent webhook token → try normal JWT auth below
  } else if (process.env.NODE_ENV !== 'production') {
    next(); // Dev convenience: open in non-production
    return;
  } else {
    res.status(503).json({ error: 'Webhook endpoint disabled: set WEBHOOK_TOKEN env to enable it' });
    return;
  }

  authenticate(req, res, next);
}

// ─── Middleware: Require Role (minimum level) ───────────────
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    const userLevel = ROLE_LEVELS[req.user.role] ?? 0;
    const hasRole = allowedRoles.some(role => ROLE_LEVELS[role] <= userLevel);

    if (!hasRole) {
      res.status(403).json({
        error: `Insufficient permissions. Required: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
        code: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}

// ─── Middleware: Require Permission ─────────────────────────
export function requirePermission(...permissions: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
      return;
    }

    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];

    // super_admin has wildcard
    if (userPerms.includes('*')) {
      next();
      return;
    }

    const hasAll = permissions.every(p => userPerms.includes(p));
    if (!hasAll) {
      res.status(403).json({
        error: `Missing permissions: ${permissions.filter(p => !userPerms.includes(p)).join(', ')}`,
        code: 'PERMISSION_DENIED',
      });
      return;
    }

    next();
  };
}

// ─── Audit Log Helper ───────────────────────────────────────
export async function logAudit(
  req: AuthenticatedRequest,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  severity: 'info' | 'warning' | 'critical' = 'info',
) {
  try {
    await db.insert(auditLogs).values({
      userId:     req.user?.userId || null,
      userEmail:  req.user?.email || null,
      action,
      resource,
      resourceId: resourceId || null,
      details:    details || null,
      ipAddress:  req.ip || req.headers['x-forwarded-for']?.toString() || null,
      userAgent:  req.headers['user-agent'] || null,
      severity,
    });
  } catch (err) {
    console.error('[Audit] Failed to log:', err);
  }
}
