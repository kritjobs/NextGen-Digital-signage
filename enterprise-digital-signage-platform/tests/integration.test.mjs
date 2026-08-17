// ═══════════════════════════════════════════════════════════════
// REQ-009 — Automated Integration Tests
// ครอบคลุม 7 งานที่ deploy ไป: REQ-003 scheduler, REQ-005 PoP,
// REQ-006 6-Level Priority, REQ-008 monitoring, REQ-010 audit,
// REQ-007 backup, REQ-011 campaigns + security guard & pair/heartbeat
//
// ข้อกำหนด:
//   - ต้องมี dev server รันอยู่ก่อน:  npm run dev  (พอร์ต 3100)
//   - รัน:  npm run test:integration
//   - ใช้ dev DB เท่านั้น — ไม่แตะ prod
//   - สร้างข้อมูลเทสด้วย prefix [TEST] แล้วลบให้เรียบร้อย
// ═══════════════════════════════════════════════════════════════
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  BASE, raw, loginAdmin, api, pool,
  dbSetHeartbeat, dbClose, todayDate, tid,
  openWs, waitFor,
} from './helpers.mjs';

// ─── Shared state ────────────────────────────────────────────
let token;
let testScreenId;
let testScreenPairing;
let displayToken;
let layoutId;        // layout ที่มีอยู่จริงใน dev DB
let mediaId;         // media ที่มีอยู่จริงใน dev DB
const created = { schedules: [], campaigns: [], layouts: [], screens: [] };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Setup ───────────────────────────────────────────────────
before(async () => {
  // เช็คว่า server รันอยู่ไหม
  const h = await fetch(BASE.replace('/api', '') + '/api/health').catch(() => null);
  if (!h || h.status !== 200) {
    throw new Error('Dev server ไม่ตอบสนอง — รัน `npm run dev` ก่อนเทส (พอร์ต 3100)');
  }
  token = await loginAdmin();

  // layout + media จริง (สำหรับ schedule/PoP)
  const layouts = await api.layouts.list(token);
  layoutId = layouts.json?.data?.[0]?.id;
  const media = await raw('GET', '/media', { token });
  mediaId = media.json?.data?.[0]?.id;
  if (!layoutId || !mediaId) throw new Error('dev DB ต้องมี layout + media อย่างน้อย 1 ตัว (รัน npm run db:seed)');

  // สร้างจอเทสเฉพาะ (ลบตอนจบ)
  testScreenId = tid('scr-test');
  testScreenPairing = `TP${Date.now().toString(36).slice(-6).toUpperCase()}`;
  // ⚠️ group ต้องเป็นค่าเฉพาะของเทส — seed schedules กำหนด screen_group_ids ไว้
  // (sch-001 = ['HQ Reception','R&D Labs'], sch-002 = ['Dining & Refreshments'], sch-003 = ['Executive Tower'])
  // ถ้าใช้ group เดียวกับ seed → จอเทสจะโดน schedule ของ seed แมทช์ผ่าน group (ผูกกับเวลาทำงานของกฎ)
  const s = await api.screens.create(token, {
    id: testScreenId, pairingCode: testScreenPairing,
    name: '[TEST] REQ-009 Integration', group: '[TEST] Integration',
    location: 'Test bench', orientation: 'landscape',
  });
  assert.equal(s.status, 201, `create screen: ${JSON.stringify(s.json)}`);
  created.screens.push(testScreenId);
});

after(async () => {
  // cleanup schedules/campaigns/layouts
  for (const id of created.schedules) await api.schedules.remove(token, id).catch(() => {});
  for (const id of created.campaigns) await api.campaigns.remove(token, id).catch(() => {});
  for (const id of created.layouts) await api.layouts.remove(token, id).catch(() => {});
  for (const id of created.screens) await api.screens.remove(token, id).catch(() => {});
  await dbClose();
});

// helper: สร้าง schedule ที่ active ตอนนี้เสมอ
async function makeActiveSchedule(priority, opts = {}) {
  const body = {
    name: `[TEST] Sched ${priority} ${Date.now().toString(36)}`,
    layoutId: opts.layoutId ?? layoutId,
    priority,
    startDate: todayDate(),
    endDate: todayDate(),
    startTime: '00:00',
    endTime: '23:59',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    screenIds: opts.screenIds ?? [testScreenId],
    isActive: true,
  };
  const r = await api.schedules.create(token, body);
  if (r.status === 201 && r.json?.id) created.schedules.push(r.json.id);
  return r;
}

// ═══════════════════════════════════════════════════════════════
// 1) Security guard + auth (REQ-009 core)
// ═══════════════════════════════════════════════════════════════
test('1. Security — 401/403/SSRF/login', async () => {
  // ไม่มี token
  const noTok = await raw('GET', '/screens');
  assert.equal(noTok.status, 401, 'GET /screens ไม่มี token ควร 401');

  // login ผิดรหัส
  const bad = await raw('POST', '/auth/login', { body: { email: 'admin@signage.local', password: 'wrongpass!' } });
  assert.equal(bad.status, 401, 'login ผิดรหัสควร 401');

  // SSRF guard — private IP ต้องโดนบล็อก
  const ssrf = await api.security.ssrf('http://169.254.169.254/latest/meta-data/');
  assert.equal(ssrf.status, 400, 'SSRF private IP ควรถูกบล็อก');
  assert.match(ssrf.json?.error ?? '', /blocked/i, 'error ควรบอก blocked');
});

// ═══════════════════════════════════════════════════════════════
// 2) Pair + heartbeat (device lifecycle)
// ═══════════════════════════════════════════════════════════════
test('2. Pair + Heartbeat — จอ pair ได้ + ส่ง heartbeat แล้ว status/IP อัปเดต', async () => {
  // pair ด้วย code ถูกต้อง
  const p1 = await api.display.pair({ pairingCode: testScreenPairing, deviceInfo: { macAddress: 'AA:BB:CC:DD:EE:01', resolution: '1920x1080' } });
  assert.equal(p1.status, 200, `pair ควรสำเร็จ: ${JSON.stringify(p1.json)}`);
  assert.ok(p1.json?.displayToken, 'ควรได้ displayToken');
  displayToken = p1.json.displayToken;

  // pair ซ้ำ (จอเพิ่ง active) → 409
  const p2 = await api.display.pair({ pairingCode: testScreenPairing });
  assert.equal(p2.status, 409, 'pair ซ้ำควร 409 (already paired)');

  // pair code ผิด → 404
  const p3 = await api.display.pair({ pairingCode: 'XXXXXX' });
  assert.equal(p3.status, 404, 'pair code ผิดควร 404');

  // heartbeat (ใช้ display token) → status online + receivedAt
  const hb = await api.telemetry.heartbeat(displayToken, {
    screenId: testScreenId, status: 'online', storageUsageMb: 123, uptimeSeconds: 456,
    ipAddress: '10.0.0.99', macAddress: 'AA:BB:CC:DD:EE:01',
  });
  assert.equal(hb.status, 200, 'heartbeat ควร 200');
  assert.ok(hb.json?.receivedAt, 'ควรได้ receivedAt');
});

