#!/usr/bin/env node
/**
 * watch-screen-online.mjs — ติดตาม heartbeat ของจอ + แจ้งเตือนเมื่อกลับมา online
 *
 * ใช้สำหรับจอที่ offline นาน (เช่น scr-002): ตัวสคริปต์ poll `/api/monitoring/status`
 * ทุก WATCH_INTERVAL_SEC วินาที และเมื่อจอที่ระบุเปลี่ยนจาก offline → online
 * จะแจ้งเตือน (console + log ไฟล์ + webhook ตัวเลือก)
 *
 * วิธีใช้:
 *   node scripts/watch-screen-online.mjs                    # รันต่อเนื่อง (default scr-002, 60 วิ)
 *   node scripts/watch-screen-online.mjs --screen scr-002 --interval 30
 *   node scripts/watch-screen-online.mjs --once             # ตรวจครั้งเดียวแล้วจบ
 *
 * env ที่อ่าน (จาก .env หรือ environment):
 *   WATCH_API_BASE     base URL ของ server (default: http://localhost:3100)
 *   WATCH_SCREEN_ID    จอที่เฝ้าดู (default: scr-002)
 *   WATCH_INTERVAL_SEC ความถี่ poll (default: 60)
 *   TEST_ADMIN_PASSWORD / WATCH_PASSWORD  รหัส admin สำหรับ login
 *   WATCH_ADMIN_EMAIL  email admin (default: admin@signage.local)
 *   WATCH_WEBHOOK_URL  (ตัวเลือก) POST JSON ไป webhook เมื่อจอกลับมา online (เช่น Slack/Teams)
 *
 * Log ไฟล์: logs/screen-watch.log (สร้างอัตโนมัติ)
 */
import { readFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ─── อ่าน .env (ถ้ามี) ────────────────────────────────────────
const envPath = join(root, '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const API_BASE = (process.env.WATCH_API_BASE || 'http://localhost:3100').replace(/\/$/, '');
const SCREEN_ID = process.argv.includes('--screen')
  ? process.argv[process.argv.indexOf('--screen') + 1]
  : (process.env.WATCH_SCREEN_ID || 'scr-002');
const INTERVAL_SEC = Number(
  process.argv.includes('--interval')
    ? process.argv[process.argv.indexOf('--interval') + 1]
    : (process.env.WATCH_INTERVAL_SEC || 60)
);
const ADMIN_EMAIL = process.env.WATCH_ADMIN_EMAIL || 'admin@signage.local';
const ADMIN_PASSWORD = process.env.WATCH_PASSWORD || process.env.TEST_ADMIN_PASSWORD;
const WEBHOOK_URL = process.env.WATCH_WEBHOOK_URL || '';
const ONCE = process.argv.includes('--once');

const logFile = join(root, 'logs', 'screen-watch.log');

function log(msg) {
  const line = `[${new Date().toLocaleString('th-TH')}] ${msg}`;
  console.log(line);
  try {
    if (!existsSync(join(root, 'logs'))) mkdirSync(join(root, 'logs'), { recursive: true });
    appendFileSync(logFile, line + '\n');
  } catch { /* ignore */ }
}

async function login() {
  if (!ADMIN_PASSWORD) throw new Error('ไม่พบรหัส admin — ตั้ง TEST_ADMIN_PASSWORD หรือ WATCH_PASSWORD ใน .env');
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const j = await res.json();
  if (!res.ok || !j.accessToken) throw new Error(`login ล้มเหลว (${res.status}): ${JSON.stringify(j).slice(0, 200)}`);
  return j.accessToken;
}

async function getStatus(token) {
  const res = await fetch(`${API_BASE}/api/monitoring/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`status ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

async function notify(title, text) {
  log(`${title} — ${text}`);
  if (WEBHOOK_URL) {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${title} — ${text}`, screenId: SCREEN_ID }),
      });
      log('  → webhook ส่งแล้ว');
    } catch (e) {
      log(`  ⚠️ webhook ล้มเหลว: ${e.message}`);
    }
  }
}

async function runOnce(token) {
  const j = await getStatus(token);
  const s = (j.screens || []).find((x) => x.id === SCREEN_ID);
  if (!s) {
    log(`⚠️ ไม่พบจอ ${SCREEN_ID} ในระบบ (${j.summary?.total ?? '?'} จอ)`);
    return;
  }
  const state = s.status === 'online' && !s.isStale ? 'ONLINE' : `OFFLINE (${s.offlineForMinutes ?? '?'} นาที)`;
  log(`จอ ${SCREEN_ID} (${s.name}): ${state} — offlineThreshold=${j.summary?.offlineThresholdMinutes} นาที`);
  return s;
}

async function main() {
  log(`── watch-screen-online เริ่ม ── จอ: ${SCREEN_ID} | server: ${API_BASE} | interval: ${INTERVAL_SEC}s` + (ONCE ? ' | --once' : ''));
  let token;
  try {
    token = await login();
  } catch (e) {
    log(`❌ ${e.message}`);
    process.exit(1);
  }

  let wasOnline = null; // null = ยังไม่รู้สถานะเริ่มต้น

  const check = async () => {
    try {
      const s = await runOnce(token);
      if (!s) return;
      const isOnline = s.status === 'online' && !s.isStale;

      if (wasOnline === false && isOnline) {
        await notify(
          '🎉 จอกลับมา ONLINE แล้ว!',
          `${SCREEN_ID} (${s.name}) กลับมาออนไลน์ — offline ไป ${s.offlineForMinutes ?? '?'}+ นาที (หรือหายไปช่วงหนึ่ง)`
        );
      }
      if (wasOnline !== false && !isOnline) {
        log(`ℹ️ จอ ${SCREEN_ID} ยัง OFFLINE (${s.offlineForMinutes ?? '?'} นาที) — เฝ้าดูต่อ...`);
      }
      wasOnline = isOnline;
    } catch (e) {
      // token อาจหมดอายุ (15 นาที) → login ใหม่
      if (/login|expired|401/.test(e.message)) {
        try { token = await login(); } catch { /* retry next cycle */ }
      }
      log(`⚠️ ตรวจไม่สำเร็จ: ${e.message}`);
    }
  };

  await check();
  if (ONCE) { log('── จบ (--once) ──'); return; }
  setInterval(check, INTERVAL_SEC * 1000);
}

main().catch((e) => { console.error(e); process.exit(1); });
