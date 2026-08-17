// ─── Helpers สำหรับ REQ-009 integration tests ────────────────
// ใช้กับ dev server ที่รันอยู่ (npm run dev) — ไม่แตะ prod
// รัน: node --test tests/
import 'dotenv/config';
import pg from 'pg';
import { WebSocket } from 'ws';

// ⛔ Safety guard — ห้ามรันเทสบน prod (เทสสร้าง/ลบข้อมูลใน DB ที่มันชี้ไป)
if (process.env.NODE_ENV === 'production') {
  throw new Error('REJECTED: integration tests must NOT run on production (NODE_ENV=production). Run on dev only.');
}

export const BASE = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100/api';

// ⚠️ รหัส admin ไม่ hardcode ลงในเทส — อ่านจาก env TEST_ADMIN_PASSWORD
// (ต้องตั้งให้ตรงกับ dev DB — ดู .env / เปลี่ยนด้วย change-admin-password.bat)
export const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';

// ─── HTTP helpers ────────────────────────────────────────────
export async function raw(method, path, { token, body, query, headers: extraHeaders } = {}) {
  const url = `${BASE}${path}${query ? '?' + new URLSearchParams(query) : ''}`;
  const headers = { ...(extraHeaders ?? {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* ไม่ใช่ JSON */ }
  return { status: res.status, json, headers: res.headers };
}

export async function loginAdmin() {
  if (!TEST_ADMIN_PASSWORD) {
    throw new Error('TEST_ADMIN_PASSWORD ไม่ได้ตั้ง — ใส่รหัส admin dev ลงใน .env (TEST_ADMIN_PASSWORD=...) แล้วรันเทสใหม่');
  }
  const r = await raw('POST', '/auth/login', {
    body: { email: 'admin@signage.local', password: TEST_ADMIN_PASSWORD },
  });
  if (r.status !== 200 || !r.json?.accessToken) {
    throw new Error(`login failed: ${r.status} ${JSON.stringify(r.json)}`);
  }
  return r.json.accessToken;
}

export const adminHeaders = (token) => ({ token });

// ─── API wrappers (ใช้ในเทส) ─────────────────────────────────
export const api = {
  screens: {
    list: (t) => raw('GET', '/screens', { token: t }),
    create: (t, body) => raw('POST', '/screens', { token: t, body }),
    update: (t, id, body) => raw('PATCH', `/screens/${id}`, { token: t, body }),
    remove: (t, id) => raw('DELETE', `/screens/${id}`, { token: t }),
  },
  layouts: {
    list: (t) => raw('GET', '/layouts', { token: t }),
    create: (t, body) => raw('POST', '/layouts', { token: t, body }),
    remove: (t, id) => raw('DELETE', `/layouts/${id}`, { token: t }),
    approve: (t, id, approvalStatus) => raw('PATCH', `/layouts/${id}/approve`, { token: t, body: { approvalStatus } }),
  },
  playlists: {
    list: (t) => raw('GET', '/playlists', { token: t }),
    create: (t, body) => raw('POST', '/playlists', { token: t, body }),
    remove: (t, id) => raw('DELETE', `/playlists/${id}`, { token: t }),
    approve: (t, id, approvalStatus) => raw('PATCH', `/playlists/${id}/approve`, { token: t, body: { approvalStatus } }),
  },
  schedules: {
    list: (t) => raw('GET', '/schedules', { token: t }),
    create: (t, body) => raw('POST', '/schedules', { token: t, body }),
    remove: (t, id) => raw('DELETE', `/schedules/${id}`, { token: t }),
    resolve: (t, screenId) => raw('GET', '/schedules/resolve', { token: t, query: { screenId } }),
  },
  campaigns: {
    create: (t, body) => raw('POST', '/campaigns', { token: t, body }),
    list: (t) => raw('GET', '/campaigns', { token: t }),
    remove: (t, id) => raw('DELETE', `/campaigns/${id}`, { token: t }),
  },
  display: {
    generateToken: (t, screenId) => raw('POST', '/display/generate-token', { token: t, body: { screenId } }),
    pair: (body) => raw('POST', '/display/pair', { body }),
    data: (screenId, displayToken) => raw('GET', `/display/${screenId}/data`, { query: { token: displayToken } }),
  },
  telemetry: {
    heartbeat: (token, body) => raw('POST', '/telemetry/heartbeat', { token, body }),
  },
  analytics: {
    postPop: (token, body) => raw('POST', '/analytics/proof-of-play', { token, body }),
    getPop: (t, limit = 20) => raw('GET', `/analytics/proof-of-play?limit=${limit}`, { token: t }),
  },
  monitoring: {
    status: (t) => raw('GET', '/monitoring/status', { token: t }),
  },
  audit: {
    logs: (t, params = {}) => raw('GET', `/audit-logs`, { token: t, query: params }),
  },
  backups: {
    list: (t) => raw('GET', '/backups', { token: t }),
    run: (t) => raw('POST', '/backups/run', { token: t }),
    download: (t, name) => raw('GET', `/backups/${encodeURIComponent(name)}/download`, { token: t }),
    remove: (t, name) => raw('DELETE', `/backups/${encodeURIComponent(name)}`, { token: t }),
  },
  security: {
    ssrf: (url) => raw('GET', `/media-proxy?url=${encodeURIComponent(url)}`),
  },
  emergency: {
    trigger: (t, body) => raw('POST', '/emergency/trigger', { token: t, body }),
    clear:   (t, body) => raw('POST', '/emergency/clear', { token: t, body }),
  },
  schedulerSnapshots: {
    list:   (t) => raw('GET', '/scheduler-snapshots', { token: t }),
    create: (t, body) => raw('POST', '/scheduler-snapshots', { token: t, body }),
    remove: (t, id) => raw('DELETE', `/scheduler-snapshots/${encodeURIComponent(id)}`, { token: t }),
  },
};

// ─── WebSocket helpers ────────────────────────────────────────
// server.ts: WS_PATH = /ws (บนพอร์ตเดียวกับ REST)
export const WS_URL = BASE.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws';

// เปิด WS client (token=admin → authenticated, null → anonymous/player)
// คืน { ws, messages } — messages เก็บทุก JSON ที่ได้รับ
export function openWs(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL + (token ? `?token=${token}` : ''));
    const messages = [];
    ws.on('message', (raw) => {
      try { messages.push(JSON.parse(raw.toString())); } catch { /* ข้ามข้อความที่ไม่ใช่ JSON */ }
    });
    ws.on('error', (err) => reject(err));
    ws.on('open', () => resolve({ ws, messages }));
  });
}