// ═══════════════════════════════════════════════════════════════
// 3) REQ-005 — Proof of Play
// ═══════════════════════════════════════════════════════════════
test('3. REQ-005 PoP — POST/GET + auth (401/403) + body ผิด 400', async () => {
  const popBody = {
    screenId: testScreenId, screenName: '[TEST] PoP Screen',
    mediaId, mediaTitle: '[TEST] PoP Media', durationSeconds: 15, status: 'completed',
  };

  // ไม่มี token → 401
  const noTok = await api.analytics.postPop(null, popBody);
  assert.equal(noTok.status, 401, 'PoP ไม่มี token ควร 401');

  // จออื่นส่งแทน → 403 (ต้องใช้ display token ของจอตัวเอง)
  const otherScreen = await api.screens.create(token, {
    id: tid('scr-test-other'), pairingCode: `TQ${Date.now().toString(36).slice(-6).toUpperCase()}`,
    name: '[TEST] Other Screen', group: '', location: '',
  });
  created.screens.push(otherScreen.json.id);
  const otherTok = (await api.display.generateToken(token, otherScreen.json.id)).json.displayToken;
  const forbidden = await api.analytics.postPop(otherTok, popBody);
  assert.equal(forbidden.status, 403, 'display token ของจออื่นส่ง PoP ควร 403');

  // body ผิด (ขาด mediaId) → 400
  const badBody = await api.analytics.postPop(displayToken, { screenId: testScreenId });
  assert.equal(badBody.status, 400, 'body ไม่ครบควร 400');

  // ส่งของตัวเอง → 201
  const own = await api.analytics.postPop(displayToken, popBody);
  assert.equal(own.status, 201, `PoP ของจอตัวเองควร 201: ${JSON.stringify(own.json)}`);

  // GET roundtrip — เจอ record ที่เพิ่งส่ง
  const list = await api.analytics.getPop(token, 50);
  const found = (list.json?.data ?? []).some((p) => p.screenId === testScreenId && p.mediaTitle === '[TEST] PoP Media');
  assert.ok(found, 'GET PoP ควรเจอ record ที่เพิ่ง POST');
});

// ═══════════════════════════════════════════════════════════════
// 4) REQ-003 — Scheduler resolver
// ═══════════════════════════════════════════════════════════════
test('4. REQ-003 Scheduler — schedule ที่ตรงเงื่อนไขกลายเป็น active', async () => {
  const r = await makeActiveSchedule(50);
  assert.equal(r.status, 201, `create schedule: ${JSON.stringify(r.json)}`);
  const schedId = r.json.id;

  const res = await api.schedules.resolve(token, testScreenId);
  assert.equal(res.status, 200, 'resolve ควร 200');
  assert.equal(res.json?.schedule?.id, schedId, 'จอควรได้ schedule ที่สร้าง');
  assert.equal(res.json?.source, 'schedule', 'source ควรเป็น schedule');
  assert.equal(res.json?.priorityLevel, 'scheduled', 'ระดับควรเป็น scheduled');

  // จอที่ไม่มี schedule → ไม่มี schedule
  const idleScreen = await api.screens.create(token, {
    id: tid('scr-idle'), pairingCode: `TR${Date.now().toString(36).slice(-6).toUpperCase()}`,
    name: '[TEST] Idle Screen', group: '[TEST] Integration', location: '',
  });
  created.screens.push(idleScreen.json.id);
  const resIdle = await api.schedules.resolve(token, idleScreen.json.id);
  assert.equal(resIdle.json?.schedule, null, 'จอที่ไม่มี schedule ควรได้ null');

  // cleanup
  await api.schedules.remove(token, schedId).catch(() => {});
  created.schedules = created.schedules.filter((i) => i !== schedId);
});

// ═══════════════════════════════════════════════════════════════
// 5) REQ-006 — 6-Level Priority
// ═══════════════════════════════════════════════════════════════
test('5. REQ-006 Priority — ชนะด้วยตัวเลข + ระดับ; conflict ตามดีไซน์', async () => {
  const a = await makeActiveSchedule(60, { layoutId });
  const b = await makeActiveSchedule(30, { layoutId });
  assert.equal(a.status, 201); assert.equal(b.status, 201);
  const aId = a.json.id, bId = b.json.id;

  // 60 > 30 (ระดับเดียวกัน scheduled) → A ชนะ
  const res = await api.schedules.resolve(token, testScreenId);
  assert.equal(res.json?.schedule?.id, aId, 'priority 60 ควรชนะ 30');
  assert.equal(res.json?.priorityLevel, 'scheduled');

  // ลบ A → B ชนะ (ยังมีระดับ scheduled)
  await api.schedules.remove(token, aId);
  created.schedules = created.schedules.filter((i) => i !== aId);
  const res2 = await api.schedules.resolve(token, testScreenId);
  assert.equal(res2.json?.schedule?.id, bId, 'เหลือ B → B ควรชนะ');

  // ระดับ campaign (21-40) กับ default (11-20): schedule 15 ระดับ default
  // → campaign (สร้างในเทส 6) ควรชนะ schedule 15 แม้ตัวเลขน้อยกว่า — ตรวจในเทส 6
  await api.schedules.remove(token, bId);
  created.schedules = created.schedules.filter((i) => i !== bId);

  // ระดับสูงกว่าชนะแม้เลขน้อย: schedule 15 (default) vs schedule 20 (default) → 20 ชนะ
  const c = await makeActiveSchedule(20, { layoutId });
  const d = await makeActiveSchedule(15, { layoutId });
  const res3 = await api.schedules.resolve(token, testScreenId);
  assert.equal(res3.json?.schedule?.id, c.json.id, '20 ควรชนะ 15 (ระดับเดียวกัน)');
  await api.schedules.remove(token, c.json.id);
  await api.schedules.remove(token, d.json.id);
  created.schedules = created.schedules.filter((i) => i !== c.json.id && i !== d.json.id);
});

// ═══════════════════════════════════════════════════════════════
// 6) REQ-011 — Campaigns (server-side) + ระดับ campaign 21-40
// ═══════════════════════════════════════════════════════════════
test('6. REQ-011 Campaigns — CRUD + resolver ชนะ/แพ้ตามระดับ', async () => {
  const name = `[TEST] Campaign ${Date.now().toString(36)}`;
  const cr = await api.campaigns.create(token, {
    name, description: 'REQ-009 test',
    isActive: true,
    layoutSequence: [{ layoutId, durationSec: 10 }, { layoutId, durationSec: 10 }],
    cycleMode: 'sequential',
  });
  assert.equal(cr.status, 201, `create campaign: ${JSON.stringify(cr.json)}`);
  const campId = cr.json.id;
  created.campaigns.push(campId);

  // ไม่มี schedule → campaign ชนะ (ระดับ campaign 30)
  const res = await api.schedules.resolve(token, testScreenId);
  assert.equal(res.json?.source, 'campaign', 'ไม่มี schedule → campaign ควรชนะ');
  assert.equal(res.json?.campaign?.id, campId, 'resolve ควรคืน campaign ของเรา');
  assert.equal(res.json?.priorityLevel, 'campaign', 'priorityLevel ควรเป็น campaign');

  // schedule 25 (campaign band, 25 < 30) → campaign ยังชนะ
  const s25 = await makeActiveSchedule(25);
  const res2 = await api.schedules.resolve(token, testScreenId);
  assert.equal(res2.json?.source, 'campaign', 'schedule 25 ควรแพ้ campaign 30 (ระดับเดียวกัน เลขน้อยกว่า)');
  await api.schedules.remove(token, s25.json.id);
  created.schedules = created.schedules.filter((i) => i !== s25.json.id);

  // schedule 35 (campaign band, 35 > 30) → schedule ชนะ
  const s35 = await makeActiveSchedule(35);
  const res3 = await api.schedules.resolve(token, testScreenId);
  assert.equal(res3.json?.source, 'schedule', 'schedule 35 ควรชนะ campaign 30');
  await api.schedules.remove(token, s35.json.id);
  created.schedules = created.schedules.filter((i) => i !== s35.json.id);

  // schedule 15 (default level) → campaign ชนะแม้ campaign 30 > 15 (เทียบระดับก่อน)
  const s15 = await makeActiveSchedule(15);
  const res4 = await api.schedules.resolve(token, testScreenId);
  assert.equal(res4.json?.source, 'campaign', 'schedule 15 (ระดับ default) ควรแพ้ campaign 30 (เทียบระดับก่อนตัวเลข)');
  await api.schedules.remove(token, s15.json.id);
  created.schedules = created.schedules.filter((i) => i !== s15.json.id);

  // display data endpoint — campaign + layout อยู่ใน payload (จอจริงใช้ตัวนี้)
  const data = await api.display.data(testScreenId, displayToken);
  assert.equal(data.status, 200, 'display data ควร 200');
  assert.ok(data.json?.campaign, 'display data ควรมี campaign');

  // CRUD: list มี campaign + disable (PATCH) → resolve กลับเป็น default
  const list = await api.campaigns.list(token);
  assert.ok((list.json?.data ?? []).some((c) => c.id === campId), 'list ควรมี campaign');
  const patch = await raw('PATCH', `/campaigns/${campId}`, { token, body: { isActive: false } });
  assert.equal(patch.status, 200, 'PATCH campaign ควร 200');
  const res5 = await api.schedules.resolve(token, testScreenId);
  assert.equal(res5.json?.source, 'default', 'campaign ปิด → จอควรกลับ default');
});

