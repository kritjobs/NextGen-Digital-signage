# 📥 New Requirements / Change Requests — Inbox

> กล่องรับไอเดียกลาง — **ทุกคน (มนุษย์, Kiro, Freebuff) เขียนได้ตลอดเวลา**
> วิธีใช้:
> 1. เขียนไอเดียใหม่ลงท้ายไฟล์นี้ (คร่าวๆ ก็พอ — 1-2 บรรทัด)
> 2. Agent จะช่วยขัดเกลา + ตรวจว่าชนกับงานเดิมไหม
> 3. ไอเดียที่ "อนุมัติ" → ย้ายไป `.kiro/specs/nextgen-digital-signage/requirements.md` (เพิ่ม FR-20+) + tasks.md
> 4. หลัง implement → ลบออกจากตรงนี้ + บันทึกลง CHANGELOG.md + AGENTS.md

---

## รายการที่รอพิจารณา (Open)

### 2026-08-15 — กลุ่ม 3: ฟีเจอร์ roadmap (เจ้าของระบบอนุมัติให้เริ่มพิจารณา)

- ~~**REQ-003 — Server-side scheduler**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง)
- ~~**REQ-004 — Offline-first ใน web player**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — แคชเนื้อหาให้จอเล่นต่อได้เมื่อเน็ตหลุด (Service Worker)
- ~~**REQ-005 — Proof of Play เข้าระบบจริง**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — สถิติการเล่นสื่อจากจอเข้าสู่ฐานข้อมูลกลาง
- ~~**REQ-006 — 6-Level Priority Resolver ให้ครบ**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — ระบบ priority เต็มรูปแบบ 6 ระดับ
- ~~**REQ-007 — Scheduled DB backup อัตโนมัติ**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — backup DB + uploads อัตโนมัติ/ตามสั่ง ดาวน์โหลดได้จากหน้า Admin
- ~~**REQ-008 — Monitoring/alerting**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — แจ้งเตือนเมื่อจอ offline
- ~~**REQ-009 — Automated tests**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — integration test ครอบคลุม 7 งาน + security guard + pair/heartbeat
- ~~**REQ-010 — Audit log admin**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — บันทึกการกระทำของ admin ย้อนหลัง

#### 📋 ผลสำรวจความพร้อม (2026-08-15 — 🤖 Freebuff)

| # | งาน | ความพร้อม | ขนาดงาน | หมายเหตุ |
|---|---|---|---|---|
| REQ-009 | Automated tests | สูง | เล็ก | ทำบน dev ล้วน ไม่แตะ prod — กัน regression ทั้งหมด |
| REQ-007 | Scheduled DB backup | สูง | เล็ก | script + Task Scheduler บน prod — ประกันข้อมูล |
| REQ-005 | Proof of Play จริง | สูง | กลาง | **DB ตาราง + GET endpoint มีแล้ว** แต่ player บันทึกแค่ local (store) ไม่ POST เข้า server → Analytics ว่าง — แค่เพิ่ม POST + player ส่ง |
| REQ-008 | Monitoring/alerting | กลาง | เล็ก-กลาง | script ตรวจ health + connectedClients + แจ้งเตือน |
| REQ-010 | Audit log admin | กลาง | กลาง | ต้องเพิ่มตาราง + middleware |
| REQ-003 | Server-side scheduler | กลาง | **ใหญ่** | **DB ตาราง schedules ครบแล้ว + CRUD มี** แต่ player (PlayerApp) **ไม่เคย evaluate schedule เลย** — ต้องเพิ่ม resolver ฝั่ง server + WS push + player รับ/apply — งานหลักของระบบ |
| REQ-006 | 6-Level Priority | กลาง | กลาง | ตอนนี้ `PriorityLevel = 'emergency' \| 'scheduled' \| 'default'` (3 ระดับ) — ต้องขยายเป็น 6 + resolver — ควรทำคู่กับ REQ-003 |
| REQ-004 | Offline-first web player | ต่ำ | ใหญ่ | ต้อง IndexedDB + service worker — Android มี OfflineCacheService แล้ว |

