#!/usr/bin/env node
/**
 * mock-test-server.mjs — ทดสอบ webos-player shell บนเบราว์เซอร์ปกติ (ไม่ต้องมี server จริง)
 *
 *  Serve โฟลเดอร์ webos-player/ แบบ static + จำลอง API ของ platform:
 *    GET  /api/health                → { status:'ok', ... }
 *    POST /api/display/pair          → รับ pairingCode ใดๆ → คืน token + screen (เหมือน server จริง)
 *    GET  /display/:screenId?token=  → หน้า display จำลอง (ทดสอบว่า iframe โหลดผ่าน)
 *
 *  รัน:  node scripts/mock-test-server.mjs        (จากโฟลเดอร์ webos-player)
 *  แล้วเปิด: http://localhost:4177
 *
 *  ⚠️ ไม่มีการเขียนข้อมูลจริง — ใช้ทดสอบ shell flow เท่านั้น
 */
'use strict';

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// ใช้ MOCK_PORT เฉพาะ — อย่าใช้ PORT เพราะ environment บางเครื่องตั้ง PORT=0 ไว้แล้ว
const PORT = Number(process.env.MOCK_PORT || 4177) || 4177;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
};

function json(res, obj, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

/** หน้า display จำลอง — เหมือน DisplayKiosk คร่าวๆ: แสดง screen id + token ว่า iframe ส่งถูก */
function displayPage(screenId, token) {
  const ok = !!token;
  return `<!DOCTYPE html>
<html lang="th"><head><meta charset="utf-8"><title>Mock Display</title>
<style>
  html,body{margin:0;height:100%;background:#0B0E14;color:#E2E8F0;
    font-family:system-ui,Arial,sans-serif;display:flex;align-items:center;justify-content:center}
  .box{text-align:center;padding:48px;border:1px solid rgba(34,211,238,.4);border-radius:20px;background:#10222e}
  h1{color:#22D3EE;margin:0 0 12px}
  .id{font-size:28px;font-weight:800;margin-bottom:8px}
  .tok{font-size:11px;color:#64748B;word-break:break-all;max-width:520px}
  .warn{color:#FBBF24;font-weight:700;font-size:18px}
</style></head>
<body>
  <div class="box">
    <h1>🎬 MOCK DISPLAY PAGE</h1>
    ${ok ? `
      <div class="id">screen: ${screenId}</div>
      <div class="tok">token: ${token}</div>
      <p style="color:#94A3B8;font-size:13px">(หน้านี้จำลอง React DisplayKiosk — ถ้าเห็นแสดงว่า iframe + query ถูกต้อง)</p>
    ` : `
      <div class="warn">⚠️ TOKEN REQUIRED</div>
      <p style="color:#94A3B8;font-size:13px">เปิด /display/ โดยไม่มี ?token=</p>
    `}
  </div>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  // ── Mock APIs ───────────────────────────────────────────
  if (p === '/api/health') {
    json(res, { status: 'ok', service: 'MOCK', version: '0.0.0', database: 'connected', timestamp: new Date().toISOString() });
    return;
  }

  if (p === '/api/display/pair' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      let pairingCode = 'MOCK';
      try { pairingCode = (JSON.parse(body).pairingCode || 'MOCK').toString(); } catch { /* default */ }
      const token = 'mock.' + Buffer.from(JSON.stringify({ screenId: 'mock-screen-1', name: pairingCode })).toString('base64url');
      json(res, {
        success: true,
        screen: { id: 'mock-screen-1', name: 'MOCK-' + pairingCode, group: 'Test', location: 'Browser' },
        displayToken: token,
        displayUrl: `/display/mock-screen-1?token=${token}`,
        expiresIn: '30 days',
      });
    });
    return;
  }

  if (p.startsWith('/display/')) {
    const id = p.split('/')[2] || 'unknown';
    const token = url.searchParams.get('token') || '';
    // จำลอง server ที่เปิด iframe ได้ (ไม่ส่ง X-Frame-Options)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(displayPage(id, token));
    return;
  }

  // ── Static files ของ shell ──────────────────────────────
  const file = path.join(root, p === '/' ? 'index.html' : p);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404: ' + p);
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

server.listen(PORT, () => {
  console.log(`✅ Mock signage server พร้อมใช้งาน: http://localhost:${PORT}`);
  console.log(`   - เปิด shell: http://localhost:${PORT}/`);
  console.log(`   - server URL ที่กรอกในหน้า Settings: http://localhost:${PORT}`);
  console.log(`   - pairing code: อะไรก็ได้ (เช่น LOBBY-88)`);
});