// ═══════════════════════════════════════════════════════════════
// 7) REQ-008 — Monitoring & Alerting (รอ ticker 30 วิ)
// ═══════════════════════════════════════════════════════════════
test('7. REQ-008 Monitoring — ตรวจจับ offline + กลับ online (รอ ~35 วิ)', { timeout: 120_000 }, async () => {
  // เบื้องต้น: จอ heartbeat สด → online
  const st0 = await api.monitoring.status(token);
  assert.equal(st0.status, 200, 'monitoring status ควร 200');
  assert.ok(Array.isArray(st0.json?.screens), 'ควรมี screens[]');
  assert.ok(st0.json?.summary?.offlineThresholdMinutes >= 1, 'ควรมี threshold');

  // ทำให้จอเงียบ 10 นาที → monitor (ทุก 30 วิ) ต้องจับว่า offline
  await dbSetHeartbeat(testScreenId, 10);
  await sleep(35_000);
  const st1 = await api.monitoring.status(token);
  const row = (st1.json?.screens ?? []).find((s) => s.id === testScreenId);
  assert.ok(row, 'ควรเจอจอเทสใน status');
  assert.equal(row.isStale, true, 'heartbeat เก่า 10 นาที → isStale ควร true');
  assert.ok(row.offlineForMinutes >= 9, `offlineForMinutes ควร ~10 (ได้ ${row.offlineForMinutes})`);

  // จอกลับมา (heartbeat สด) → monitor ต้องเห็น online + alert เคลียร์
  const hb = await api.telemetry.heartbeat(displayToken, { screenId: testScreenId, status: 'online' });
  assert.equal(hb.status, 200, 'heartbeat กลับมาควร 200');
  await sleep(35_000);
  const st2 = await api.monitoring.status(token);
  const row2 = (st2.json?.screens ?? []).find((s) => s.id === testScreenId);
  assert.equal(row2.isStale, false, 'heartbeat สด → isStale ควร false');
});

// ═══════════════════════════════════════════════════════════════
// 8) REQ-010 — Audit log
// ═══════════════════════════════════════════════════════════════
test('8. REQ-010 Audit — login + layout create ถูกบันทึก; filter ทำงาน', async () => {
  // login (ตอน before) ควรอยู่ใน log
  const logs = await api.audit.logs(token, { action: 'login', limit: 5 });
  assert.equal(logs.status, 200);
  assert.ok((logs.json?.data ?? []).length >= 1, 'ควรมี login entry');

  // สร้าง layout → ต้องมี audit entry resource=layout
  const layName = `[TEST] Audit Layout ${Date.now().toString(36)}`;
  const lay = await api.layouts.create(token, { name: layName, description: 'REQ-009 test layout' });
  assert.equal(lay.status, 201, `create layout: ${JSON.stringify(lay.json)}`);
  created.layouts.push(lay.json.id);

  const layLogs = await api.audit.logs(token, { resource: 'layout', limit: 10 });
  const found = (layLogs.json?.data ?? []).some((l) => l.resourceId === lay.json.id && l.action === 'create');
  assert.ok(found, 'audit log ควรมี create layout ของเรา');

  // filter q (search ชื่อ email) — ไม่ error
  const qLogs = await api.audit.logs(token, { q: 'admin', limit: 5 });
  assert.equal(qLogs.status, 200, 'filter q ควรทำงาน');
});

// ═══════════════════════════════════════════════════════════════
// 10) REQ-004 — Service Worker (offline-first) ถูกเสิร์ฟถูกต้อง
// ═══════════════════════════════════════════════════════════════
test('10. REQ-004 SW — /sw.js ถูกเสิร์ฟ + มีกลยุทธ์ cache ครบ', async () => {
  const origin = BASE.replace('/api', '');
  const r = await fetch(`${origin}/sw.js`);
  assert.equal(r.status, 200, '/sw.js ควร 200');
  const text = await r.text();
  assert.match(text, /signage-sw-v1/, 'SW version ควรมี');
  assert.match(text, /networkFirst/, 'กลยุทธ์ network-first (ข้อมูลจอ) ควรมี');
  assert.match(text, /staleWhileRevalidate/, 'กลยุทธ์ media cache ควรมี');
  assert.match(text, /DATA_RE/, 'ควร cache เฉพาะ /api/display/*data');
});

// ═══════════════════════════════════════════════════════════════
// 9) REQ-007 — Backup (สร้างไฟล์จริงแล้วลบให้)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// 11) QR Scan-to-Interact (anonymous message + admin content switch)
// ═══════════════════════════════════════════════════════════════
test('11. QR Interact — GET screen + anonymous show_message OK + set_playlist 403', async () => {
  // GET ข้อมูลจอ (public)
  const info = await raw('GET', `/interact/${testScreenId}`);
  assert.equal(info.status, 200, 'GET /interact/:id ควร 200');
  assert.equal(info.json?.screen?.id, testScreenId);
  assert.ok(Array.isArray(info.json?.availableActions), 'ควรมี availableActions');

  // ไม่มี id → 404
  const nf = await raw('GET', '/interact/scr-does-not-exist');
  assert.equal(nf.status, 404, 'จอไม่มีควร 404');

  // ส่งข้อความ (anonymous) → 200
  const msg = await raw('POST', `/interact/${testScreenId}/action`, {
    body: { action: 'show_message', payload: { message: '[TEST] QR interact', style: 'info', duration: 5 } },
  });
  assert.equal(msg.status, 200, 'anonymous show_message ควร 200');
  assert.equal(msg.json?.success, true);

  // เปลี่ยน playlist โดยไม่ login → 403 (security gate)
  const sw = await raw('POST', `/interact/${testScreenId}/action`, {
    body: { action: 'set_playlist', payload: { playlistId: 'pl-anything' } },
  });
  assert.equal(sw.status, 403, 'anonymous set_playlist ควร 403');

  // action ไม่รู้จัก — anonymous → 403 (security gate ก่อน), admin → 400
  const badAnon = await raw('POST', `/interact/${testScreenId}/action`, {
    body: { action: 'hack', payload: {} },
  });
  assert.equal(badAnon.status, 403, 'anonymous + action ผิดควร 403 (gate มาก่อน)');
  const badAdmin = await raw('POST', `/interact/${testScreenId}/action`, {
    token,
    body: { action: 'hack', payload: {} },
  });
  assert.equal(badAdmin.status, 400, 'admin + action ผิดควร 400');
});

