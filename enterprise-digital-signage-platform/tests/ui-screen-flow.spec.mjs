// ═══════════════════════════════════════════════════════════════
// UI Screen Flow — regression สำหรับ "เพิ่มจอใหม่" ทั้งวงจรฝั่ง UI
// Zustand store (addScreen) → API (screenApi.create) → server → เมทริกซ์ (store.screens)
//
// กันบั๊ก "optimistic UI หลอกตา": จอขึ้นในเมทริกซ์ทันที แต่ POST 500
// → จอ phantom ค้าง (DB ไม่มี) เพราะ store เคย .catch(console.error) เงียบๆ
//
// 3 ชั้น:
//   1. success path (mock API) — จออยู่ + create ถูกเรียกด้วย payload ของ UI
//   2. failure path (mock API) — optimistic entry ถูก ROLLBACK (หัวใจของฟิกซ์)
//   3. full loop (dev server จริง) — addScreen → POST → refreshScreens → ขึ้นเมทริกซ์
//      → deleteScreen → หายจาก server (เหมือน integration test แต่ผ่าน store จริง)
//
// รัน:  npm run test:ui          (ต้องมี dev server + TEST_ADMIN_PASSWORD สำหรับเทสต์ 3)
// ใช้ tsx loader เพราะ import store จาก src/*.ts
// ═══════════════════════════════════════════════════════════════
import 'dotenv/config';
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

// ─── localStorage shim — ต้องตั้งก่อน import store/api (api.ts อ่านตอน module scope) ───
const ls = new Map();
globalThis.localStorage = {
  getItem: (k) => (ls.has(k) ? ls.get(k) : null),
  setItem: (k, v) => ls.set(k, String(v)),
  removeItem: (k) => ls.delete(k),
  clear: () => ls.clear(),
};

// dynamic import — หลัง shim แล้วเท่านั้น
const { useSignageStore } = await import('../src/store/useSignageStore.ts');
const { screenApi, setTokens } = await import('../src/services/api.ts');

// api.ts ใช้ BASE_URL='/api' แล้ว (request('/screens') → '/api/screens') — shim ต้องต่อแค่ origin
// ไม่งั้นจะได้ /api/api/screens → 404
const BASE = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3100/api').replace(/\/api$/, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(cond, timeoutMs = 5000) {
  // ต้อง await ถ้า cond เป็น async (Promise เป็น truthy เสมอ → ไม่งั้นผ่านทันทีโดยไม่รอ)
  const start = Date.now();
  let ok = false;
  while (Date.now() - start < timeoutMs) {
    const r = cond();
    ok = r instanceof Promise ? await r : r;
    if (ok) return true;
    await sleep(50);
  }
  const r = cond();
  return r instanceof Promise ? await r : r;
}

// payload เหมือน handleCreateScreen ใน ScreensManager.tsx ทุกประการ
function uiScreenPayload(name = '[TEST] UI Flow Screen') {
  return {
    id: 'scr-' + Date.now(),
    pairingCode: 'SCR-' + Math.floor(1000 + Math.random() * 9000),
    name,
    group: '[TEST] Integration',
    tags: [],
    location: 'UI store test',
    orientation: 'landscape',
    resolution: '1920x1080 (FHD)',
    status: 'offline',
    lastHeartbeat: new Date().toISOString(),
    ipAddress: '',
    macAddress: '',
    storageUsageMb: 0,
    storageTotalMb: 16000,
    bufferCachedItemsCount: 0,      // ← field ที่เคยพัง (500 → phantom)
    currentLayoutId: 'lay-split-3zone',
    currentPlaylistId: 'pl-corporate-main',
    volume: 80,
    isMuted: false,
    firmwareVersion: '',
    uptimeSeconds: 0,
  };
}

// ─── Setup ───────────────────────────────────────────────────
let realCreate, realUpdate, realDelete;
beforeEach(() => {
  // คืน action ตัวจริงก่อนทุกเทสต์ (กัน stub ของเทสต์ก่อนหน้าตกค้าง)
  if (!realCreate) realCreate = screenApi.create;
  if (!realUpdate) realUpdate = screenApi.update;
  if (!realDelete) realDelete = screenApi.delete;
  screenApi.create = realCreate;
  screenApi.update = realUpdate;
  screenApi.delete = realDelete;
  useSignageStore.setState({ screens: [] }); // reset state กันเทสต์ก่อนหน้า
});