// รอจนกว่า cond() เป็นจริง (หรือหมดเวลา) — ใช้รอ WS message
export async function waitFor(cond, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (cond()) return true;
    await new Promise((r) => setTimeout(r, 50));
  }
  return cond();
}

// ─── DB access ตรง (สำหรับเทส offline detection) ────────────
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// ⚠️ คอลัมน์จริงเป็น snake_case (drizzle map) — ใช้ "last_heartbeat"
export async function dbSetHeartbeat(screenId, minutesAgo) {
  const ts = new Date(Date.now() - minutesAgo * 60_000);
  await pool.query(`UPDATE screens SET "last_heartbeat" = $1, status = 'offline' WHERE id = $2`, [ts, screenId]);
}

export async function dbGetHeartbeat(screenId) {
  const r = await pool.query(`SELECT "last_heartbeat", status FROM screens WHERE id = $1`, [screenId]);
  return r.rows[0] ?? null;
}

export async function dbClose() {
  await pool.end();
}

// ─── Utils ───────────────────────────────────────────────────
// ใช้ local date (ตรงกับ server's localDateStr) — toISOString() เป็น UTC จะเพี้ยน
// ในช่วง 00:00-07:00 ตามเวลาไทย (local วันใหม่ แต่ UTC ยังเป็นวันเก่า) → schedule
// ที่สร้างด้วย "วันนี้" จะถูกมองว่าเกิน endDate แล้วโดน skip
// Fix: ใช้ getFullYear/getMonth/getDate เหมือน server.ts localDateStr
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
export function todayDate() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function nowHHMM() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  // เวลาที่ครอบ "ตอนนี้" เสมอ: เริ่ม 1 ชม.ก่อน, จบ 1 ชม.หลัง (ข้ามเที่ยงคืนได้)
  const start = new Date(d.getTime() - 60 * 60 * 1000);
  const end = new Date(d.getTime() + 60 * 60 * 1000);
  return { start: `${p(start.getHours())}:${p(start.getMinutes())}`, end: `${p(end.getHours())}:${p(end.getMinutes())}` };
}

// id สั้นๆ กันชนกับข้อมูลจริง
export function tid(prefix) {
  return `${prefix}-${Date.now().toString(36)}`;
}