test('9. REQ-007 Backup — list/run/download/delete + path traversal', { timeout: 120_000 }, async () => {
  // list + config
  const list = await api.backups.list(token);
  assert.equal(list.status, 200);
  assert.ok(list.json?.config?.retentionDays >= 1, 'config ควรมี retentionDays');
  assert.ok(list.json?.config?.scheduleHour >= 0, 'config ควรมี scheduleHour');

  // run → 201 + สร้าง 2 ไฟล์ (db json + uploads zip)
  const run = await api.backups.run(token);
  assert.equal(run.status, 201, `run backup: ${JSON.stringify(run.json)}`);
  const files = (run.json?.data ?? []).map((f) => f.name);
  const dbFile = files.find((f) => f.startsWith('db-'));
  const upFile = files.find((f) => f.startsWith('uploads-'));
  assert.ok(dbFile, 'ควรมี db-*.json');
  assert.ok(upFile, 'ควรมี uploads-*.zip');

  // download → 200 + attachment
  const dl = await api.backups.download(token, dbFile);
  assert.equal(dl.status, 200, 'download ควร 200');
  assert.match(dl.headers.get('content-disposition') ?? '', /attachment/, 'ควรเป็น attachment');

  // path traversal → 404
  const trav = await api.backups.download(token, '..%2F..%2F.env');
  assert.equal(trav.status, 404, 'path traversal ควร 404');

  // ลบ 2 ไฟล์ที่สร้าง
  for (const f of files) {
    const del = await api.backups.remove(token, f);
    assert.equal(del.status, 200, `delete ${f} ควร 200`);
  }
  const after = await api.backups.list(token);
  assert.ok(!(after.json?.data ?? []).some((b) => files.includes(b.name)), 'ไฟล์ที่ลบไม่ควรอยู่ใน list');
});

test('10. Media Expiration + Embargo — จอไม่ได้รับ media ที่หมดอายุ/ยังไม่ถึงวันเปิดตัว', async () => {
  // สร้าง media เทส 3 ตัว: ปกติ / expired / embargo
  const now = Date.now();
  const normId = tid('med-norm');
  const expId = tid('med-exp');
  const embId = tid('med-emb');
  for (const [id, extra] of [
    [normId, {}],
    [expId, { expiresAt: new Date(now - 86400000).toISOString() }], // หมดอายุเมื่อวาน
    [embId, { releaseDate: new Date(now + 7 * 86400000).toISOString() }], // เปิดตัวสัปดาห์หน้า
  ]) {
    const r = await raw('POST', '/media', {
      token,
      body: {
        id, title: '[TEST] media-lifecycle', type: 'image',
        url: '/media/sample/campus-1.png', duration: 10, sizeMb: 0.1,
        tags: [], thumbnailUrl: '/media/sample/campus-1.png',
        ...extra,
      },
    });
    assert.equal(r.status, 201, `create ${id}: ${JSON.stringify(r.json)}`);
  }

  // สร้าง display token + ดึง /api/display/:id/data
  const gt = await api.display.generateToken(token, testScreenId);
  const dtoken = gt.json?.displayToken;
  assert.ok(dtoken, 'ควรได้ displayToken');
  const dd = await api.display.data(testScreenId, dtoken);
  assert.equal(dd.status, 200, `display data: ${JSON.stringify(dd.json)}`);
  const ids = (dd.json?.mediaItems ?? []).map((m) => m.id);

  assert.ok(ids.includes(normId), `จอควรเห็น media ปกติ (${normId})`);
  assert.ok(!ids.includes(expId), `จอไม่ควรเห็น media ที่หมดอายุแล้ว (${expId})`);
  assert.ok(!ids.includes(embId), `จอไม่ควรเห็น media ที่ยังไม่ถึงวันเปิดตัว (${embId})`);

  // cleanup
  for (const id of [normId, expId, embId]) {
    await raw('DELETE', `/media/${id}`, { token });
  }
});

