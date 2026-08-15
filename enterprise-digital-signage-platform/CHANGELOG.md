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
