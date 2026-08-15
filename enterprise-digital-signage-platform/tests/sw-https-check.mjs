// sw-https-check.mjs — เทส Service Worker register + cache ผ่าน HTTPS prod (headless Edge + CDP)
// วิธีใช้: node tests/sw-https-check.mjs "<displayUrl>"
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
const url = process.argv[2];
if (!url || !url.startsWith('https://')) { console.error('Usage: node tests/sw-https-check.mjs "https://.../display/scr-XXX?token=..."'); process.exit(1); }

const profile = mkdtempSync(join(tmpdir(), 'fb-sw-'));
const edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWsUrl() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('CDP not ready');
}

let msgId = 0;
const pending = new Map();
const consoleMsgs = [];
let ws;
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) return { __error: r.exceptionDetails.text };
  return r.result?.value;
}

try {
  const wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); }
    if (msg.method === 'Runtime.consoleAPICalled') consoleMsgs.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    if (msg.method === 'Runtime.exceptionThrown') consoleMsgs.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Log.enable');

  console.log(`navigating: ${url.replace(/token=.*/, 'token=***')}`);
  await send('Page.navigate', { url });

  const probe = `(async () => {
    const out = { href: location.href, title: document.title, secure: isSecureContext, swSupported: 'serviceWorker' in navigator };
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      out.registrations = await Promise.all(regs.map(async (r) => ({
        scope: r.scope, active: !!r.active, state: r.active?.state,
        scriptURL: r.active?.scriptURL, installing: !!r.installing, waiting: !!r.waiting,
      })));
      out.swReady = !!regs.length;
      if ('caches' in window) {
        out.cacheNames = await caches.keys();
        const details = {};
        for (const name of out.cacheNames) {
          const c = await caches.open(name);
          const keys = await c.keys();
          details[name] = keys.map((k) => k.url.replace(/token=.*/, 'token=***')).slice(0, 60);
        }
        out.cacheDetails = details;
      }
    } catch (e) { out.swError = String(e); }
    return out;
  })()`;

  for (let i = 0; i < 6; i++) {
    await sleep(8000);
    const s = await evaluate(probe);
    const cacheCount = Object.values(s.cacheDetails || {}).reduce((a, k) => a + (k?.length || 0), 0);
    const hasMedia = (s.cacheNames || []).some((n) => n.includes('media'));
    console.log(`[poll ${i + 1}] href=${s.href.includes('10.70.0.1') ? 'https-prod' : s.href} regs=${s.registrations?.length ?? 0} caches=${JSON.stringify(s.cacheNames)} items=${cacheCount}`);
    // scr-001 ยังไม่มี playlist กำหนด → kiosk ไมดึง media เอง —
    // fetch ไฟล์ media ผานหนา (ผาน SW) เพื่อพิสูจนวา media cache ทำงาน
    if (!hasMedia && i === 1) {
      const r = await evaluate(`(async () => {
        const tok = new URLSearchParams(location.search).get('token') || '';
        const d = await (await fetch('/api/display/scr-001/data?token=' + tok)).json();
        const data = d.data || d;
        const url = (data.mediaItems || [])[0]?.url;
        if (!url) return { url: null };
        const rr = await fetch(url);
        return { url, ok: rr.ok, status: rr.status, type: rr.headers.get('content-type') };
      })()`);
      console.log('  -> media fetch through SW:', JSON.stringify(r));
      await sleep(4000);
    }
    if (hasMedia && cacheCount > 2) { console.log(JSON.stringify(s, null, 2)); break; }
    if (i === 5) console.log(JSON.stringify(s, null, 2));
  }
  console.log('\n=== console (last 15) ===');
  consoleMsgs.slice(-15).forEach((m) => console.log('  ' + m.slice(0, 300)));
} finally {
  try { ws?.close(); } catch {}
  try { edge.kill(); } catch {}
  await sleep(800);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* profile ยังถูกล็อก — ปล่อยไว้ใน temp */ }
}