test('11. Tag-Based Auto-Match — จอที่มี tags ได้ content ตรงกลุ่มอัตโนมัติ', async () => {
  // สร้างจอเทสที่มี tags แต่ไม่ได้ตั้ง playlist/layout
  const scId = tid('scr-tag');
  const pairing = `TP${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const createdSc = await api.screens.create(token, {
    id: scId, pairingCode: pairing,
    name: '[TEST] Tag Auto-Match', group: 'Dining',
    location: 'Test bench', orientation: 'landscape',
    tags: ['cafeteria', 'menu'],
  });
  assert.equal(createdSc.status, 201, `create screen: ${JSON.stringify(createdSc.json)}`);

  // display data ควร tag_match กับ playlist ที่มี tag cafeteria/menu
  const gt = await api.display.generateToken(token, scId);
  const dtoken = gt.json?.displayToken;
  assert.ok(dtoken, 'ควรได้ displayToken');
  const dd = await api.display.data(scId, dtoken);
  assert.equal(dd.status, 200, `display data: ${JSON.stringify(dd.json)}`);
  assert.equal(dd.json?.contentSource, 'tag_match', 'ควรเป็น tag_match');

  const pl = (dd.json?.playlists ?? []).find((p) => p.id === dd.json?.effectivePlaylistId);
  assert.ok(pl, 'ควรได้ playlist ที่ match');
  const plTags = (pl.tags ?? []).map((t) => t.toLowerCase());
  assert.ok(plTags.includes('cafeteria') || plTags.includes('menu'), `playlist tags ควรตรงกับจอ: ${plTags}`);

  // จอที่ไม่มี tags → ไม่ tag_match
  const plainSc = tid('scr-plain');
  const createdPlain = await api.screens.create(token, {
    id: plainSc,    pairingCode: 'TP' + Date.now().toString(36).slice(-6).toUpperCase() + 'B',
    name: '[TEST] Plain Screen', group: 'Other',
    location: 'Test', orientation: 'landscape',
  });
  assert.equal(createdPlain.status, 201);
  const gt2 = await api.display.generateToken(token, plainSc);
  const dd2 = await api.display.data(plainSc, gt2.json?.displayToken);
  assert.notEqual(dd2.json?.contentSource, 'tag_match', 'จอที่ไม่มี tags ไม่ควร tag_match');

  // cleanup
  await api.screens.remove(token, scId);
  await api.screens.remove(token, plainSc);
});

test('12. Content Approval — content ยังไม่ approved ต้องไม่ขึ้นจอ + approve แล้วขึ้นทันที', async () => {
  const token = await loginAdmin();

  // จอที่มี tags → tag_match กับ content ที่ approved เท่านั้น
  const scId = tid('scr-appr');
  const pairing = 'TP' + Date.now().toString(36).slice(-6).toUpperCase() + 'D';
  const createdSc = await api.screens.create(token, {
    id: scId, pairingCode: pairing,
    name: '[TEST] Approval Screen', group: 'Dining',
    location: 'Test', orientation: 'landscape',
    tags: ['cafeteria', 'menu'],
  });
  assert.equal(createdSc.status, 201, `create screen: ${JSON.stringify(createdSc.json)}`);

  // สร้าง playlist + layout ใหม่ → ต้องถูกบังคับเป็น pending (แม้ส่ง approvalStatus: approved)
  const plId = tid('pl-appr');
  const layId = tid('lay-appr');
  const pl = await api.playlists.create(token, {
    id: plId, name: '[TEST] Pending Playlist', description: 'test',
    tags: ['cafeteria', 'menu'],
    items: [{ mediaId: 'med-003', duration: 15, order: 1 }],
  });
  assert.equal(pl.status, 201, `create playlist: ${JSON.stringify(pl.json)}`);
  assert.equal(pl.json?.approvalStatus, 'pending', 'playlist ใหม่ควรเป็น pending');

  const lay = await api.layouts.create(token, {
    id: layId, name: '[TEST] Pending Layout', orientation: 'landscape',
    tags: ['cafeteria', 'menu'], approvalStatus: 'approved',
    zones: [{ id: `${layId}-z1`, name: 'Main', x: '0', y: '0', width: '100', height: '100', zIndex: 1 }],
  });
  assert.equal(lay.status, 201, `create layout: ${JSON.stringify(lay.json)}`);
  assert.equal(lay.json?.approvalStatus, 'pending', 'layout ใหม่ควรเป็น pending (ห้าม client ส่ง approved เอง)');

  // display data — pending content ต้องไม่ปรากฏ
  const gt = await api.display.generateToken(token, scId);
  const dd = await api.display.data(scId, gt.json?.displayToken);
  assert.equal(dd.status, 200, `display data: ${JSON.stringify(dd.json)}`);
  const plIds = (dd.json?.playlists ?? []).map((p) => p.id);
  assert.ok(!plIds.includes(plId), `pending playlist ต้องไม่ถูกส่งให้จอ (มี: ${plIds})`);
  assert.notEqual(dd.json?.layout?.id, layId, 'pending layout ต้องไม่ถูกส่งให้จอ');

  // approve ทั้งคู่ → ปรากฏทันที + tag_match ใช้ของใหม่
  const ap = await api.playlists.approve(token, plId, 'approved');
  assert.equal(ap.status, 200, `approve playlist: ${JSON.stringify(ap.json)}`);
  const al = await api.layouts.approve(token, layId, 'approved');
  assert.equal(al.status, 200, `approve layout: ${JSON.stringify(al.json)}`);

  const dd2 = await api.display.data(scId, (await api.display.generateToken(token, scId)).json?.displayToken);
  const plIds2 = (dd2.json?.playlists ?? []).map((p) => p.id);
  assert.ok(plIds2.includes(plId), 'approved playlist ควรปรากฏใน playlists ของจอ');
  assert.equal(dd2.json?.effectiveLayoutId ?? dd2.json?.layout?.id, layId, 'approved layout ใหม่ควรถูกใช้ใน tag_match');
  assert.equal(dd2.json?.effectivePlaylistId, plId, 'approved playlist ใหม่ควรถูกใช้ใน tag_match');

  // resolve ต้องคืน tag_match + playlist/layout ด้วย (TV Player ใช้ตัวนี้แทน currentPlaylistId)
  const resolve = await api.schedules.resolve(token, scId);
  assert.equal(resolve.json?.source, 'tag_match', 'resolve ควรเห็น tag_match');
  assert.equal(resolve.json?.playlistId, plId, 'resolve ควรคืน playlistId ที่ approved');
  assert.equal(resolve.json?.layoutId, layId, 'resolve ควรคืน layoutId ที่ approved');

  // cleanup
  await api.screens.remove(token, scId);
  await api.playlists.remove(token, plId);
  await api.layouts.remove(token, layId);
});

// ═══════════════════════════════════════════════════════════════
// 13) Emergency — trigger/clear ผ่าน REST → WS broadcast → จอสถานะ
//     emergency → กลับ online (กัน regression วงจร overlay แดงบน player)
// ═══════════════════════════════════════════════════════════════
test('13. Emergency — REST trigger/clear → WS broadcast → จอ emergency → กลับ online', async () => {
  const title = '[TEST] Emergency Integration';
  const message = 'Automated regression test — please ignore.';

  // WS client: 1) admin (ได้ยิน broadcast) 2) anonymous (player — รับอย่างเดียว)
  const adminWs = await openWs(token);
  const anonWs = await openWs(null);
  try {
    // รอทั้งคู่เชื่อม (INIT_CONNECTED)
    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'admin WS ควรเชื่อม');
    assert.ok(await waitFor(() => anonWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'anon WS ควรเชื่อม');

    // ⚠️ Security: anonymous (player) ส่ง EMERGENCY_TRIGGERED ปลอม → hub ต้องไม่ relay ต่อ
    const before = adminWs.messages.length;
    anonWs.ws.send(JSON.stringify({ type: 'EMERGENCY_TRIGGERED', payload: { id: 'emg-fake' } }));
    assert.ok(!await waitFor(() => adminWs.messages.slice(before).some((m) => m.type === 'EMERGENCY_TRIGGERED'), 800),
      'anonymous relay ปลอมต้องถูกบล็อก (receive-only)');

    // trigger ผ่าน REST → 200 + alert active
    const tr = await api.emergency.trigger(token, {
      title, message, type: 'custom', severity: 'critical',
      targetScreenIds: [testScreenId],
    });
    assert.equal(tr.status, 200, `trigger: ${JSON.stringify(tr.json)}`);
    const alert = tr.json?.alert;
    assert.ok(alert?.id, 'ควรได้ alert id');
    assert.equal(alert.isActive, true, 'alert ควร active');

    // WS: admin ได้รับ EMERGENCY_TRIGGERED พร้อม payload ครบ
    // (PlayerApp ใช้ payload นี้ทำ overlay แดง + EmergencyBanner แสดง banner)
    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'EMERGENCY_TRIGGERED' && m.payload?.id === alert.id)),
      'ควรได้รับ EMERGENCY_TRIGGERED ผ่าน WS');
    const trig = adminWs.messages.find((m) => m.type === 'EMERGENCY_TRIGGERED' && m.payload?.id === alert.id);
    assert.equal(trig.payload.title, title, 'WS payload ควรมี title');
    assert.equal(trig.payload.message, message, 'WS payload ควรมี message');
    assert.equal(trig.payload.severity, 'critical', 'severity ควรเป็น critical');
    assert.deepEqual(trig.payload.targetScreenIds, [testScreenId], 'target ควรเป็นจอเทสเท่านั้น');

    // จอเทส → สถานะ emergency + ชี้ alert
    const sc = await raw('GET', `/screens/${testScreenId}`, { token });
    assert.equal(sc.status, 200, 'GET screen ควร 200');
    assert.equal(sc.json?.status, 'emergency', 'จอควรเป็น emergency');
    assert.equal(sc.json?.activeEmergencyId, alert.id, 'จอควรชี้ alert id');

    // จออื่นต้องไม่โดน (target เฉพาะจอเทส)
    const others = await api.screens.list(token);
    const touched = (others.json?.data ?? []).find((s) => s.status === 'emergency' && s.id !== testScreenId);
    assert.ok(!touched, `จออื่นต้องไม่เป็น emergency (เจอ: ${touched?.id})`);

    // Display data (kiosk catch-up): จอเป้าหมายได้ emergency ใน payload, จออื่นไม่ได้
    const ddTarget = await api.display.data(testScreenId, displayToken);
    assert.equal(ddTarget.json?.emergency?.id, alert.id, 'display data ของจอเป้าหมายควรมี emergency (kiosk ขึ้น overlay)');
    const otherId = tid('scr-emg-other');
    const otherPair = 'TQ' + Date.now().toString(36).slice(-6).toUpperCase() + 'E';
    await api.screens.create(token, {
      id: otherId, pairingCode: otherPair, name: '[TEST] Emergency Other', group: '', location: '',
    });
    try {
      const otherTok = (await api.display.generateToken(token, otherId)).json?.displayToken;
      assert.ok(otherTok, 'ควรได้ token จออื่น');
      const ddOther = await api.display.data(otherId, otherTok);
      assert.ok(!ddOther.json?.emergency, 'display data ของจออื่นไม่ควรมี emergency');
      assert.notEqual(ddOther.json?.screen?.status, 'emergency', 'จออื่นไม่ควรเป็น emergency');
    } finally {
      await api.screens.remove(token, otherId);
    }

    // clear → 200
    const cl = await api.emergency.clear(token, { alertId: alert.id });
    assert.equal(cl.status, 200, `clear: ${JSON.stringify(cl.json)}`);
    assert.equal(cl.json?.alertId, alert.id, 'clear ควรคืน alertId');

    // WS: admin ได้รับ EMERGENCY_CLEARED
    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'EMERGENCY_CLEARED' && m.payload?.alertId === alert.id)),
      'ควรได้รับ EMERGENCY_CLEARED ผ่าน WS');

    // จอกลับ online + activeEmergencyId เคลียร์ (ส่ง heartbeat สดกัน monitor ฟลัค)
    await api.telemetry.heartbeat(displayToken, { screenId: testScreenId, status: 'online', storageUsageMb: 0, uptimeSeconds: 1 });
    const sc2 = await raw('GET', `/screens/${testScreenId}`, { token });
    assert.equal(sc2.json?.status, 'online', 'จอควรกลับ online');
    assert.equal(sc2.json?.activeEmergencyId, null, 'activeEmergencyId ควรเคลียร์');

    // หลัง clear → display data ไม่มี emergency อีก
    const ddAfter = await api.display.data(testScreenId, displayToken);
    assert.equal(ddAfter.json?.emergency, null, 'หลัง clear display data ไม่ควรมี emergency');

    // audit บันทึก emergency_trigger + emergency_clear
    const audit = await api.audit.logs(token, { resource: 'emergency', limit: 20 });
    const acts = (audit.json?.data ?? []).map((l) => l.action);
    assert.ok(acts.includes('emergency_trigger'), 'audit ควรมี emergency_trigger');
    assert.ok(acts.includes('emergency_clear'), 'audit ควรมี emergency_clear');
  } finally {
    adminWs.ws.close();
    anonWs.ws.close();
  }
});

// ═══════════════════════════════════════════════════════════════
// 14) Quick Post — REST POST → WS broadcast QUICK_POST → payload ครบ
//     (targetScreenIds — player/kiosk ฟิลเตอร์ overlay ตามเป้าหมาย)
// ═══════════════════════════════════════════════════════════════
test('14. Quick Post — POST → WS broadcast → targetScreenIds + anonymous relay ถูกบล็อก', async () => {
  const adminWs = await openWs(token);
  const anonWs = await openWs(null);
  try {
    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'admin WS ควรเชื่อม');
    assert.ok(await waitFor(() => anonWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'anon WS ควรเชื่อม');

    // ⚠️ Security: anonymous ส่ง QUICK_POST ปลอม → hub ต้องไม่ relay ต่อ
    const before = adminWs.messages.length;
    anonWs.ws.send(JSON.stringify({ type: 'QUICK_POST', payload: { message: 'fake' } }));
    assert.ok(!await waitFor(() => adminWs.messages.slice(before).some((m) => m.type === 'QUICK_POST'), 800),
      'anonymous relay ปลอมต้องถูกบล็อก (receive-only)');

    // POST /api/quick-post เจาะจงจอเทส → WS broadcast พร้อม targetScreenIds
    const msg = '[TEST] Quick Post integration ' + Date.now().toString(36);
    const r = await raw('POST', '/quick-post', {
      token,
      body: { message: msg, style: 'warning', targetScreenIds: [testScreenId], duration: 5 },
    });
    assert.equal(r.status, 200, `quick-post: ${JSON.stringify(r.json)}`);
    const post = r.json?.post;
    assert.ok(post?.id, 'ควรได้ post id');
    assert.deepEqual(post.targetScreenIds, [testScreenId], 'server ควรส่ง targetScreenIds ไปกับ payload');

    // WS: admin ได้รับ QUICK_POST พร้อม payload ครบ (player ใช้ตัวนี้ filter ตามจอ)
    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'QUICK_POST' && m.payload?.id === post.id)),
      'ควรได้รับ QUICK_POST ผ่าน WS');
    const qp = adminWs.messages.find((m) => m.type === 'QUICK_POST' && m.payload?.id === post.id);
    assert.equal(qp.payload.message, msg, 'payload ควรมี message');
    assert.equal(qp.payload.style, 'warning', 'payload ควรมี style');
    assert.deepEqual(qp.payload.targetScreenIds, [testScreenId], 'payload ควรมี targetScreenIds');
    assert.ok(qp.payload.duration >= 1, 'payload ควรมี duration');

    // audit บันทึก quick_post
    const audit = await api.audit.logs(token, { action: 'quick_post', limit: 10 });
    assert.ok((audit.json?.data ?? []).some((l) => l.resourceId === post.id), 'audit ควรมี quick_post ของเรา');
  } finally {
    adminWs.ws.close();
    anonWs.ws.close();
  }
});

// ═══════════════════════════════════════════════════════════════
// 15) Webhook Trigger — X-Webhook-Token (ระบบภายนอกเรียก /api/trigger)
// ต้องตั้ง WEBHOOK_TOKEN ใน .env (dev ตั้งค่าเดียวกับ prod เพื่อพฤติกรรมตรงกัน)
// ═══════════════════════════════════════════════════════════════
test('15. Webhook Trigger — X-Webhook-Token ต้องถูกต้อง (401/401/200)', async () => {
  const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || '';
  if (!WEBHOOK_TOKEN) {
    console.warn('⚠️ WEBHOOK_TOKEN ไม่ได้ตั้งใน .env — ข้ามเทสนี้ (dev ควรตั้งค่าเดียวกับ prod)');
    return;
  }
  const body = { action: 'refresh', target: { all: true } };

  // ไม่มี token → 401 (token ถูกตั้งใน dev env → ไม่ fallback เป็น dev-open)
  const noTok = await raw('POST', '/trigger', { body });
  assert.equal(noTok.status, 401, 'POST /api/trigger ไม่มี X-Webhook-Token ควร 401');

  // token ผิด → 401
  const wrong = await raw('POST', '/trigger', { body, headers: { 'X-Webhook-Token': 'wrong-token-xyz' } });
  assert.equal(wrong.status, 401, 'X-Webhook-Token ผิดควร 401');

  // token ถูก + refresh → 200 + targetScreens
  const ok = await raw('POST', '/trigger', { body, headers: { 'X-Webhook-Token': WEBHOOK_TOKEN } });
  assert.equal(ok.status, 200, `token ถูกควร 200: ${JSON.stringify(ok.json)}`);
  assert.ok(ok.json?.success === true, 'ควร success:true');
  assert.ok(Number.isInteger(ok.json?.targetScreens), 'ควรมี targetScreens (จำนวนจอ)');

  // token ถูก แต่ body ไม่ครบ (ไม่มี action) → 400
  const bad = await raw('POST', '/trigger', { body: { target: { all: true } }, headers: { 'X-Webhook-Token': WEBHOOK_TOKEN } });
  assert.equal(bad.status, 400, 'ไม่มี action ควร 400');

  // by-tags — token ถูก + tags → 200 (หาไม่เจอ = targetScreens 0 ก็ยัง 200)
  const byTags = await raw('POST', '/trigger/by-tags', {
    body: { tags: ['no-such-tag-xyz'], action: 'refresh' },
    headers: { 'X-Webhook-Token': WEBHOOK_TOKEN },
  });
  assert.equal(byTags.status, 200, `by-tags token ถูกควร 200: ${JSON.stringify(byTags.json)}`);
});

// ═══════════════════════════════════════════════════════════════
// 16) Live Screen Preview — จอส่ง SCREEN_STATE → server เก็บ + broadcast
//     SCREEN_STATE_UPDATED ให้ Admin เห็นสิ่งที่จอแสดงอยู่แบบเรียลไทม์
//     + REST catch-up /api/monitoring/live + กันสวมรอย screenId
// ═══════════════════════════════════════════════════════════════
test('16. Live Screen Preview — SCREEN_STATE → broadcast + live endpoint + สวมรอยถูกบล็อก', async () => {
  const adminWs = await openWs(token);
  const displayWs = await openWs(displayToken);
  const anonWs = await openWs(null);
  try {
    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'admin WS ควรเชื่อม');
    assert.ok(await waitFor(() => displayWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'display WS ควรเชื่อม');
    assert.ok(await waitFor(() => anonWs.messages.some((m) => m.type === 'INIT_CONNECTED')), 'anon WS ควรเชื่อม');

    // ⚠️ anonymous (ไม่มี token) ส่ง SCREEN_STATE → ต้องไม่ถูก broadcast
    const before = adminWs.messages.length;
    anonWs.ws.send(JSON.stringify({ type: 'SCREEN_STATE', payload: { screenId: testScreenId, zones: [] } }));
    assert.ok(!await waitFor(() => adminWs.messages.slice(before).some((m) => m.type === 'SCREEN_STATE_UPDATED'), 800),
      'anonymous ส่ง SCREEN_STATE ต้องถูกบล็อก (ไม่ใช่ display token)');

    // ⚠️ display token ของจอเทส แต่สวม screenId จออื่น → ต้องไม่ถูก broadcast
    const before2 = adminWs.messages.length;
    displayWs.ws.send(JSON.stringify({ type: 'SCREEN_STATE', payload: { screenId: 'scr-not-mine', zones: [] } }));
    assert.ok(!await waitFor(() => adminWs.messages.slice(before2).some((m) => m.type === 'SCREEN_STATE_UPDATED' && m.payload?.screenId === 'scr-not-mine'), 800),
      'สวมรอย screenId ของจออื่นต้องถูกบล็อก');

    // จอเทสส่ง state จริง → admin ได้รับ SCREEN_STATE_UPDATED + payload ครบ
    const stPayload = {
      screenId: testScreenId,
      screenName: '[TEST] REQ-009 Integration',
      layout: { id: layoutId, name: 'Test Layout', orientation: 'landscape' },
      contentSource: 'default',
      priorityLevel: 'default',
      effectivePlaylistId: null,
      zones: [{
        zoneId: 'z1', zoneName: 'Main', x: 0, y: 0, width: 100, height: 100,
        mediaType: 'image', mediaId, mediaTitle: 'Test Media', mediaUrl: null,
        itemDuration: 15, startedAt: new Date().toISOString(),
      }],
      updatedAt: new Date().toISOString(),
    };
    displayWs.ws.send(JSON.stringify({ type: 'SCREEN_STATE', payload: stPayload }));

    assert.ok(await waitFor(() => adminWs.messages.some((m) => m.type === 'SCREEN_STATE_UPDATED' && m.payload?.screenId === testScreenId)),
      'admin ควรได้รับ SCREEN_STATE_UPDATED');
    const upd = adminWs.messages.find((m) => m.type === 'SCREEN_STATE_UPDATED' && m.payload?.screenId === testScreenId);
    assert.equal(upd.payload.screenName, stPayload.screenName, 'payload ควรมี screenName');
    assert.equal(upd.payload.zones?.[0]?.mediaTitle, 'Test Media', 'payload ควรมีสื่อในโซน');
    assert.equal(upd.payload.priorityLevel, 'default', 'payload ควรมี priorityLevel');
    assert.equal(upd.payload.online, true, 'state ควร online:true');
    assert.ok(upd.payload.receivedAt, 'ควรมี receivedAt');

    // REST catch-up: GET /api/monitoring/live มี state ของจอเทส
    const live = await raw('GET', '/monitoring/live', { token });
    assert.equal(live.status, 200, 'live endpoint ควร 200');
    const st = (live.json?.states || []).find((x) => x.screenId === testScreenId);
    assert.ok(st, 'live ควรมี state ของจอเทส');
    assert.equal(st.zones?.[0]?.mediaTitle, 'Test Media', 'live ควรมีสื่อครบ');

    // ไม่มี token → 401
    const noTok = await raw('GET', '/monitoring/live');
    assert.equal(noTok.status, 401, 'live endpoint ไม่มี token ควร 401');
  } finally {
    adminWs.ws.close();
    displayWs.ws.close();
    anonWs.ws.close();
  }
});

// ═══════════════════════════════════════════════════════════════
// 17) Scheduler Restore Points (0.4.29) — API /api/scheduler-snapshots
//     CRUD + auth (401) + body ผิด 400 + audit บันทึก create/delete
// ═══════════════════════════════════════════════════════════════
test('17. Scheduler Restore Points — CRUD /api/scheduler-snapshots + auth + audit', async () => {
  const snapId = tid('snap-test');
  const snapName = `[TEST] Snapshot ${Date.now().toString(36)}`;
  const snapData = {
    type: 'scheduler-backup', version: 1,
    schedules: [{ id: 'sch-001', name: '[TEST] Rule', startTime: '07:00', endTime: '19:00' }],
    playlists: [{ id: 'pl-001', name: '[TEST] Playlist', color: '#10b981' }],
  };
  try {
    // ไม่มี token → 401 (GET + POST + DELETE)
    assert.equal((await raw('GET', '/scheduler-snapshots')).status, 401, 'GET ไม่มี token ควร 401');
    assert.equal((await raw('POST', '/scheduler-snapshots', { body: { name: 'x', data: {} } })).status, 401, 'POST ไม่มี token ควร 401');
    assert.equal((await raw('DELETE', `/scheduler-snapshots/${snapId}`)).status, 401, 'DELETE ไม่มี token ควร 401');

    // body ผิด (ขาด data) → 400
    const badBody = await api.schedulerSnapshots.create(token, { name: snapName });
    assert.equal(badBody.status, 400, `ไม่มี data ควร 400: ${JSON.stringify(badBody.json)}`);

    // create → 201
    const cr = await api.schedulerSnapshots.create(token, { id: snapId, name: snapName, data: snapData });
    assert.equal(cr.status, 201, `create snapshot: ${JSON.stringify(cr.json)}`);
    assert.equal(cr.json?.id, snapId, 'ควรได้ id ตามที่ส่ง');

    // GET roundtrip — เจอ snapshot + data ครบ (jsonb roundtrip)
    const list = await api.schedulerSnapshots.list(token);
    assert.equal(list.status, 200, 'list ควร 200');
    assert.ok(Array.isArray(list.json?.data), 'ควรมี data[]');
    const row = (list.json?.data ?? []).find((s) => s.id === snapId);
    assert.ok(row, 'ควรเจอ snapshot ที่เพิ่งสร้าง');
    assert.equal(row.name, snapName, 'name ควรตรง');
    assert.equal(row.data?.schedules?.[0]?.id, 'sch-001', 'data.schedules ควรครบ (jsonb roundtrip)');
    assert.equal(row.data?.playlists?.[0]?.color, '#10b981', 'data.playlists ควรครบ');
    assert.ok(Number.isInteger(list.json?.total), 'ควรมี total');

    // audit — create ของ scheduler_snapshot ถูกบันทึก
    const audit = await api.audit.logs(token, { resource: 'scheduler_snapshot', limit: 20 });
    const acts = (audit.json?.data ?? []).map((l) => `${l.action}:${l.resourceId}`);
    assert.ok(acts.includes(`create:${snapId}`), `audit ควรมี create:${snapId} (มี: ${acts})`);

    // DELETE → 200 + หายจาก list + audit บันทึก delete
    const del = await api.schedulerSnapshots.remove(token, snapId);
    assert.equal(del.status, 200, `delete: ${JSON.stringify(del.json)}`);
    const list2 = await api.schedulerSnapshots.list(token);
    assert.ok(!(list2.json?.data ?? []).some((s) => s.id === snapId), 'snapshot ที่ลบไม่ควรอยู่ใน list');
    const audit2 = await api.audit.logs(token, { resource: 'scheduler_snapshot', limit: 20 });
    assert.ok((audit2.json?.data ?? []).some((l) => l.action === 'delete' && l.resourceId === snapId), 'audit ควรมี delete');

    // DELETE id ที่ไม่มี → 200 (idempotent)
    const delNf = await api.schedulerSnapshots.remove(token, tid('snap-nope'));
    assert.equal(delNf.status, 200, 'ลบ id ที่ไม่มีควร 200 (idempotent)');
  } finally {
    // เคลียร์ให้เรียบร้อย (กันค้างใน DB ถ้าเทสกลางหลุด)
    await api.schedulerSnapshots.remove(token, snapId).catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════════
// 18) Screens CRUD regression — payload เดียวกับ UI (fix 500)
//     UI ส่ง bufferCachedItemsCount (DB ใช้ชื่อ bufferCachedItems) +
//     lastHeartbeat เป็น ISO string → เคย 500 (column ไม่มี /
//     value.toISOString is not a function) → ต้อง 201/200 + map ถูก
//     กันบั๊ก "เพิ่มจอใหม่ ขึ้น UI แต่ไม่บันทึก" กลับมา
// ═══════════════════════════════════════════════════════════════
test('18. Screens UI payload — POST/PATCH ด้วย bufferCachedItemsCount + lastHeartbeat ISO ต้องไม่ 500', async () => {
  const scId = tid('scr-ui');
  const pairing = `UP${Date.now().toString(36).slice(-6).toUpperCase()}`;
  const hbISO = new Date(Date.now() - 60_000).toISOString(); // ISO string อย่าง UI ส่ง

  try {
    // ── POST: payload เหมือน form "เพิ่มจอใหม่" ใน Admin UI ──
    const create = await api.screens.create(token, {
      id: scId,                        // id เจาะจง เพื่อค้นหา/cleanup ที่แน่นอน (UI ไม่ส่ง → server สร้างเอง)
      name: '[TEST] UI Payload Screen',
      group: '[TEST] Integration',
      location: 'Test bench',
      orientation: 'landscape',
      pairingCode: pairing,
      bufferCachedItemsCount: 0,      // ← UI field (ไม่ใช่คอลัมน์จริง)
      lastHeartbeat: hbISO,            // ← ISO string (คอลัมน์ต้องการ Date)
    });
    assert.equal(create.status, 201, `POST ควร 201 (regression: เคย 500): ${JSON.stringify(create.json)}`);

    // bufferCachedItemsCount ต้องถูก map ไป bufferCachedItems (ไม่เหลือ field ปลอมใน DB)
    assert.equal(create.json?.bufferCachedItems, 0, 'bufferCachedItems ควร = bufferCachedItemsCount ที่ส่ง (0)');
    assert.equal(create.json?.bufferCachedItemsCount, undefined, 'bufferCachedItemsCount ต้องไม่ถูกบันทึก (field ปลอม)');

    // lastHeartbeat เก็บเป็น Date → serialized กลับเป็น ISO string ที่ถูกต้อง
    assert.equal(create.json?.lastHeartbeat, hbISO, 'lastHeartbeat ควร roundtrip ค่าเดิม (ISO ถูกแปลงเป็น Date ตอนเก็บ)');

    // ── GET roundtrip: ค่าครบ + อยู่ใน DB จริง ──
    const get = await api.screens.list(token);
    const row = (get.json?.data ?? []).find((s) => s.id === scId);
    assert.ok(row, 'ควรเจอจอที่เพิ่งสร้างใน list');
    assert.equal(row.bufferCachedItems, 0, 'GET ควรเห็น bufferCachedItems=0');
    assert.equal(row.lastHeartbeat, hbISO, 'GET ควรเห็น lastHeartbeat เดิม');

    // ── PATCH: payload เดียวกับ form แก้ไขจอ (rename + ค่าใหม่) ──
    const newISO = new Date().toISOString();
    const patch = await api.screens.update(token, scId, {
      name: '[TEST] UI Payload Screen (renamed)',
      group: '[TEST] Integration',
      location: 'Moved',
      bufferCachedItemsCount: 7,      // ← UI ส่ง field เดิมตอนแก้ด้วย
      lastHeartbeat: newISO,           // ← UI ส่ง heartbeat ใหม่เป็น ISO
    });
    assert.equal(patch.status, 200, `PATCH ควร 200 (regression: เคย 500): ${JSON.stringify(patch.json)}`);
    assert.equal(patch.json?.name, '[TEST] UI Payload Screen (renamed)', 'name ควรอัปเดต');
    assert.equal(patch.json?.location, 'Moved', 'location ควรอัปเดต');
    assert.equal(patch.json?.bufferCachedItems, 7, 'PATCH bufferCachedItems ควร = 7 (map bufferCachedItemsCount)');
    assert.equal(patch.json?.bufferCachedItemsCount, undefined, 'PATCH ก็ต้องไม่เก็บ field ปลอม');
    assert.equal(patch.json?.lastHeartbeat, newISO, 'PATCH lastHeartbeat ควร roundtrip ค่าใหม่');

    // ── auth: ไม่มี token → 401 (guard ยังทำงาน) ──
    assert.equal((await raw('POST', '/screens', { body: { name: 'x', pairingCode: 'XX' } })).status, 401, 'POST ไม่มี token ควร 401');
    assert.equal((await raw('PATCH', `/screens/${scId}`, { body: { name: 'x' } })).status, 401, 'PATCH ไม่มี token ควร 401');
  } finally {
    await api.screens.remove(token, scId).catch(() => {});
  }
});