after(() => {
  screenApi.create = realCreate; // คืน stub เสมอ (เผื่อสุดท้าย)
  screenApi.update = realUpdate;
  screenApi.delete = realDelete;
  useSignageStore.setState({ screens: [] });
});

// ═══════════════════════════════════════════════════════════════
// 1) Success path — create ผ่าน → จออยู่ใน store + ถูกเรียกด้วย payload UI
// ═══════════════════════════════════════════════════════════════
test('UI-1. addScreen สำเร็จ — จออยู่ใน store + create ถูกเรียกด้วย payload ของ UI', async () => {
  const screen = uiScreenPayload();
  let captured = null;
  screenApi.create = async (payload) => { captured = payload; return payload; };

  useSignageStore.getState().addScreen(screen);
  await waitFor(() => captured !== null);

  assert.ok(captured, 'screenApi.create ต้องถูกเรียก');
  assert.equal(captured.id, screen.id, 'create ต้องได้ id เดียวกับ optimistic');
  assert.equal(captured.bufferCachedItemsCount, 0, 'payload ต้องมี bufferCachedItemsCount (UI field)');
  assert.equal(typeof captured.lastHeartbeat, 'string', 'payload ต้องมี lastHeartbeat เป็น ISO string');
  assert.ok(captured.lastHeartbeat.includes('T'), 'lastHeartbeat ต้องเป็น ISO string');

  // หลัง success → optimistic entry ยังอยู่ (ไม่ถูก rollback)
  const inStore = useSignageStore.getState().screens.some((s) => s.id === screen.id);
  assert.ok(inStore, 'success → จอต้องยังอยู่ใน store (เมทริกซ์)');
});

// ═══════════════════════════════════════════════════════════════
// 2) Failure path — POST ล้ม → optimistic entry ต้องถูก ROLLBACK (กันหลอกตา)
// ═══════════════════════════════════════════════════════════════
test('UI-2. addScreen ล้มเหลว — จอ phantom ต้องถูกถอดออกจาก store (ไม่หลอกตา)', async () => {
  const screen = uiScreenPayload('[TEST] UI Flow Fail');
  screenApi.create = async () => { throw new Error('POST /api/screens → 500 (จำลอง)'); };

  useSignageStore.getState().addScreen(screen);

  // ทันทีหลัง add → ยังมี (optimistic)
  const optimistic = useSignageStore.getState().screens.some((s) => s.id === screen.id);
  assert.ok(optimistic, 'optimistic: จอขึ้นเมทริกซ์ทันที (ก่อนรู้ผล)');

  // รอ promise reject + rollback เสร็จ
  await waitFor(() => !useSignageStore.getState().screens.some((s) => s.id === screen.id));

  const inStore = useSignageStore.getState().screens.some((s) => s.id === screen.id);
  assert.ok(!inStore, 'FAIL: จอ phantom ต้องถูกถอดออก (rollback) — ห้ามค้างในเมทริกซ์');
});

// ═══════════════════════════════════════════════════════════════
// 4) updateScreen failure — ค่า optimistic ต้อง ROLLBACK กลับค่าเดิม (กัน "ค่าใหม่หลอกตา")
// ═══════════════════════════════════════════════════════════════
test('UI-4. updateScreen ล้มเหลว — ค่า optimistic ต้อง rollback กลับเป็นค่าเดิม', async () => {
  const screen = uiScreenPayload('[TEST] UI Update Fail');
  useSignageStore.setState({ screens: [screen] });

  // จำลอง PATCH ล้ม (เหมือน POST 500 เดิมที่เคยทำให้ addScreen หลอกตา)
  screenApi.update = async () => { throw new Error('PATCH /api/screens/:id → 500 (จำลอง)'); };

  useSignageStore.getState().updateScreen(screen.id, { name: '[TEST] UI Update Fail EDITED', volume: 42 });

  // optimistic: ค่าใหม่ขึ้นทันที (ก่อนรู้ผล)
  const optimistic = useSignageStore.getState().screens.find((s) => s.id === screen.id);
  assert.equal(optimistic.name, '[TEST] UI Update Fail EDITED', 'optimistic: ค่าใหม่ขึ้นทันที');
  assert.equal(optimistic.volume, 42, 'optimistic: volume ใหม่ขึ้นทันที');

  // รอ PATCH reject + rollback เสร็จ
  await waitFor(() => {
    const s = useSignageStore.getState().screens.find((x) => x.id === screen.id);
    return s && s.name === screen.name && s.volume === screen.volume;
  });

  const after = useSignageStore.getState().screens.find((s) => s.id === screen.id);
  assert.ok(after, 'จอต้องยังอยู่ใน store');
  assert.equal(after.name, screen.name, 'FAIL: ต้อง rollback ชื่อกลับค่าเดิม — ห้ามโชว์ค่าใหม่หลอกตา');
  assert.equal(after.volume, screen.volume, 'FAIL: ต้อง rollback volume กลับค่าเดิม');
});

