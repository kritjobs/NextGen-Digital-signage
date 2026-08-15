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
  const s = await api.screens.create(token, {
    id: testScreenId, pairingCode: testScreenPairing,
    name: '[TEST] REQ-009 Integration', group: 'HQ Reception',
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
    name: '[TEST] Idle Screen', group: 'R&D Labs', location: '',
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
// 9) REQ-007 — Backup (สร้างไฟล์จริงแล้วลบให้)
// ═══════════════════════════════════════════════════════════════
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