**พบ gap เพิ่ม:** `campaigns` มีตารางใน DB แล้ว แต่ `PlayerApp` อ่านจาก **localStorage** (`signage_campaigns`) ไม่ได้ดึงจาก server → แยกเป็น REQ-011

**ลำดับที่แนะนำ:** REQ-009/007 (ไว้อันตราย) → REQ-005 (Analytics เป็นจริง) → REQ-006 (Priority) → REQ-008/010 → REQ-004 → REQ-011

---

## รายการที่กำลังทำ (In Progress)

_(ว่าง)_

---

## ประวัติ (Done — ดู CHANGELOG.md สำหรับรายละเอียด)

### REQ-004 — Offline-First Web Player ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**จอเล่นเนื้อหาต่อได้เมื่อเน็ตหลุด — Service Worker + แคชอัจฉริยะ**

- **เดิม:** จอ (DisplayKiosk) โหลดข้อมูลทุก 30 วิ — เน็ตหลุด = error เต็มจอ + เนื้อหาหยุด
- **`public/sw.js`** (ใหม่) — Service Worker กลยุทธ์ 4 แบบ:
  - navigate (หน้า app) → **network-first** + fallback cache — เปิดจอได้แม้ offline
  - `/api/display/*data` → **network-first** + fallback cache — ข้อมูลจอเล่นต่อ (stale แต่ทำงาน)
  - `/uploads/*` + `/api/media-proxy` → **stale-while-revalidate** — สื่อที่เล่นแล้วเล่นซ้ำได้ offline (อัปเดตพื้นหลัง)
  - `/assets/*` (hashed) → cache-first; อย่างอื่น → network-only (ห้าม cache auth/CRUD)
  - versioned cache + ล้างของเก่าอัตโนมัติ + `clients.claim()` ควบคุมหน้าทันที
- **`DisplayKiosk.tsx`:**
  - register SW + **offline state** (navigator.onLine + fetch ล้มเหลว) + **banner ทอง** "⚡ OFFLINE — เล่นจากแคช (เวลา)"
  - fetch ล้มเหลวแต่มีข้อมูลเก่า → **เล่นต่อจาก cache** (ไม่ error เต็มจอ) — ไม่มี cache → error พร้อมข้อความชัด
  - **auto-resume** — event `online` → ดึงข้อมูลสดทันที
  - dev hook `?simoffline=1` — จำลองเน็ตหลุด (อ่านจาก SW cache ตรงๆ) ใช้เทส/เดโม
- **`PlayerApp.tsx`** — register SW ด้วย (idempotent)
- **`tests/integration.test.mjs`** — เพิ่มเทสข้อ 10: `/sw.js` ถูกเสิร์ฟ + มีกลยุทธ์ครบ
- เทส: typecheck 0 error, build ผ่าน, **integration 10/10** + **เทส live ใน preview**: SW activated + controller, cache 3 กลุ่ม (shell/data/media) มีข้อมูลจริง, `?simoffline=1` → banner + เนื้อหายังแสดงครบ

### ⚠️ ข้อจำกัดสำคัญ
- **Service Worker ทำงานบน HTTPS หรือ localhost เท่านั้น** — prod ปัจจุบันเป็น `http://10.70.0.1:3100` → SW จะไม่ register (โค้ด fallback เงียบ) — จอ prod ยังเล่นต่อแบบ in-page ได้เมื่อ fetch ล้มเหลว (ข้อมูลเก่า + banner) แต่ **media cache เต็มรูปแบบต้อง HTTPS** — แนะนำติดตั้ง HTTPS (reverse proxy) หรือใช้ Android app (มี OfflineCacheService อยู่แล้ว)

### REQ-009 — Automated Integration Tests ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**ชุดเทสอัตโนมัติครอบคลุม 7 งานที่ deploy + security guard + pair/heartbeat**

