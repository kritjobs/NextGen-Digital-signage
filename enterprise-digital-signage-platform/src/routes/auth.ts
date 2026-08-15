/**
 * Auth Routes — Enterprise Authentication
 * POST /api/auth/login
 * POST /api/auth/register
 * POST /api/auth/refresh
 * POST /api/auth/logout
 * GET  /api/auth/me
 */
import { Router } from 'express';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import {
  authenticate, generateAccessToken,
  generateRefreshToken, hashPassword,
  verifyPassword, logAudit,
  requireRole, REFRESH_TOKEN_EXPIRES_IN,
  MAX_FAILED_ATTEMPTS, LOCKOUT_DURATION_MIN,
  AuthenticatedRequest,
} from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { LoginSchema, RegisterSchema, RefreshTokenSchema, ChangePasswordSchema } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';

export const authRouter = Router();


// ─── POST /api/auth/login ────────────────────────────────────
authRouter.post('/login', authLimiter, validateBody(LoginSchema), async (req: any, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', code: 'AUTH_FAILED' });
    }

    // Check if locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const mins = Math.ceil((new Date(user.lockedUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        error: `Account locked. Try again in ${mins} minutes.`,
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Check if active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account disabled', code: 'ACCOUNT_DISABLED' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      // Increment failed attempts
      const attempts = user.failedAttempts + 1;
      const lockUntil = attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MIN * 60 * 1000)
        : null;

      await db.update(users).set({
        failedAttempts: attempts,
        lockedUntil: lockUntil,
        updatedAt: new Date(),
      }).where(eq(users.id, user.id));

      await logAudit(req, 'login_failed', 'auth', user.id, { email, attempts }, 'warning');

      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'AUTH_FAILED',
        remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - attempts),
      });
    }

    // Success — reset failed attempts
    await db.update(users).set({
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id, email: user.email,
      role: user.role as any, displayName: user.displayName,
    });

    const refreshTokenValue = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: refreshTokenValue,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null,
      expiresAt,
    });

    await logAudit(req, 'login', 'auth', user.id, { email }, 'info');

    res.json({
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900,  // 15 minutes in seconds
      user: {
        id: user.id, email: user.email,
        displayName: user.displayName, role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed', code: 'AUTH_ERROR' });
  }
});


// ─── POST /api/auth/register ─────────────────────────────────
authRouter.post('/register', authLimiter, authenticate as any, requireRole('admin', 'super_admin') as any, validateBody(RegisterSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { email, password, displayName, role } = req.body;

    // Check existing
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase()));
    if (existing) {
      return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Only super_admin can create admin users
    if (role === 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super_admin can create admin users', code: 'FORBIDDEN' });
    }

    const userId = `usr-${Date.now()}`;
    const passwordHash = await hashPassword(password);

    const [newUser] = await db.insert(users).values({
      id: userId, email: email.toLowerCase(),
      passwordHash, displayName, role,
      isActive: true,
    }).returning();

    await logAudit(req, 'create', 'user', userId, { email, role, createdBy: req.user?.email }, 'info');

    res.status(201).json({
      id: newUser.id, email: newUser.email,
      displayName: newUser.displayName, role: newUser.role,
      createdAt: newUser.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed', code: 'AUTH_ERROR' });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────
authRouter.post('/refresh', validateBody(RefreshTokenSchema), async (req: any, res) => {
  try {
    const { refreshToken: tokenValue } = req.body;

    // Find valid token
    const [token] = await db.select().from(refreshTokens)
      .where(and(
        eq(refreshTokens.token, tokenValue),
        gt(refreshTokens.expiresAt, new Date()),
      ));

    if (!token || token.revokedAt) {
      return res.status(401).json({ error: 'Invalid or expired refresh token', code: 'REFRESH_INVALID' });
    }

    // Find user
    const [user] = await db.select().from(users).where(eq(users.id, token.userId));
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User account disabled', code: 'ACCOUNT_DISABLED' });
    }

    // Revoke old token
    await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, token.id));

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id, email: user.email,
      role: user.role as any, displayName: user.displayName,
    });

    const newRefreshToken = generateRefreshToken();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 24 * 60 * 60 * 1000);

    await db.insert(refreshTokens).values({
      userId: user.id, token: newRefreshToken,
      userAgent: req.headers['user-agent'] || null,
      ipAddress: req.ip || null, expiresAt,
    });

    res.json({
      accessToken, refreshToken: newRefreshToken,
      expiresIn: 900,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Token refresh failed', code: 'AUTH_ERROR' });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────
authRouter.post('/logout', authenticate as any, async (req: AuthenticatedRequest, res) => {
  try {
    // Revoke all refresh tokens for this user
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(refreshTokens.userId, req.user!.userId),
        gt(refreshTokens.expiresAt, new Date()),
      ));

    await logAudit(req, 'logout', 'auth', req.user!.userId, {}, 'info');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ─── POST /api/auth/change-password ──────────────────────────
// ผู้ใช้เปลี่ยนรหัสตัวเอง — ต้องส่งรหัสเดิม + รหัสใหม่ (ห้ามใช้รหัส default)
authRouter.post('/change-password', authenticate as any, validateBody(ChangePasswordSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.userId;

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect', code: 'AUTH_FAILED' });
    }

    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({
      passwordHash,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));

    // Revoke refresh tokens — บังคับล็อกอินใหม่ทุกเครื่อง
    await db.update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(refreshTokens.userId, userId),
        gt(refreshTokens.expiresAt, new Date()),
      ));

    await logAudit(req, 'change_password', 'auth', userId, {}, 'warning');
    res.json({ success: true, message: 'Password changed. Please log in again.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password', code: 'AUTH_ERROR' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────
authRouter.get('/me', authenticate as any, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db.select({
      id: users.id, email: users.email,
      displayName: users.displayName, role: users.role,
      lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
    }).from(users).where(eq(users.id, req.user!.userId));

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});
