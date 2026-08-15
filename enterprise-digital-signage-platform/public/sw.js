/* ═══════════════════════════════════════════════════════════════
 * Service Worker — Offline-First Web Player (REQ-004)
 *
 * กลยุทธ์แคช:
 *  - navigate (หน้า app)      → network-first, fallback cache  (เปิดจอได้แม้ offline)
 *  - /api/display/*data       → network-first, fallback cache  (ข้อมูลจอเล่นต่อได้เมื่อเน็ตหลุด)
 *  - /uploads/* + /api/media-*→ stale-while-revalidate        (สื่อที่เล่นแล้วเล่นซ้ำได้ offline)
 *  - /assets/* (hashed)       → cache-first                   (ไม่เปลี่ยน → ไม่ต้องไปเน็ต)
 *  - อย่างอื่น (auth/CRUD)    → network-only                   (ห้าม cache ข้อมูลที่ต้องสด)
 *
 * ⚠️ ตัว SW นี้ตั้งใจให้ cache เฉพาะ GET ที่จำเป็น — อย่าเพิ่ม route ที่ตอบข้อมูล
 *    อ่อนไหว (auth token, audit, backups) ลงไป
 * ═══════════════════════════════════════════════════════════════ */
const VERSION = 'signage-sw-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const DATA_CACHE = `${VERSION}-data`;
const MEDIA_CACHE = `${VERSION}-media`;

const DATA_RE = /^\/api\/display\/.*\/data(\?|$)/;   // ข้อมูลจอ (มี token ใน query — key คงที่ต่อจอ)
const MEDIA_RE = /^\/api\/media-proxy/;               // สื่อผ่าน proxy
const UPLOAD_RE = /^\/uploads\//;                     // ไฟล์มีเดียจริง
const ASSET_RE = /^\/assets\//;                       // JS/CSS hashed

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(['/']).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, cacheName, { copy = false } = {}) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw new Error('offline & no cache');
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // มี cache → เสิร์ฟทันที + อัปเดตพื้นหลัง (ไม่รอเน็ต)
    fetch(req)
      .then((res) => { if (res.ok) cache.put(req, res.clone()); })
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    // offline + ยังไม่เคยแคช → 504 ชัดเจน (player จะเห็นว่าไม่มี cache)
    return new Response(JSON.stringify({ error: 'offline & no cache' }), {
      status: 504, headers: { 'Content-Type': 'application/json' },
    });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // เฉพาะ GET เท่านั้น — อย่างอื่นปล่อยให้ network ปกติ
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // cross-origin ไม่ยุ่ง

  const path = url.pathname;

  // หน้า app (navigate) — network-first
  if (req.mode === 'navigate') {
    event.respondWith(networkFirst(req, SHELL_CACHE));
    return;
  }

  // ข้อมูลจอ — network-first (สดก่อน, offline ใช้ cache)
  if (DATA_RE.test(path)) {
    event.respondWith(networkFirst(req, DATA_CACHE));
    return;
  }

  // สื่อ — stale-while-revalidate (เล่นได้ทันทีจาก cache + อัปเดตพื้นหลัง)
  if (UPLOAD_RE.test(path) || MEDIA_RE.test(path)) {
    event.respondWith(staleWhileRevalidate(req, MEDIA_CACHE));
    return;
  }

  // assets hashed — cache-first
  if (ASSET_RE.test(path)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // อย่างอื่น — network-only
});

// ─── ใช้สำหรับ debug/แสดงสถานะแคชจากหน้า player ─────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_INFO') {
    Promise.all([
      caches.open(DATA_CACHE).then((c) => c.keys()),
      caches.open(MEDIA_CACHE).then((c) => c.keys()),
    ]).then(([dataKeys, mediaKeys]) => {
      event.ports[0]?.postMessage({
        version: VERSION,
        dataCount: dataKeys.length,
        mediaCount: mediaKeys.length,
        media: mediaKeys.slice(0, 20).map((k) => k.url),
      });
    });
  }
  if (event.data?.type === 'PING') {
    event.ports[0]?.postMessage({ pong: true, version: VERSION });
  }
});