- **เดิม:** เทสเป็นสคริปต์ once-off (`smoke-*.mjs`) ที่ลบทิ้งหลังใช้ — กัน regression ระยะยาวไม่ได้
- **`tests/helpers.mjs`** (ใหม่) — login/request wrappers + API ครบทุกกลุ่ม + เข้าถึง DB ตรง (สำหรับเทส offline detection) + **safety guard: ห้ามรันบน prod (NODE_ENV=production → reject ทันที)**
- **`tests/integration.test.mjs`** (ใหม่) — ใช้ `node:test` ในตัว (0 dependency เพิ่ม) 9 ชุด:
  1. Security — 401/403/SSRF/login
  2. Pair + Heartbeat — pair สำเร็จ/ซ้ำ 409/code ผิด 404 + heartbeat อัปเดต status/IP
  3. REQ-005 PoP — POST 201/GET roundtrip/ไม่มี token 401/จออื่น 403/body ผิด 400
  4. REQ-003 Scheduler — schedule ที่ตรงเงื่อนไข → active + priorityLevel
  5. REQ-006 Priority — 60>30 ชนะ, 20>15, conflict ตามระดับ
  6. REQ-011 Campaigns — CRUD + ชนะ/แพ้ campaign 30 เทียบ schedule 25/35/15
  7. REQ-008 Monitoring — จำลองจอเงียบ 10 นาที → offline + กลับมา → online (รอ ticker 30 วิ)
  8. REQ-010 Audit — login + layout create อยู่ใน log + filter
  9. REQ-007 Backup — list/run/download/delete + path traversal 404
- สร้างข้อมูล `[TEST]` แล้วลบให้เรียบร้อย (จอ/schedule/campaign/layout) — **รันซ้ำได้ไม่สะสมขยะ**
- รัน: `npm run test:integration` (ต้องมี `npm run dev` ก่อน) — ใช้ dev DB เท่านั้น
- เทส: **9/9 ผ่าน 2 รอบติด** (~71 วิ/รอบ หลักๆ คือรอ monitor ticker 35 วิ × 2)

### REQ-007 — Backup อัตโนมัติ (DB + Uploads) ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**สำรองข้อมูล DB + ไฟล์มีเดีย เป็นไฟล์ ดาวน์โหลดได้จากหน้า Admin**

- **เดิม:** ไม่มีระบบ backup เลย — ข้อมูลทั้งหมดอยู่ใน docker volume ของ prod (เสี่ยงข้อมูลหายถ้า volume เสีย)
- **`src/services/backup.ts`:**
  - DB dump แบบ **pure-JS (JSON ผ่าน pg)** — 21 ตารางทั้งหมด (screens/media/layouts/playlists/schedules/campaigns/telemetry/PoP/audit...) — ใช้ได้ทั้ง dev (Windows) และ prod (node:20-alpine ที่ไม่มี pg_dump)
  - Uploads dump แบบ **ZIP** (`archiver@7` — CJS-compatible กับ bundle CJS, prod Node 20)
  - **Retention** — ลบไฟล์เก่าเกิน `BACKUP_RETENTION_DAYS` (default 7 วัน)
  - **Scheduler** — เช็คทุกชั่วโมง รันอัตโนมัติตอน `BACKUP_HOUR` (default 03:00) ถ้ายังไม่มี backup ของวันนั้น
- **`server.ts`:** `GET /api/backups` (list + config), `POST /api/backups/run`, `GET /api/backups/:file/download`, `DELETE /api/backups/:file` — ทุก route วางก่อน SPA fallback + audit log (สร้าง/ลบ backup) + กัน path traversal
- **`auth.ts`:** เพิ่ม permission `read:backups` + `write:backups` (admin)
- **`BackupManager.tsx`:** หน้า **Backup** ใหม่ใน Navbar — การ์ด config (เวลาอัตโนมัติ/retention/จำนวนไฟล์) + ปุ่ม Run backup now + ตารางไฟล์ (ประเภท DB/Uploads, ขนาด, เวลา, ดาวน์โหลด/ลบ)
- **`docker-compose.yml`:** mount `./backups:/app/backups` ให้ signage-app (+ env `BACKUP_DIR`/`BACKUP_RETENTION_DAYS`/`BACKUP_HOUR`) — ไฟล์ backup อยู่บน host `\10.70.0.1\c\signage\backups`
- เทส: typecheck 0 error, build ผ่าน, **smoke test 14/14** (401, list+config, run → db JSON 21 ตาราง + zip PK, download attachment, delete, path traversal 404) + ยืนยัน UI (Run backup now ผ่าน UI → 2 ไฟล์โผล่ในตารางจริง)
- ✅ **deploy แล้ว (2026-08-15 ~15:48 — `redeploy.bat`)** — ยืนยัน live บน 10.70.0.1 เรียบร้อย