// ═══════════════════════════════════════════════════════════════
// 5) deleteScreen failure — จอที่ลบ optimistic ต้อง RESTORE กลับ (กัน "หายหลอกตา")
// ═══════════════════════════════════════════════════════════════
test('UI-5. deleteScreen ล้มเหลว — จอที่ถูกลบ optimistic ต้องกลับมา', async () => {
  const screen = uiScreenPayload('[TEST] UI Delete Fail');
  useSignageStore.setState({ screens: [screen] });

  // จำลอง DELETE ล้ม
  screenApi.delete = async () => { throw new Error('DELETE /api/screens/:id → 500 (จำลอง)'); };

  useSignageStore.getState().deleteScreen(screen.id);

  // optimistic: จอหายจาก store ทันที (ก่อนรู้ผล)
  const optimistic = !useSignageStore.getState().screens.some((s) => s.id === screen.id);
  assert.ok(optimistic, 'optimistic: จอหายจาก store ทันที');

  // รอ DELETE reject + restore เสร็จ
  await waitFor(() => useSignageStore.getState().screens.some((s) => s.id === screen.id));

  const restored = useSignageStore.getState().screens.some((s) => s.id === screen.id);
  assert.ok(restored, 'FAIL: จอต้องกลับมา (restore) — ห้ามหายหลอกตา');
  const s = useSignageStore.getState().screens.find((x) => x.id === screen.id);
  assert.equal(s.name, screen.name, 'restore ต้องได้ค่าเดิมครบ');
});

// ═══════════════════════════════════════════════════════════════
// 6) Full loop — updateScreen → PATCH จริง → เมทริกซ์ได้ค่าใหม่ (ต้องมี dev server)
// ═══════════════════════════════════════════════════════════════
test('UI-6. full loop กับ dev server — updateScreen → PATCH 200 → refreshScreens โชว์ค่าใหม่ (ไม่ rollback)', async () => {
  const PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';
  if (!PASSWORD) {
    console.warn('⚠️ TEST_ADMIN_PASSWORD ไม่ได้ตั้งใน .env — ข้ามเทสต์นี้ (ต้อง login กับ dev server)');
    return;
  }

  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, opts) => realFetch(url.startsWith('/') ? BASE + url : url, opts);
  try {
    const lr = await realFetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@signage.local', password: PASSWORD }),
    });
    const lj = await lr.json();
    if (!lj.accessToken) throw new Error(`login failed: ${JSON.stringify(lj)}`);
    setTokens(lj.accessToken, lj.refreshToken || '');

    // setup: สร้างจอทดสอบผ่าน store (POST จริง)
    const screen = uiScreenPayload('[TEST] UI Update E2E');
    useSignageStore.getState().addScreen(screen);
    const created = await waitFor(async () => {
      const r = await realFetch(`${BASE}/api/screens`, { headers: { Authorization: `Bearer ${lj.accessToken}` } });
      if (!r.ok) return false;
      const j = await r.json();
      return (j.data ?? []).some((s) => s.id === screen.id);
    }, 6000);
    assert.ok(created, 'setup: server ต้องบันทึกจอทดสอบก่อน');

    // ── updateScreen ผ่าน store จริง → PATCH จริง ──
    const NEW_NAME = '[TEST] UI Update E2E ★EDITED';
    useSignageStore.getState().updateScreen(screen.id, { name: NEW_NAME, volume: 42 });
    const persisted = await waitFor(async () => {
      const r = await realFetch(`${BASE}/api/screens`, { headers: { Authorization: `Bearer ${lj.accessToken}` } });
      if (!r.ok) return false;
      const j = await r.json();
      const s = (j.data ?? []).find((x) => x.id === screen.id);
      return s && s.name === NEW_NAME && s.volume === 42;
    }, 6000);
    assert.ok(persisted, 'PATCH ต้องบันทึกค่าใหม่จริงบน server');

    // ── refreshScreens → เมทริกซ์ได้ค่าใหม่ (success → ไม่ rollback) ──
    await useSignageStore.getState().refreshScreens();
    const inMatrix = useSignageStore.getState().screens.find((s) => s.id === screen.id);
    assert.equal(inMatrix?.name, NEW_NAME, 'เมทริกซ์ต้องโชว์ค่าใหม่ (success path ไม่ rollback)');
    assert.equal(inMatrix?.volume, 42, 'เมทริกซ์ต้องได้ volume ใหม่');

    // ── cleanup: ลบจอทดสอบ ──
    useSignageStore.getState().deleteScreen(screen.id);
    const gone = await waitFor(async () => {
      const r = await realFetch(`${BASE}/api/screens`, { headers: { Authorization: `Bearer ${lj.accessToken}` } });
      if (!r.ok) return false;
      const j = await r.json();
      return !(j.data ?? []).some((s) => s.id === screen.id);
    }, 6000);
    assert.ok(gone, 'cleanup: จอทดสอบต้องหายจาก dev server');

    await useSignageStore.getState().refreshScreens();
    assert.ok(!useSignageStore.getState().screens.some((s) => s.id === screen.id), 'เมทริกซ์ต้องไม่มีจอที่ลบไปแล้ว');
  } finally {
    globalThis.fetch = realFetch;
  }
});

