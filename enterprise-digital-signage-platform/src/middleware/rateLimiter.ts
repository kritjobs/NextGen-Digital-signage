/**
 * Enterprise Rate Limiting
 * ป้องกัน abuse, DDoS, และ spam ที่แต่ละ endpoint group
 */
import rateLimit from 'express-rate-limit';

// ─── General API (ทั่วไป) ────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 นาที
  max: 200,               // 200 requests / นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '60 seconds',
  },
});

// ─── Auth endpoints (login/register) ─────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 10,                   // 10 attempts / 15 นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Account may be temporarily locked.',
    code: 'AUTH_RATE_LIMIT',
    retryAfter: '15 minutes',
  },
  skipSuccessfulRequests: true,  // นับเฉพาะ failed attempts
});

// ─── Emergency endpoints (วิกฤต — จำกัดเข้มงวด) ─────────────
export const emergencyLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 นาที
  max: 5,                  // 5 ครั้ง / นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Emergency broadcast rate limit exceeded. This is logged.',
    code: 'EMERGENCY_RATE_LIMIT',
  },
});

// ─── Control commands (ป้องกัน spam reboot/purge) ────────────
export const commandLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 นาที
  max: 30,                 // 30 commands / นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Command rate limit exceeded.',
    code: 'COMMAND_RATE_LIMIT',
  },
});

// ─── Telemetry heartbeat (devices ส่งบ่อย — loose limit) ─────
export const telemetryLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 นาที
  max: 120,                // 120 heartbeats / นาที / IP (2/sec)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Telemetry rate limit exceeded.',
    code: 'TELEMETRY_RATE_LIMIT',
  },
});

// ─── Interact (QR viewer actions — กัน spam เปลี่ยนเนื้อหาจอ) ──
export const interactLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 นาที
  max: 10,                 // 10 actions / นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many interact actions. Please slow down.',
    code: 'INTERACT_RATE_LIMIT',
  },
});

// ─── Write operations (create/update/delete) ─────────────────
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1 นาที
  max: 60,                 // 60 writes / นาที / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Write operation rate limit exceeded.',
    code: 'WRITE_RATE_LIMIT',
  },
});