### REQ-010 — Audit log admin ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**ดูการกระทำของ admin ย้อนหลังได้ในหน้า Analytics**

- **เดิม:** ตาราง `audit_logs` + `logAudit()` มีอยู่แล้ว (login/layout/playlist/schedule/campaign/emergency บันทึกครบ) แต่ **ไม่มี endpoint + UI ดูย้อนหลัง**
- **`server.ts`:** `GET /api/audit-logs` — filter action/resource/q (email/resourceId) + limit/page + total
- **`auth.ts`:** เพิ่ม permission `read:audit` (admin)
- **`api.ts`:** `auditApi.getLogs()`
- **`AnalyticsTelemetry.tsx`:** ส่วน **"Admin Audit Trail"** — ตาราง (เวลาแบบไทย, ผู้ใช้, action badge สีตาม severity, หมวด, resourceId, IP) + dropdown หมวด + ค้นหา + ปุ่มค้นหา
- เทส: typecheck 0 error, build ผ่าน, **smoke test 9/9** (สร้าง layout → create/update/delete ปรากฏใน log, filter resource/action/q, limit cap, 401) + ยืนยัน UI (ตารางมี login/layout/campaign/schedule จริง)
- ✅ **deploy แล้ว (2026-08-15 ~15:48 — `redeploy.bat`)** — ยืนยัน live บน 10.70.0.1 เรียบร้อย

### REQ-008 — Monitoring & Alerting ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**ตรวจ heartbeat จอ + แจ้งเตือนเมื่อ offline เกิน threshold**

- **`server.ts`:** ตรวจทุก 30 วิ (แทน checker เดิมที่แค่ SQL update): จอ heartbeat เก่ากว่า `MONITOR_OFFLINE_MINUTES` (default 5, ตั้งใน .env) → เปลี่ยน offline + บันทึก telemetry `screen_offline` + broadcast `SCREEN_OFFLINE` + **webhook Slack/Teams** (ถ้าตั้ง `SLACK_ALERT_WEBHOOK_URL`); จอกลับมา → `screen_online` + แจ้งกลับ + เคลียร์ alert
- **`GET /api/monitoring/status`** — สถานะรายจอ (lastHeartbeat, offlineForMinutes, isStale, alertActive, alertSince) + summary + รายการ alerts (⚠️ ต้องมาก่อน SPA fallback)
- **`useSignageStore.ts`:** `refreshScreens()` — poll สถานะจอจาก server
- **`ScreensManager.tsx`:** poll ทุก 60 วิ + **banner แดง** "X จอไม่ตอบสนอง" (รายชื่อ + ปุ่มรีเฟรช) + **heartbeat indicator** บนการ์ดทุกจอ (❤️ Xm สีเขียว = สด / สีแดง = stale)
- เทส: typecheck 0 error, build ผ่าน, **smoke test 9/9** (โครงสร้าง endpoint, ตรวจจับ offline → alert + screen_offline, recovery → เคลียร์ + screen_online, 401 ไม่มี token) + ยืนยัน UI ใน preview (banner + indicator)
- ✅ **deploy แล้ว (2026-08-15 ~15:48 — `redeploy.bat`)** — ยืนยัน live บน 10.70.0.1 เรียบร้อย

### REQ-011 — Campaigns ฝั่ง server ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**แคมเปญเก็บฝั่ง server (DB) — แสดงผลจริงบนจอที่ระดับ priority campaign (21-40)**

- **`server.ts`:** CRUD `/api/campaigns` + resolver รับ campaign เป็นตัวแข่ง (priority 30 กลาง band campaign) — schedule ระดับ/เลขสูงกว่าชนะ, campaign ชนะ default; server-side rotation ตามเวลา (createdAt); broadcast เมื่อ campaign เปลี่ยนจริง (แก้ bug stuck layout แรก)
- **`CampaignManager.tsx`:** ใช้ API แทน localStorage; **`PlayerApp`/`DisplayKiosk`:** campaign จาก server payload + rotation
- เทส: smoke 12/12 + UI เต็มวงจร (สร้างผ่าน UI → จอแสดง campaign → rotation A→B→A)
- ยังไม่ deploy — ต้อง `redeploy.bat`