// ═══════════════════════════════════════════════════════════════
// 3) Full loop — store จริง → server จริง → เมทริกซ์ (ต้องมี dev server)
// ═══════════════════════════════════════════════════════════════
test('UI-3. full loop กับ dev server — addScreen → POST 201 → refreshScreens ขึ้นเมทริกซ์ → deleteScreen หาย', async () => {
  const PASSWORD = process.env.TEST_ADMIN_PASSWORD || '';
  if (!PASSWORD) {
    console.warn('⚠️ TEST_ADMIN_PASSWORD ไม่ได้ตั้งใน .env — ข้ามเทสต์นี้ (ต้อง login กับ dev server)');
    return;
  }

  // fetch shim: แปลง '/api/...' (BASE_URL ของ api.ts) → absolute (ต่อ origin เท่านั้น)
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, opts) => realFetch(url.startsWith('/') ? BASE + url : url, opts);
  try {
    // login → ฝาก token เข้า module (api.ts อ่านผ่าน setTokens)
    const lr = await realFetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@signage.local', password: PASSWORD }),
    });
    const lj = await lr.json();
    if (!lj.accessToken) throw new Error(`login failed: ${JSON.stringify(lj)}`);
    setTokens(lj.accessToken, lj.refreshToken || '');

    // ── addScreen ผ่าน store จริง ──
    const screen = uiScreenPayload('[TEST] UI Flow E2E');
    useSignageStore.getState().addScreen(screen);

    // รอ POST ไป server จริงเสร็จ (poll: จออยู่ใน GET /api/screens)
    const persisted = await waitFor(async () => {
      const r = await realFetch(`${BASE}/api/screens`, { headers: { Authorization: `Bearer ${lj.accessToken}` } });
      if (!r.ok) return false;
      const j = await r.json();
      return (j.data ?? []).some((s) => s.id === screen.id);
    }, 6000);
    assert.ok(persisted, 'server ต้องบันทึกจอที่ store ส่งไป (POST สำเร็จจริง ไม่ใช่แค่ optimistic)');

    // ── refreshScreens → เมทริกซ์สะท้อนความจริงจาก server ──
    await useSignageStore.getState().refreshScreens();
    const matrixHas = useSignageStore.getState().screens.some((s) => s.id === screen.id);
    assert.ok(matrixHas, 'refreshScreens หลัง POST → จอต้องปรากฏในเมทริกซ์ (store.screens จาก server)');

    // ── deleteScreen → server ต้องลบจริง ──
    useSignageStore.getState().deleteScreen(screen.id);
    const gone = await waitFor(async () => {
      const r = await realFetch(`${BASE}/api/screens`, { headers: { Authorization: `Bearer ${lj.accessToken}` } });
      if (!r.ok) return false;
      const j = await r.json();
      return !(j.data ?? []).some((s) => s.id === screen.id);
    }, 6000);
    assert.ok(gone, 'deleteScreen ผ่าน store → จอต้องหายจาก server จริง');

    // matrix ไม่มีจอเทสอีก (หลัง refresh)
    await useSignageStore.getState().refreshScreens();
    assert.ok(!useSignageStore.getState().screens.some((s) => s.id === screen.id), 'เมทริกซ์ต้องไม่มีจอที่ลบไปแล้ว');
  } finally {
    globalThis.fetch = realFetch; // คืน fetch เดิม
  }
});
