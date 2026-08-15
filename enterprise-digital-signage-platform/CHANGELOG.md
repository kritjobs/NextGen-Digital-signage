# Changelog — NextGen Digital Signage Platform

รูปแบบตาม [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)  
Versioning ตาม [Semantic Versioning](https://semver.org/)

---

## [0.2.0] — 2026-08-12  🤖 แก้ไขโดย Freebuff

> รอบนี้เป็นการเตรียมความพร้อม production: แก้ช่องโหว่ความปลอดภัยวิกฤต + เคลียร์ type errors 49 จุด
> + deploy ขึ้นเครื่องจริง (10.70.0.1) ผ่าน Docker และยืนยันผลด้วย live tests

### Security
- **JWT_SECRET fail-fast** — ในโหมด production ถ้าไม่ตั้งหรือใช้ค่า default `CHANGE_THIS_IN_PRODUCTION_64_CHARS_MIN` server จะไม่ start (บังคับโดยดีไซน์) — `src/middleware/auth.ts`, `server.ts`
- **Webhook endpoints ต้องมี token** — `/api/trigger`, `/api/trigger/by-tags`, `/api/integrations/slack` ต้องส่ง `X-Webhook-Token` หรือ JWT — ถ้าไม่ตั้ง `WEBHOOK_TOKEN` ใน prod จะได้ 503
- **WebSocket relay กันปลอม** — anonymous connections (player/kiosk) รับอย่างเดียว ส่งข้อความปลอม EMERGENCY_TRIGGERED/QUICK_POST/SCREEN_COMMAND ไม่ได้อีก — `server.ts`
- **SSRF guard** — `/api/media-proxy` + `/api/widgets/rss` บล็อก private/internal IP ทั้งหมด (10.x, 172.16-31, 192.168, 169.254/cloud metadata, localhost, CGNAT) — `server.ts`
- **Interact endpoints** — viewer ที่ไม่ login เปลี่ยน layout/playlist ไม่ได้ (เหลือแค่ show_message) + rate limit 10/นาที — `server.ts`, `src/middleware/rateLimiter.ts`
- **docker-compose.yml ส่ง secrets เข้า container** — เพิ่ม `JWT_SECRET` (บังคับผ่าน `${JWT_SECRET:?...}`), `WEBHOOK_TOKEN`, `APP_URL` จาก `.env` (เดิม container ไม่เคยได้รับ secret เพราะ `.env` ถูกตัดออกจาก image → ระบบเคยรันด้วย default secret มาตลอด)
- **Prod .env** — ตั้ง JWT_SECRET ใหม่ 64 hex (backup เก่าที่ `.env.backup-20260812-181817`), เพิ่ม WEBHOOK_TOKEN 64 hex, NODE_ENV=production, ลบ UTF-8 BOM

### Fixed
- **Type errors 49 → 0** (`npx tsc --noEmit` ผ่าน 100%):
  - Zod v4 API — `z.record(z.unknown())` → `z.record(z.string(), z.unknown())` (Zod 3 → 4.4.3) — `src/middleware/validate.ts`
  - ขยาย types ให้ตรงกับ UI จริง: `MediaItem.contentData` (countdown/qrcode/promo/kpi/worldclock), `SlideData` (headlineFontSize/bodyFontSize), `RealtimeCommand` (UNPAIR_DEVICE/FORCE_DISPLAY) — `src/types/signage.ts`
  - ซิงค์ mock data: `initialData.ts` (tags ใน screens, status/approvalStatus ใน layouts), `SmartLayoutBuilder.tsx` (templates 26 ตัว), `ScreensManager.tsx`, `SlideshowStudio.tsx`
  - ลบ dead code `app_inactive` ที่เทียบกับ type แล้วไม่มีวันเป็นจริง
  - **ไม่ใช้ `as any` เพิ่ม** — แก้ที่ต้นเหตุทั้งหมด

### Added
- `docs/deploy-security-guide.md` — คู่มือ deploy ปลอดภัย + rollback workflow + checklist หลัง deploy
- `rollback.bat` — snapshot (tag image เก่า + pg_dump ไป `backups/`) / restore (ย้อนกลับโค้ด ~1 นาที)
- `check-deploy.bat` — วินิจฉัยว่า container รันโค้ดใหม่หรือเก่า
- `redeploy.bat` — deploy รอบเดียวจบ (snapshot → down → build no-cache → up → ตรวจผล) พร้อม log ที่ `build-log.txt`
- `sync-to-prod.ps1` — sync โค้ด dev → prod ผ่าน SMB (เทียบ SHA-256, ข้าม .env/uploads/dist)

### Changed
- Build ผ่านทั้ง server + frontend (`npm run build`)
- Deploy ขึ้น prod (10.70.0.1) ด้วย Docker สำเร็จ — เทส live 7 จุดผ่าน (WS relay block, trigger 401/200, SSRF block ×2, health)

### Known / Pending (หลัง deploy)
- จอต้อง **re-pair** (JWT_SECRET เปลี่ยน → display token เก่าหมดอายุ)
- เปลี่ยนรหัส admin เริ่มต้น (`Admin@2026!` ยังเป็นค่า default)
- ระบบภายนอกที่เรียก webhook ต้องส่ง header `X-Webhook-Token`

---

## [0.3.0] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-007 Backup อัตโนมัติ DB + Uploads)

### Added
- **Backup & Restore (REQ-007)** — สำรองข้อมูล DB + ไฟล์มีเดียเป็นไฟล์ ดาวน์โหลดได้จากหน้า Admin:
  - `src/services/backup.ts` — ใหม่: DB dump แบบ pure-JS (JSON ผ่าน pg — 21 ตารางทั้งหมด, ใช้ได้ทั้ง dev/Windows และ prod/node:20-alpine ที่ไม่มี pg_dump) + Uploads zip (`archiver@7` CJS-compatible) + retention ลบเก่าเกิน `BACKUP_RETENTION_DAYS` (default 7) + scheduler รันอัตโนมัติตอน `BACKUP_HOUR` (default 03:00)
  - `server.ts` — `GET /api/backups` (list + config), `POST /api/backups/run`, `GET /api/backups/:file/download` (attachment), `DELETE /api/backups/:file` — วางก่อน SPA fallback, audit log การสร้าง/ลบ, กัน path traversal
  - `auth.ts` — permission `read:backups` + `write:backups` (admin+)
  - `api.ts` — `backupApi` (list/run/downloadUrl/remove)
  - `BackupManager.tsx` — ใหม่: หน้า **Backup** ใน Navbar — การ์ด config (เวลาอัตโนมัติ/retention/จำนวนไฟล์ DB-Uploads/ขนาดรวม) + ปุ่ม **Run backup now** + ตารางไฟล์ (ชื่อ/ประเภท badge/ขนาด/เวลาแบบไทย/ดาวน์โหลด/ลบ) + empty state
  - `docker-compose.yml` — mount `./backups:/app/backups` ให้ signage-app + env `BACKUP_DIR`/`BACKUP_RETENTION_DAYS`/`BACKUP_HOUR` — backup อยู่บน host `\\10.70.0.1\\c\\signage\\backups` (โฟลเดอร์เดียวกับ postgres)

### Verified
- typecheck 0 error, build ผ่าน, smoke test 14/14 (401, list+config, run → db JSON 21 ตาราง/6 screens + zip PK 5MB, download attachment, delete, path traversal 404) + ยืนยัน UI (Run backup now ผ่าน UI → 2 ไฟล์โผล่ในตารางจริง)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

---

## [0.2.9] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-010 Audit log admin)

### Added
- **Audit log ย้อนหลัง (REQ-010)** — ตาราง `audit_logs` + `logAudit()` มีอยู่แล้ว (login/layout/playlist/schedule/campaign/emergency บันทึกครบ) — เพิ่มช่องทางดู:
  - `server.ts` — `GET /api/audit-logs` (filter `action`/`resource`/`q` (email/resourceId) + `limit`/`page` + total)
  - `auth.ts` — permission `read:audit` (admin+)
  - `api.ts` — `auditApi.getLogs()`
  - `AnalyticsTelemetry.tsx` — ส่วน **Admin Audit Trail**: ตาราง (เวลาแบบไทย, ผู้ใช้, action badge สีตาม severity, หมวด, resourceId, IP) + dropdown หมวด (auth/layout/playlist/schedule/campaign/media/screen/emergency) + ค้นหา

### Verified
- typecheck 0 error, build ผ่าน, smoke test 9/9 (สร้าง/แก้/ลบ layout → ปรากฏใน log ครบ, filter resource/action/q, limit cap, 401 ไม่มี token) + ยืนยัน UI (login + layout + campaign + schedule entries จริง)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

---

## [0.2.8] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-008 Monitoring & Alerting)

### Added
- **Monitoring checker (REQ-008)** — อัปเกรดจาก heartbeat checker เดิม (SQL update เปล่าๆ):
  - `server.ts` — ตรวจทุก 30 วิ: จอที่ heartbeat เก่ากว่า `MONITOR_OFFLINE_MINUTES` (default 5, ตั้งได้ใน .env) → เปลี่ยนเป็น offline + บันทึก telemetry `screen_offline` + broadcast `SCREEN_OFFLINE` + **Slack/Teams webhook** (ถ้าตั้ง `SLACK_ALERT_WEBHOOK_URL`)
  - จอกลับมาออนไลน์ (heartbeat สด) → เคลียร์ alert + telemetry `screen_online` + webhook + broadcast `SCREEN_ONLINE`
  - `GET /api/monitoring/status` — สถานะรายจอ (lastHeartbeat / offlineForMinutes / isStale / alertActive / alertSince) + summary (online/offline/alerting) + รายการ alerts
- **UI monitoring:** `ScreensManager.tsx` — poll `refreshScreens()` ทุก 60 วิ + banner แดงแจ้งจอไม่ตอบสนอง (รายชื่อ + ปุ่มรีเฟรช) + heartbeat indicator บนการ์ดทุกจอ (❤️ Xm — เขียว=สด, แดง=stale)
- `useSignageStore.ts` — `refreshScreens()` action

### Fixed
- **Route หลัง SPA fallback:** `/api/monitoring/status` ถูกวางหลัง `app.get('*')` → ไม่เคย match — ย้ายก่อน catch-all (บันทึกไว้ในคอมเมนต์กันกลับไปทำซ้ำ)

### Verified
- typecheck 0 error, build ผ่าน, smoke test 9/9 (โครงสร้าง endpoint, ตรวจจับ offline → alert+screen_offline, recovery → เคลียร์+screen_online, 401 ไม่มี token) + ยืนยัน UI (banner + indicator)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod
- ตั้ง `SLACK_ALERT_WEBHOOK_URL` + `MONITOR_OFFLINE_MINUTES` ใน .env ของ prod (ถ้าต้องการ alert ผ่าน Slack/Teams)

---

## [0.2.7] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-011 Campaigns ฝั่ง server)

### Added
- **Campaigns CRUD ฝั่ง server (REQ-011)** — เดิม `CampaignManager` เก็บ localStorage → ย้ายมาเป็น API จริง:
  - `server.ts` — `GET/POST/PATCH/DELETE /api/campaigns` (admin auth, `write:schedules` permission, audit log)
  - `validate.ts` — `CreateCampaignSchema`/`UpdateCampaignSchema` (layoutSequence: layoutId + durationSec)
  - `api.ts` — `campaignApi` helper
  - `CampaignManager.tsx` — โหลด/สร้าง/แก้/ลบ/สลับ active ผ่าน API + loading/error state (ไม่แตะ localStorage)
- **Campaign แสดงผลจริงบนจอ (ระดับ campaign 21-40)** — resolver ผูกกับ 6-Level Priority:
  - `resolveScreenContent()` — campaign เป็นตัวแข่ง priority 30 (กลาง band campaign): schedule ระดับ/เลขสูงกว่า → ชนะ; ไม่มี schedule → campaign ชนะ; ไม่มีทั้งคู่ → default
  - `campaignCurrentLayoutId()` — server-side rotation ตามเวลา (epoch = createdAt)
  - `/api/display/:id/data`, `/api/schedules/resolve`, `SCHEDULE_CHANGED` broadcast — ส่ง `campaign` payload (layoutSequence/cycleMode/createdAt)
  - `PlayerApp.tsx` — campaign จาก resolve + WS (rotation ฝั่ง client) แทน localStorage
  - `DisplayKiosk.tsx` — refetch ให้ทันที่ขอบเวลา item (คณิตเดียวกับ server)

### Fixed
- **bug rotation stuck:** broadcast key ของ campaign เดิมรวม `layoutId` (server หมุนทุก 30 วิ) → `SCHEDULE_CHANGED` ยิงทุก rotation → player รีเซ็ต `campaignIndex=0` → ติด layout แรก — แก้เป็น key แค่ `cmp:{id}` (broadcast เฉพาะเมื่อ campaign เปลี่ยนจริง)

### Verified
- typecheck 0 error, build ผ่าน, smoke test 12/12 (CRUD, campaign vs schedule 50/25/35, display data มี campaign+layout, validation 400)
- **เทส UI เต็มวงจรใน preview:** สร้าง campaign ผ่าน UI (2 layouts) → TV Player แสดง campaign layout แทน default → **rotation A→B→A ครบ 60 วิ** (ยืนยัน 3 จุดเวลา)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

---

## [0.2.6] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-006 6-Level Priority)

### Added
- **6-Level Priority Model (REQ-006)** — ขยายจาก 3 ระดับเป็น 6 ระดับเต็มรูปแบบ:
  - `src/types/signage.ts` — `PriorityLevel` 6 ค่า + `PRIORITY_LEVELS` (band/สี/ป้าย EN+TH) + `priorityLevelOf()` / `priorityRankOf()` / `priorityDefOf()`
  - ระดับ: `emergency(91-100) > critical(81-90) > scheduled(41-80) > campaign(21-40) > default(11-20) > standby(1-10)`
- **Resolver ใช้ระดับ (REQ-003+006)** — `server.ts`: ชนกันหลาย schedule → เทียบระดับก่อน แล้วค่อยเทียบเลขในระดับเดียวกัน; คืน `priorityLevel` + `source` ใน `/api/schedules/resolve`, `/api/display/:id/data`, `SCHEDULE_CHANGED` broadcast
- **Scheduler Engine UI** — Hierarchy cards 6 ระดับ (พร้อม label ไทย), สี timeline bar / rule badge ตาม band, slider priority 1–90 (ช่วง 91-100 สงวนให้ระบบฉุกเฉิน) + แสดงระดับปัจจุบัน

### Changed
- `PriorityLevel` เดิม 3 ค่า (`emergency|scheduled|default`) → 6 ค่า (เพิ่ม `critical|campaign|standby`)
- Badge rule ใน Scheduler: `Priority: 80` → `Scheduled · 80`

### Verified
- typecheck 0 error, build ผ่าน, smoke test 8/8 (conflict 85>60>30, band campaign/standby/default, ระดับสูงกว่าชนะแม้ตัวเลขน้อยกว่า, display data มี priorityLevel/contentSource) + ยืนยัน UI ใน preview (6 cards + badge + slider)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod
- **หมายเหตุ:** rule เดิมที่ priority 95 (REQ003 Preview Test) ถูก cleanup ระหว่างเทส — เป็น rule ทดสอบของเดโม REQ-003

---

## [0.2.5] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-005 Proof of Play เข้าระบบจริง)

### Added
- **Proof of Play เข้าระบบจริง (REQ-005)** — จอส่งหลักฐานการเล่นสื่อเข้า server → Analytics มีข้อมูลจริง:
  - `server.ts` — `POST /api/analytics/proof-of-play` (auth: admin หรือ display token ของจอตัวเอง — ส่งแทนจออื่นโดน 403) + validation ผ่าน `CreateProofOfPlaySchema` (mediaId/screenId/durationMs/playedAt)
  - `PlayerApp.tsx` — หลัง media จบ → `reportProofOfPlay()` POST เข้า server (เก็บ local ต่อเป็น cache/offline)
  - `DisplayKiosk.tsx` — KioskZone (จอจริง) บันทึก PoP เข้า server เช่นกัน
  - `api.ts` — เพิ่ม `reportProofOfPlay()` helper

### Verified
- typecheck 0 error, build ผ่าน, smoke test 8/8 (POST 201, GET roundtrip, ไม่มี token 401, ส่งแทนจออื่น 403, body ผิด 400)
- **เทส live ใน preview:** เปิด TV Player เล่นจริง → PoP ไหลเข้า server ทุก ~15 วิ → หน้า Analytics & Telemetry แสดงรายการ COMPLETED จริง (Main Lobby, ชื่อ media, duration 15s)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

---

## [0.2.4] — 2026-08-15  🤖 แก้ไขโดย Freebuff (REQ-003 Server-side scheduler)

### Added
- **Server-side scheduler (REQ-003)** — เซิร์ฟเวอร์ตัดสินใจว่าจอโชว์อะไรตามเวลา ไม่ต้องพึ่งจอเปิดอยู่ตอนสร้าง schedule:
  - `server.ts` — `getActiveScheduleForScreen()` (filter isActive + วันที่ + วันในสัปดาห์ + เวลา + เป้าหมายทุกจอ/จอ/กลุ่ม, ชนกันเลือก priority สูงสุด), `resolveScreenContent()`, `pushScheduleUpdates()` (ticker 30 วิ + หลัง schedule CRUD → broadcast `SCHEDULE_CHANGED`)
  - `/api/display/:id/data` — ใช้ effective layout/playlist จาก schedule + ส่ง `schedule`/`effectivePlaylistId` ใน payload
  - `GET /api/schedules/resolve?screenId=` — ดู schedule ที่ active ตอนนี้
  - `DisplayKiosk.tsx` — รับ `SCHEDULE_CHANGED` → refetch ทันที + ใช้ `effectivePlaylistId`
  - `PlayerApp.tsx` — ดึง resolve + ฟัง WS → ลำดับความสำคัญ **emergency > schedule > campaign > base**

### Changed
- ลำดับความสำคัญ layout ใน Player: schedule มาก่อน campaign (เดิม campaign > schedule)

### Known / Pending
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod
- **REQ-011 (Open):** campaigns ฝั่ง server (ตอนนี้ CampaignManager ยังใช้ localStorage)

---

## [0.2.3] — 2026-08-15  🤖 แก้ไขโดย Freebuff (Deploy REQ-001/002)

### Changed
- **Deploy REQ-001 + REQ-002 ขึ้น prod สำเร็จ** (`redeploy.bat` ที่ 10.70.0.1) — ยืนยัน live tests ผ่าน:
  - Health: container ใหม่ (uptime < 5 นาที), `database: connected`
  - SSRF media-proxy (169.254.169.254) → `URL blocked` [400]
  - SSRF RSS (192.168.x) → `RSS feed blocked` [400]
  - `/api/trigger` ไม่มี token → [401], token ผิด → [401]
  - `/api/trigger` token ถูก + `action: refresh` → [200] success (targetScreens 5)
  - **หมายเหตุ:** `/api/trigger` ตอนนี้บังคับ field `action` + `target` — webhook ภายนอกที่เคยส่งแค่ `{}` ต้องปรับ payload (โค้ดใหม่ตรวจเข้มขึ้น)

### Known / Pending
- จอต้อง **re-pair** (JWT_SECRET เปลี่ยน — display token เก่าหมดอายุ)
- เปลี่ยนรหัส admin เริ่มต้น (`Admin@2026!`)
- แจก `WEBHOOK_TOKEN` ให้ระบบภายนอกที่เรียก webhook

---

## [0.2.1] — 2026-08-12  🤖 แก้ไขโดย Freebuff (REQ-001)

### Added
- **เช็ค IP + MAC จริงของจอ (REQ-001)** — แทน mock data เดิม:
  - `server.ts` — helper `getClientIp()`: ตอน `/api/display/pair` และ `/api/telemetry/heartbeat` เก็บ IP จริงจาก connection (`req.ip`/`x-forwarded-for`) และรับ `macAddress` จาก device (ถ้าส่งมา)
  - `src/middleware/validate.ts` — `HeartbeatSchema` เพิ่ม `ipAddress`/`macAddress` optional
  - `src/components/player/PairingPage.tsx` — merge deviceInfo จาก `SignageNative.getDeviceInfo()` (Android) → ส่ง IP/MAC จริงตอน pair
  - `android-player/.../NativeBridge.kt` — `getDeviceInfo()` เพิ่ม `ipAddress` + `macAddress` (NetworkInterface, best-effort)
  - `ScreensManager.tsx` — Network Info โชว์ "—" ถ้ายังไม่มีข้อมูลจริง + แสดง last heartbeat

### Changed
- `src/data/initialData.ts` + `src/db/seed.ts` — ลบ IP/MAC ปลอมออก (ค่าเริ่มต้นว่าง → device รายงานจริง)

### Known (ข้อจำกัด)
- **Browser (web player):** หา MAC ไม่ได้ (นโยบาย privacy ของ browser) → IP ได้จาก connection, MAC จะ "—"
- **Android 10+:** MAC ที่ได้เป็นค่า randomized ต่อ network (อาจต่างจาก MAC ฮาร์ดแวร์ที่ router เห็น)
- ยังไม่ deploy ขึ้น prod — ต้อง `redeploy.bat` ที่เครื่อง 10.70.0.1

---

## [0.2.2] — 2026-08-12  🤖 แก้ไขโดย Kiro (REQ-002)

### Security
- **IP priority fix (REQ-002)** — กลับลำดับ IP priority ใน `server.ts`:
  - เดิม: `reportedIp (จาก device)` > `clientIp (จาก connection)` → device สามารถ spoof IP ได้
  - ใหม่: `clientIp (จาก connection)` > `reportedIp (จาก device)` → connection IP เชื่อถือได้ (spoof ไม่ได้ในระดับ TCP)
  - แก้ 2 จุด: `/api/display/pair` + `/api/telemetry/heartbeat`
  - reported IP จาก device ยังใช้เป็น fallback กรณี server อยู่หลัง proxy ที่ไม่ forward IP

---

## [Unreleased]

### Planned
- PostgreSQL integration (Drizzle ORM + migrations)
- Docker + docker-compose.yml production setup
- REST API CRUD endpoints (screens, media, playlists, schedules)
- File upload (multer) สำหรับ media
- Authentication / Authorization (JWT)
- Redis integration สำหรับ WS session tracking
- A/B Video Buffering engine (zero-flicker)
- WakeLock API สำหรับ Android TV

---

## [0.1.0] — 2026-08-04

### Added
- Initial project scaffold (React 19 + Vite + Express + WebSocket)
- TypeScript type system ครบทั้งหมด (`src/types/signage.ts`)
- Zustand global store พร้อม CRUD actions ทั้งหมด
- Seed data: 5 screens, 8 media items, 4 layouts, 6 playlists, 3 schedules
- Admin Panel (7 tabs):
  - ScreensManager — แสดงสถานะจอ + remote commands
  - SmartLayoutBuilder — Zone canvas editor
  - MediaLibrary — จัดการสื่อ
  - PlaylistEditor — Timeline editor พร้อม preview
  - SchedulerEngine — Gantt timeline scheduler
  - RealtimeControlConsole — Emergency + remote commands
  - AnalyticsTelemetry — Proof of Play + Telemetry logs
- Player App:
  - Multi-zone layout renderer
  - Emergency overlay (pulse animation + display-hero font)
  - 7 Media renderers (video, image, ticker, weather, clock, announcement, webpage)
  - OSD bar (auto-hide 8s)
  - Offline simulation toggle
  - Fullscreen API
  - QR Pairing screen
- Simulator mode (Admin + Player คู่กัน)
- Express server + WebSocket hub
- REST API: `/api/health`, `/api/emergency/trigger`, `/api/emergency/clear`,
  `/api/control/command`, `/api/telemetry/heartbeat`
- Design System "Aetheric Command":
  - Admin: Electric Indigo + Cyan palette, Glassmorphism cards
  - Player: Pure Black OLED, display-hero 120px typography
- WebGL shader background (burn-in prevention)
- Project documentation:
  - `README.md`
  - `docs/environment.md`
  - `docs/database.md`
  - `docs/development-guide.md`
  - `docs/docker-guide.md`
  - `docs/api-reference.md`
  - `docs/decisions/`
  - `.kiro/specs/` (requirements, design, architecture, tasks)

### Technical Decisions
- ใช้ port `3100` (ไม่ใช่ 3000) เพราะ `thaihua-auth-service` ครอง 3000 แล้ว
- ใช้ `thaihua-postgres` ที่มีอยู่แล้วแทนการสร้าง container ใหม่
- เชื่อมต่อผ่าน `thaihua-network` bridge network
- เลือก Drizzle ORM (เบา, TypeScript-first) แทน Prisma
- State ยังอยู่ใน Zustand (in-memory) รอ DB layer

---

## Template สำหรับ Version ต่อไป

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- ฟีเจอร์ใหม่

### Changed
- การเปลี่ยนแปลงที่มีอยู่แล้ว

### Deprecated
- ฟีเจอร์ที่จะถูกลบในอนาคต

### Removed
- ฟีเจอร์ที่ถูกลบแล้ว

### Fixed
- Bug ที่แก้แล้ว

### Security
- ช่องโหว่ที่แก้แล้ว
```