### REQ-006 — 6-Level Priority ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**ขยายระบบ priority จาก 3 ระดับเป็น 6 ระดับ + ผูกกับ scheduler resolver (REQ-003)**

- **`src/types/signage.ts`:** `PriorityLevel` 6 ค่า + `PRIORITY_LEVELS` (band/สี/ป้าย) + `priorityLevelOf()` / `priorityRankOf()` / `priorityDefOf()`
  - `emergency(91-100) > critical(81-90) > scheduled(41-80) > campaign(21-40) > default(11-20) > standby(1-10)`
- **`server.ts`:** resolver ชนกัน → เทียบระดับก่อน แล้วค่อยเทียบเลขในระดับเดียวกัน + คืน `priorityLevel`/`source` ใน `/api/schedules/resolve`, `/api/display/:id/data`, `SCHEDULE_CHANGED` broadcast
- **`SchedulerEngine.tsx`:** Hierarchy cards 6 ระดับ (EN+TH), สี timeline/badge ตาม band, slider 1–90 (Emergency 91-100 สงวนให้ระบบฉุกเฉิน)
- **`PlayerApp.tsx`:** รับ `priorityLevel` ใน payload + ลำดับ 6 ระดับชัดเจน
- เทส: typecheck 0 error, build ผ่าน, **smoke test 8/8** (conflict 85>60>30, campaign/standby/default band, ระดับสูงกว่าชนะแม้เลขน้อย, display data มี priorityLevel/contentSource) + ยืนยัน UI ใน preview
- ✅ **deploy แล้ว (2026-08-15 ~15:48 — `redeploy.bat`)** — ยืนยัน live บน 10.70.0.1 เรียบร้อย

### REQ-005 — Proof of Play เข้าระบบจริง ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**จอส่งหลักฐานการเล่นสื่อเข้า server → Analytics มีข้อมูลจริง**

- **`server.ts`:** เพิ่ม `POST /api/analytics/proof-of-play` (auth: admin หรือ display token ของจอตัวเองเท่านั้น — ส่งแทนจออื่นโดน 403) + validation (mediaId/screenId/durationMs/playedAt)
- **`validate.ts`:** เพิ่ม `CreateProofOfPlaySchema`
- **`PlayerApp.tsx`:** หลัง media จบ → POST เข้า server แทนบันทึก local อย่างเดียว (เก็บ local ต่อเป็น cache/offline)
- **`DisplayKiosk.tsx`:** KioskZone (จอจริง) บันทึก PoP เข้า server เช่นกัน
- **`api.ts`:** เพิ่ม `reportProofOfPlay()` helper
- เทส: typecheck 0 error, build ผ่าน, **smoke test 8/8 ผ่าน** (POST 201, GET roundtrip, ไม่มี token 401, จออื่น 403, body ผิด 400) + **เทส live ใน preview** — เปิด TV Player เล่นจริง → ข้อมูลไหลเข้าตารางทุก 15 วิ → Analytics UI แสดงรายการ COMPLETED ครบ
- ✅ **deploy แล้ว (2026-08-15 ~15:48 — `redeploy.bat`)** — ยืนยัน live บน 10.70.0.1 เรียบร้อย

### REQ-003 — Server-side scheduler ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**เซิร์ฟเวอร์ตัดสินใจว่าจอโชว์อะไรตามเวลา — ไม่ต้องพึ่งจอเปิดอยู่ตอนสร้าง schedule**

- **`server.ts`:**
  - `getActiveScheduleForScreen()` — filter: isActive + วันที่ + วันในสัปดาห์ + เวลา (HH:MM) + เป้าหมาย (ทุกจอ / screenIds / กลุ่ม) + **ชนกันเลือก priority สูงสุด**
  - `resolveScreenContent()` — หน้าตัดสินใจกลาง (schedule → fallback)
  - `pushScheduleUpdates()` — ticker ทุก 30 วิ ตรวจจับ schedule เปลี่ยน → broadcast `SCHEDULE_CHANGED`
  - `/api/display/:id/data` — ใช้ effective layout/playlist จาก schedule + ส่ง `schedule`/`effectivePlaylistId` ใน payload
  - `/api/schedules/resolve?screenId=` — ดูว่า schedule ไหน active ตอนนี้ (admin/debug)
  - schedule CRUD (POST/PATCH/DELETE) → trigger push ทันที
- **`DisplayKiosk.tsx`:** รับ `SCHEDULE_CHANGED` → refetch ทันที (ไม่รอ poll 30 วิ) + ใช้ `effectivePlaylistId`
- **`PlayerApp.tsx`:** ดึง resolve ตอน mount/เปลี่ยนจอ + ฟัง WS → ลำดับความสำคัญ **emergency overlay > schedule > campaign > base**
- เทส: typecheck 0 error, build ผ่าน, **smoke test 19/19 ผ่าน** (resolve, display data ใช้ scheduled layout, WS push, fallback เมื่อ schedule inactive)
- ✅ **deploy แล้ว (2026-08-15 ~15:48 — `redeploy.bat`)** — ยืนยัน live บน 10.70.0.1 เรียบร้อย

### 2026-08-15 — 🤖 Freebuff
- **ตั้ง git version control** ที่ workspace root — baseline commit ครอบ AGENTS.md + .kiro + docs + โปรเจคหลัก + prototypes (exclude .freebuff, node_modules, dist, .env, uploads, backups, logs) — กติกา commit ใน AGENTS.md §6.7

### 2026-08-12 — 🤖 Freebuff
- Security 6 จุด + Type errors 49→0 + Deploy prod สำเร็จ (ดู `enterprise-digital-signage-platform/CHANGELOG.md` [0.2.0])
- **ตกลงเวิร์กโฟลว์:** มนุษย์สั่งผ่านแชท → Freebuff เขียน requests.md + implement + บันทึก → Kiro อ่านไฟล์กลาง (รายละเอียดใน AGENTS.md §7)

### TEST-001 — ทดสอบการสื่อสาร ✅ ผ่าน (2026-08-12)
- Kiro อ่าน AGENTS.md + requests.md ถูกต้อง, เข้าใจสถานะโปรเจคตรง 100% (deploy v0.2.0, งานค้าง re-pair จอ ฯลฯ), ตอบกลับใน `test-kiro-reply.md` พร้อมมาร์ค "แก้ไขโดย Kiro" — **สื่อสารครบวงจร Freebuff ⇄ Kiro ใช้งานได้**

### REQ-001 — เช็ค IP + MAC จริงของจอ ✅ เสร็จ (2026-08-12 — 🤖 Freebuff)
- **Server:** pair + heartbeat เก็บ IP จริงจาก connection (req.ip) + รับ MAC จาก device (`getClientIp` helper, validate.ts HeartbeatSchema +ip/mac)
- **Android player:** `getDeviceInfo()` ส่ง ipAddress + macAddress จริง (NetworkInterface)
- **Web pair page:** merge deviceInfo จาก SignageNative; browser หา MAC ไม่ได้ → server ใช้ req.ip
- **UI:** Network Info โชว์ "—" จนกว่าจอรายงานจริง + แสดง last heartbeat
- **ลบ mock:** initialData.ts + seed.ts เปลี่ยน IP/MAC ปลอมเป็นค่าว่าง
- เทส: typecheck 0 error, build ผ่าน, smoke test ผ่าน (IP จาก connection + MAC จาก heartbeat ถูกเก็บจริง) — ✅ **deployed 2026-08-15** (เทส 7 จุดผ่าน)

### REQ-002 — กลับลำดับ IP priority: connection IP เป็นหลัก ✅ เสร็จ (2026-08-12 — 🤖 Kiro)
- **Security fix:** กลับลำดับ IP priority ใน `server.ts` — connection IP (spoof ไม่ได้) > reported IP จาก device (fallback)
- แก้ 2 จุด: pair endpoint + heartbeat endpoint
- typecheck 0 errors, build ผ่าน — ✅ **deployed 2026-08-15** (เทส 7 จุดผ่าน)
