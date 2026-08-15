# AGENTS.md — NextGen Digital Signage Workspace

> ⭐ ไฟล์นี้คือ **จุดนัดพบกลาง** ระหว่าง AI agents (Freebuff, Kiro IDE, อื่นๆ) กับมนุษย์
> - **อ่านก่อนเริ่มงานทุกครั้ง** — เพื่อเข้าใจบริบทและสถานะล่าสุด
> - **อัปเดตทุกครั้งที่ทำงานเสร็จ** — เพื่อให้ agent ตัวถัดไปต่อจากตรงนี้ได้ทันที
> - ตอบ/เขียนเอกสารเป็น **ภาษาไทย** (ตรงกับโปรเจค) ส่วนโค้ด/คำสั่งเป็นภาษาอังกฤษ

---

## 1. Workspace นี้คืออะไร

Root: `C:\NextGen Digital Signature` — โปรเจค **Enterprise Digital Signage** (ระบบ Smart School Communication Platform
ควบคุมจอหลายจอ realtime) + โปรโตไทป์ + เอกสารวิเคราะห์คู่แข่ง + Specs

| โฟลเดอร์/ไฟล์ | คืออะไร |
|---|---|
| `enterprise-digital-signage-platform/` | ⭐ **โปรเจคหลัก** (React 19 + Vite + Zustand + Express + WS + PostgreSQL/Drizzle + Docker) |
| `.kiro/specs/nextgen-digital-signage/` | Specs ต้นแบบ (requirements.md, architecture.md, design.md, tasks.md) — อ้างอิงโดย Kiro |
| `enterprise-digital-signage-platform AI/` | รุ่นแรกจาก AI Studio (ต้นแบบเก่า ไม่ใช่ของจริง) |
| `signage-studio-pro-Slideshow/`, `stitch_edusign_admin_pro*` | โปรโตไทป์ UI (mock data) |
| `MASTER_Competitor_Analysis_Summary.md` ฯลฯ | วิเคราะห์คู่แข่ง + roadmap |

---

## 2. โปรเจคหลัก — ข้อมูลสำคัญ

- **Tech stack:** React 19 / Vite 6 / Zustand 5 / Tailwind v4 / Express 4 / WebSocket (ws) / PostgreSQL (Drizzle) / Redis / Docker / Gemini AI
- **Server:** `server.ts` (root ของโปรเจค) — REST API + WebSocket hub + auth (JWT) + RBAC + rate limit + SSRF guard
- **DB schema:** `src/db/schema.ts` (15+ ตาราง) + migrations ใน `src/db/migrations/`
- **Frontend:** Admin 10 tabs, Player multi-zone (15+ media types), Kiosk `/display/:id`, Pairing `/pair`
- **Android Player:** `android-player/` (Kotlin WebView kiosk)

### คำสั่งที่ใช้บ่อย (รันใน `enterprise-digital-signage-platform/`)
```bash
npm run typecheck   # หรือ: npx tsc --noEmit   ← ต้องผ่าน 0 errors เสมอ
npm run build       # vite build + esbuild server.ts → dist/
npm run dev         # dev server (port 3100 — 3000 ถูก thaihua-auth-service ครอง)
```

---

## 3. สถานะระบบจริง (Production) — สำคัญมาก

- **เครื่องจริง:** `10.70.0.1` (Windows) — โค้ดอยู่ `C:\signage` (เข้าถึงผ่าน SMB `\\10.70.0.1\c\signage`)
- **รันด้วย Docker ทั้งหมด:** signage-app (:3100), signage-postgres (:5433), signage-redis (:6380), signage-migrate (one-shot)
- **เครื่อง dev:** `10.10.0.63` — เข้า prod ได้ผ่าน SMB อย่างเดียว (ไม่มี SSH/WinRM)
- **รหัส admin:** ไม่มี default อีกแล้ว — ตั้งผ่าน env `ADMIN_INITIAL_PASSWORD` (seed) หรือเปลี่ยนด้วย `change-admin-password.bat` / `/api/auth/change-password` (ดู `docs/change-admin-password.md`)

### เครื่องมือ ops (ในโปรเจคหลัก — ใช้ที่เครื่อง prod หรือ dev ตามที่ระบุ)
| ไฟล์ | ใช้ที่ไหน | ใช้ทำอะไร |
|---|---|---|
| `redeploy.bat` | prod | deploy รอบเดียวจบ (snapshot → down → build no-cache → up → ตรวจ) |
| `check-deploy.bat` | prod | วินิจฉัยว่า container รันโค้ดใหม่หรือเก่า |
| `rollback.bat snapshot/restore` | prod | เซฟ/ย้อนกลับโค้ดก่อน deploy |
| `sync-to-prod.ps1` | dev | sync โค้ด dev → prod ผ่าน SMB (เทียบ SHA-256) |
| `docs/deploy-security-guide.md` | ทั้งคู่ | คู่มือ deploy + checklist + rollback |

### กฎเหล็ก (ห้ามละเมิดเด็ดขาด)
- ❌ **ห้าม** `docker compose down -v` — ลบ database + uploads ถาวร
- ❌ **ห้าม** deploy แบบไม่เห็น error — deploy.bat ซ่อน error ได้ ใช้ `redeploy.bat` หรือดู build-log.txt
- ❌ **ห้าม** แก้ `.env` prod โดยไม่สำรองก่อน (backup เป็น `.env.backup-<เวลา>`)
- ✅ หลังแก้โค้ด: รัน typecheck + build ให้ผ่าน แล้ว sync ผ่าน `sync-to-prod.ps1`

---## 4. บันทึกการทำงานล่าสุด (Work Log)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**กำหนดเนื้อหาใหม่ให้ scr-002 บน prod — พร้อมแสดงทันทีที่กลับ online ✅**)
- **สร้าง `pl-cafeteria-menu`** (approved, 3 items: med-004 เมนู + med-005 ticker + med-008 ประกาศ) + ตั้ง tags `cafeteria`+`menu` ให้ scr-002 + ผูก `lay-menu-board` (ตั้ง tags คู่กัน → tag-match จับ layout+playlist พร้อมกัน)
- **แก้ `sch-002`** เดิมชี้ playlist ว่าง (อนุบาลวันภาษาไทย 0 items) → ชี้ pl-cafeteria-menu + lay-menu-board (จ-ศ 11:00–18:00 จะโชว์เมนูไม่จอว่าง)
- **ตรวจผ่าน 17/17:** display data scr-002 → `tag_match` + `effectivePlaylistId=pl-cafeteria-menu` + layout lay-menu-board + 3 items — จออื่นไม่ถูกแย่ง (scr-001 default, scr-004 pl-campus-events) — เหลือแค่ช่างเปิดจอกลับมา (docs/recover-scr002.md)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**ตรวจ scr-002 offline + คู่มือช่างกลับออนไลน์**)
- **scr-002 (`Cafeteria Digital Menu Board` — ตึก B ชั้น 2) offline ~2 วัน 4 ชม.** (heartbeat สุดท้าย 13 ส.ค. 19:04 ไทย, 3,096 นาที) — IP สุดท้าย `172.19.0.1` = Docker bridge (มาจากเครื่อง server ไม่ใช่จอ) → ยืนยันจอถูกปิด/ถอดสายจริง ต้องตรวจทางกายภาพ; `alertActive=false`; pairing `CAFE-20` ยังใช้ได้ไม่หมดอายุ; generate-token ใช้ได้
- **เนื้อหา scr-002 ตอนกลับมา:** playlist `อนุบาลวันภาษาไทย` (pl-1786423885792) เหลือ **0 items** (ล้างไปรอบ 13 ส.ค.) + tags จอ `[]` → โซน content จะว่าง — ต้องกำหนดใหม่ (เร็วสุด: ตั้ง tags จอ cafeteria+menu → tag-match; หรือสร้าง playlist+approve; หรือแก้ sch-002) — `sch-002` active จ-ศ 11:00–18:00 เท่านั้น (ตอนนี้ resolve = default)
- **โหมดระบบ = HTTPS** → URL จอต้อง `https://10.70.0.1/display/scr-002?token=...` + CA ตัวปัจจุบัน/หรือ native player
- **ส่งงานช่าง:** `docs/recover-scr002.md` — checklist ช่างหน้างาน + Admin (สร้าง URL ใหม่, กำหนดเนื้อหา, ตรวจ monitoring/watch-screen-online.bat)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**ตรวจหลัง redeploy — Content Approval + Tag-Match คู่กันบน prod ✅**) 
- **redeploy เสร็จ → ตรวจบน prod ผ่าน 30/30:** migration **0011 รันแล้ว** (playlists 5 + layouts มี `status`/`approval_status` — เพลย์ลิสต์เดิมทั้งหมด `approved` จาก migration UPDATE); **pending ถูกกรอง** (สร้าง playlist+layout ใหม่ → โดนบังคับ `pending` แม้ client ส่ง approved → ไม่ขึ้นจอ, effectivePlaylistId=null); **approve แล้วขึ้นทันที** (PATCH approve ทั้งคู่ → display data มี playlist ใหม่ + tag_match คืน effectivePlaylistId + layout ใหม่คู่กัน, contentSource=tag_match); **reject → กรองออกอีกครั้ง** + audit บันทึก `approval_approved`/`approval_rejected` ครบ; sanity scr-001 ได้ content ปกติ (default/lay-split-3zone) — ล้างข้อมูลเทสเรียบร้อย
- สคริปต์ตรวจซ้ำได้: `.freebuff/verify-prod-approval.mjs` (login + สร้าง/ลบข้อมูลเทสเอง) — `CHANGELOG.md` [0.4.5]

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**Content Approval Workflow + Tag-Match คู่กัน + Watch script**) 
- **Content Approval:** playlists เพิ่ม `status`+`approval_status` (migration `0011`) — content ขึ้นจอได้ต่อเมื่อ approved+published — server กรอง display data / schedule (ข้ามไป priority ถัดไป) / tag-match — **สร้างใหม่ = pending เสมอ** (POST บังคับ, กัน client ส่ง approved) — `PATCH /api/playlists/:id/approve` (admin only + audit) — UI badge + Approve/Reject ใน PlaylistEditor + SmartLayoutBuilder — เทสจริง dev: pending ไม่ขึ้นจอ → approve แล้วขึ้นทันที ✅
- **Tag-Match จับคู่คู่กัน:** `findTagMatchedContent` คืน layout + playlist พร้อมกัน (เดิม layout ชนะแล้วตัด playlist) + tie-break updatedAt — เทสจริง: จอ cafeteria+menu ได้ `lay-menu-board` + `pl-lunch-menu` คู่กัน ✅
- **watch-screen-online.mjs/.bat:** เฝ้าดู scr-002 (poll `/api/monitoring/status`) → แจ้งเมื่อกลับ online (console + log + webhook) — `--once` + auto re-login
- เทส: typecheck 0, build ผ่าน, integration **14/14** + preview ผ่าน — **ต้อง redeploy** (`CHANGELOG.md` [0.4.4])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**Tag-Based Auto-Match ขึ้น prod ✅ — ตรวจหลัง redeploy รอบ 2**)
- **redeploy รอบ 2 (build 21:25) → Tag-Based Auto-Match ทำงานบน prod จริง:** จอเทส `scr-tagtest-prod` (tags cafeteria+menu) → `/api/display/data` คืน `contentSource: tag_match` + `effectivePlaylistId: pl-tagtest-prod` (มี item 1) ✅ — sanity: scr-001 (ไม่มี tags) → `default` ปกติ ไม่ regression
- **ประวัติ (รอบแรกพลาด):** build 20:49 เกิดก่อน sync ไฟล์ (20:59+) → container รันโค้ดเก่า — migration `0010` (layouts.tags) รันไป prod DB ตรง + **แก้ redeploy.bat** → `docker compose run --rm --build signage-migrate` (rebuild ภาพ migrate ทุกรอบ — กันภาพเก่าไม่มี migration ใหม่)
- **ล้างข้อมูลเทสแล้ว** (scr-tagtest-prod + pl-tagtest-prod ลบ เรียบร้อย — prod เหลือ 5 จอ / 5 เพลย์ลิสต์)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**Tag-Based Auto-Match + Ops: ล้าง prod**)
- **Tag-Based Auto-Match:** `layouts` เพิ่ม `tags` (migration `0010`) — ตอนนี้ทุก entity มี tags — `resolveScreenContent()` จับคู่ playlist+layout จาก tags (case-insensitive) → `contentSource: tag_match` — จอใหม่ตั้ง tag ได้เนื้อหาทันที ไม่ต้องสร้าง schedule — broadcast เมื่อ tags เปลี่ยน — UI: 🎯 Tags ใน ScreensManager Configure (พร้อม ⚡ Auto-match hint) + PlaylistEditor + SmartLayoutBuilder — เทสจริง: จอใหม่ `scr-tagtest` (cafeteria+menu) → ได้ `Cafeteria Lunch Specials` อัตโนมัติ ✅ — integration **13/13** + typecheck + build + preview ผ่าน (`CHANGELOG.md` [0.4.3])
- **Ops — ล้าง prod:** `scr-002` offline ตั้งแต่ 13 ส.ค. (หลัง REBOOT, IP เป็น docker bridge → จอถูกปิด/ถอดจริง — ตรวจทางกายภาพ); **ลบ 66 media rows ไฟล์หาย + 63 playlist_items** (เพลย์ลิสต์ `อนุบาลวันภาษาไทย` ใช้กับ scr-002 ที่ offline — ไม่กระทบจอที่รัน) — backup ก่อนล้าง
- ต้อง **redeploy** 1 รอบเพื่อขึ้น prod (migration `0010` จะรันอัตโนมัติ — redeploy.bat แก้ไว้แล้ว)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**ตรวจหลัง redeploy — เปลี่ยนรหัส admin ขึ้น prod ✅**)
- redeploy ผ่าน (container ใหม่) — **`POST /api/auth/change-password` ทำงานบน prod** (no-token 401, with-token + รหัสเดิมถูก 200) — login รหัสใหม่ปกติ (280-char token)
- รหัส admin ใหม่ถูกต้องทั้ง prod + dev — default password ถูกถอนแล้ว (`CHANGELOG.md` [0.4.2])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**ตรวจหลัง redeploy — Media Expiration ขึ้น prod ✅**)
- redeploy ผ่าน — แต่ **migration ไม่รันอัตโนมัติ** (signage-migrate เป็น one-shot, compose up ไม่ rerun) → รัน `db:migrate` ไป prod DB ตรง (column `release_date` + `fallback_image_url` ลงครบ)
- **เทสบน prod ผ่าน:** POST /api/media รับ expiresAt ได้ + `/api/display/scr-001/data` กรอง expired ออก (med-check-exp ไม่ส่ง, normal ส่ง) — ลบ media เทสแล้ว
- **แก้ redeploy.bat:** เพิ่ม `docker compose run --rm signage-migrate` ทุกครั้ง (กัน schema ตกค้างรอบหน้า) — commit `5d5fc3e` push + sync แล้ว

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**Media Expiration + Embargo + Fallback Image**)
- `release_date` (embargo) + `fallback_image_url` ใน media_items (migration `0009`) — server กรอง `/api/display/:id/data` (`isMediaPlayable`) — จอไม่เห็น media หมดอายุ/ยังไม่ถึงวันเปิดตัว — player/kiosk filter ชั้น client ด้วย
- MediaLibrary: field Release Date — Embargo + Fallback Image URL + badge (🔒 Embargo / ⛔ Expired)
- Fallback Image: media error → fallbackImageUrl/thumbnail แทนจอดำ (กฎทอง No Black Screen) — **เจอ+แก้ bug hooks crash** (early return ก่อน useEffect) + fix POST /api/media date conversion
- เทส: typecheck 0, build ผ่าน, integration **12/12** (เพิ่ม #10 media lifecycle) + preview: badge + fallback แสดงจริง (`CHANGELOG.md` [0.4.1]) — ต้อง redeploy

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**ตรวจหลัง redeploy — โค้ดใหม่ขึ้นครบ ✅**)
- redeploy ผ่าน — container ใหม่ (uptime ใหม่) + bundle มี UI ครบ (QR interact/โต้ตอบจอ/แคมเปญ/สำรองข้อมูล/Audit/จอไม่ตอบสนอง) — interact API บน prod https คืน `success:true` (QR Scan-to-Interact ใช้งานได้จริง) + campaigns route อยู่ (AUTH_REQUIRED = ต้อง login)
- **ไม่ใช่ปัญหา password (ประวัติ):** error ก่อนหน้าเป็น bug ในคำสั่งเทส (จับ field `token` ผิดเป็น `accessToken`) — ตั้งแต่วันนี้ **รหัส admin ถูกเปลี่ยนแล้ว** (ดู section ด้านล่าง)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**QR Scan-to-Interact — สแกน QR บนจอแล้วควบคุมจากมือถือ**)
- Kiosk: QR badge มุมขวาล่าง (`/interact/:screenId`) + InteractPage (ส่งข้อความไม่ต้อง login, เปลี่ยน playlist/layout ต้อง admin) — backend มีอยู่แล้ว เติม UI — เทส end-to-end ผ่าน (ข้อความขึ้นจอผ่าน WS จริง) + integration 11/11 (`CHANGELOG.md` [0.4.0])
- ✅ **push `57725b6` ขึ้น GitHub แล้ว** (GCM re-auth เสร็จ — origin/main = 57725b6) + **sync prod เรียบร้อย** (SHA ตรงกันทุกไฟล์: InteractPage/DisplayKiosk/App.tsx/integration test) — เหลือ **redeploy.bat ที่ prod** 1 รอบเพื่อ build dist ใหม่

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**คู่มือสลับโหมด HTTP/HTTPS ทีละขั้น**)
- `docs/screen-install-guide.md` ข้อ 6 ขยายเต็ม: เปิด mode.conf → แก้ (http/https) → รัน switch-mode.bat → URL ต่อโหมด → ตรวจ + ตารางแก้ปัญหาสลับโหมด (ไม่ต้องแก้โค้ด/redeploy)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**Android TV: CA อัตโนมัติผ่าน native player + ADB**)
- `android-player`: ฝัง Caddy CA ใน APK (`res/raw/caddy_root_ca.crt` + `network_security_config.xml` + manifest) → WebView trust HTTPS เอง ไม่ต้องติดตั้ง CA ที่จอ — build APK ผ่าน + ยืนยัน CA/NSC ใน APK — ⚠️ CA เปลี่ยนต้อง rebuild (`CHANGELOG.md` [0.3.9])
- `caddy/push-ca-adb.bat`: ติดตั้ง CA ผ่าน ADB WiFi (จอที่ใช้ browser ทั่วไป) + อัปเดตคู่มือ (TRUST-CA.md / screen-install-guide / android-player README)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**QR จับคู่จอ — URL ถูกโหมดอัตโนมัติ**)
- `PairingPage`: `?code=` pre-fill + QR encode `{origin}/pair?code=...` (http/https ตามโหมดที่เปิด) + Copy URL — ช่างสแกน QR/เปิดลิงก์ได้รหัสมาให้เลย ไม่ต้องพิมพ์
- `ScreensManager`: ปุ่ม **Pairing QR** บนทุกการ์ดจอ → modal QR + URL + Copy — ตรวจ typecheck/build + preview ผ่าน (`CHANGELOG.md` [0.3.8])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**คู่มือติดตั้งจอฉบับลูกค้า + เครื่องมือ CA ฝั่งลูกค้า**)
- `docs/screen-install-guide.md` — คู่มือติดตั้งจอแบบไม่เทคนิค (ทีละขั้น + screenshot description + ตารางเลือกโหมด A/B + แก้ปัญหาทั่วไป) — ลิงก์ใน README แล้ว
- `caddy/install-ca-client.bat` — ติดตั้ง CA บนเครื่อง Windows ลูกค้าแบบคลิกเดียว (ดาวน์โหลด CA ที่ถูก → ลบเก่า → Trusted Root → ตรวจ https/sw.js) + `TRUST-CA.md` อัปเดต (CA ถูกเปลี่ยน 15 ส.ค. — ต้อง re-install)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**โหมดสลับ HTTP/HTTPS — ตรวจ prod ผ่าน ✅**)
- redeploy แล้ว — generate-token บน prod ให้ URL ถูกโหมดจริง: ผ่าน Caddy → `https://10.70.0.1/display/...`, ตรง :3100 → `http://10.70.0.1:3100/display/...` — สลับโหมดด้วย `caddy/mode.conf` + `switch-mode.bat` (ไม่ต้องแก้ .env/redeploy)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (**สลับโหมด HTTP/HTTPS — config เดียว ไม่ต้องแก้โค้ด**)
- `server.ts` generate-token: display URL สร้างจาก request (`req.protocol`+Host, trust proxy เปิดอยู่) — ผ่าน Caddy ได้ https:// อัตโนมัติ, ตรง :3100 ได้ http:// — APP_URL เหลือเป็น fallback — **สลับโหมดไม่ต้องแก้ .env/redeploy**
- `caddy/mode.conf` (http/https) + `caddy/switch-mode.bat` (เปิด/ปิด Caddy service ตามโหมด) — จอเก่ายังใช้ URL เดิมได้ (ทั้ง 2 โหมดรันพร้อมกัน)
- ตรวจ: typecheck ✅, integration 10/10 ✅, เทสจำลอง Caddy (X-Forwarded-Proto) → https://10.70.0.1 ถูกต้อง ✅ — **prod ต้อง redeploy 1 รอบเพื่อรับโค้ดใหม่**

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (Ops: **CA ถูกต้องแล้ว + SW ผ่าน HTTPS เต็มรูปแบบ ✅**)
- **แก้ CA ผิดตัวครบวงจร:** pin storage `C:/signage/caddy/storage` + install-caddy.bat restart service จริง (net stop+start) + export CA จาก pinned storage — chain verify ผ่าน (`openssl verify: OK`, leaf ใหม่ 10:34)
- **เทส SW register ผ่าน HTTPS prod จริง (headless Edge + CDP):** secure context ✅ → SW registered+activated ที่ scope `https://10.70.0.1/` ✅ → **cache ครบ 3 กลุ่ม:** shell + display data + media (`/uploads/...webp` ผ่าน stale-while-revalidate) ✅
- **หมายเหตุ:** curl (Schannel) เจอ `CRYPT_E_NO_REVOCATION_CHECK` (CA ภายในไม่มี CRL endpoint) — **browser ทำงานปกติ** (soft-fail) — script ที่ใช้ curl กับ prod ใช้ `curl --ssl-no-revoke`
- **เหลือผู้ใช้:** ติดตั้ง `caddy-root-ca.crt` **ตัวใหม่** (ถูก overwrite แล้ว) ที่เครื่องอื่น/จอ + ตั้ง `APP_URL=https://10.70.0.1` ใน .env แล้ว redeploy — เครื่อง dev ติดตั้งแล้ว (thumbprint 00B0F76B)
- ไฟล์: `caddy/Caddyfile`, `caddy/install-caddy.bat`, `tests/sw-https-check.mjs` (สคริปต์เทส SW ผ่าน HTTPS)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.3.5]`)
- **Ops: ชุดติดตั้ง Caddy HTTPS บน prod (LAN)** — `caddy/Caddyfile` (tls internal) + `install-caddy.bat` + `TRUST-CA.md` — ให้ SW (REQ-004) ทำงานเต็มรูปแบบบน https://10.70.0.1 — ต้องรันที่เครื่อง prod + ติดตั้ง CA ที่จอ + ตั้ง APP_URL=https แล้ว redeploy (`CHANGELOG.md` [0.3.5])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (data cleanup — dev DB)
- **ล้าง media rows ที่ไฟล์หาย** (dev): 4 rows `*_optimized.webp` ไม่อยู่ในดิสก์ → ลบ (cascade) + แทนที่ reference ใน 2 เพลย์ลิสต์ (pl-lunch-menu, pl-1786423269073) เป็น med-003 — ยืนยัน 0 ไฟล์หาย, media 24→20, Cafeteria Lunch Specials ยังมี 2 items ใช้ไฟล์ได้ทั้งคู่ (ไม่มี commit — ข้อมูล dev ล้วน)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.3.4]`)
- **Ops: สคริปต์แก้ media URL บน prod** — `fix-prod-media.sql` + `fix-prod-media.bat` (รันที่ 10.70.0.1 หลัง redeploy: ตรวจ sample media เสิร์ฟ → psql ผ่าน docker compose exec → ชี้ med-001..008 ไป /media/sample/*) — SQL เทสผ่าน dev แล้ว (`CHANGELOG.md` [0.3.4])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.3.3]`)
- **Fix: seed media ต้นทางตาย (403) → ไฟล์ในระบบ** — เพิ่ม `public/media/sample/` (welcome-demo.mp4 + campus-1..4.png ~11.6MB) + `seed.ts` ชี้ `/media/sample/*` (ไม่พึ่ง external) + อัปเดต dev DB — ยืนยัน kiosk เล่นวิดีโอจริง (206 + PoP 201) — ต้อง redeploy ถึงจะเข้า prod dist (`CHANGELOG.md` [0.3.3])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.3.2]`)
- **REQ-004 (Offline-First Web Player) เสร็จ** — `public/sw.js` (network-first ข้อมูลจอ + stale-while-revalidate สื่อ + cache-first assets) + DisplayKiosk offline state/banner/auto-resume + dev hook `?simoffline=1` — **REQ-004 เป็นงานสุดท้ายของกลุ่ม 3 ครบทั้งหมด!** — integration 10/10 + เทส live ใน preview (SW activated, cache 3 กลุ่ม, simoffline แสดงเนื้อหาจาก cache) — ⚠️ SW ต้อง HTTPS/localhost (prod ยัง http) — ยังไม่ sync/deploy (`CHANGELOG.md` [0.3.2])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.3.1]`)
- **REQ-009 (Automated Integration Tests) เสร็จ** — `tests/helpers.mjs` + `tests/integration.test.mjs` (node:test 0 dep) 9 ชุด ครอบคลุม 7 งาน + security + pair/heartbeat; สร้าง/ลบข้อมูล `[TEST]` เอง; safety guard กันรันบน prod; `npm run test:integration` — **9/9 ผ่าน 2 รอบติด** (ยังไม่ sync prod รอบนี้ — โค้ดเทสกับ dev เท่านั้น)

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.3.0]`)
- **REQ-007 (Backup อัตโนมัติ DB + Uploads) เสร็จ** — `src/services/backup.ts` (DB dump pure-JS JSON ผ่าน pg 21 ตาราง + uploads zip archiver@7 + retention 7 วัน + scheduler 03:00) + routes `/api/backups` (list/run/download/delete + audit + กัน path traversal) + permission `read:backups`/`write:backups` + หน้า **Backup** ใน Navbar (`BackupManager.tsx`) + compose mount `./backups:/app/backups` — smoke test 14/14 + ยืนยัน UI — ยังไม่ deploy (`CHANGELOG.md` [0.3.0])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.9]`)
- **REQ-010 (Audit log admin) เสร็จ** — `GET /api/audit-logs` (filter/limit) + permission `read:audit` + ส่วน Admin Audit Trail ในหน้า Analytics (ตารางเวลา/ผู้ใช้/action/IP/severity + ค้นหา) — smoke test 9/9 + ยืนยัน UI — ยังไม่ deploy (`CHANGELOG.md` [0.2.9])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.8]`)
- **REQ-008 (Monitoring & Alerting) เสร็จ** — ตรวจ heartbeat ทุก 30 วิ (offline > MONITOR_OFFLINE_MINUTES) + telemetry event + Slack webhook (env) + `/api/monitoring/status` + UI: banner แจ้งจอไม่ตอบสนอง + heartbeat indicator ทุกการ์ด — smoke test 9/9 + ยืนยัน UI — ยังไม่ deploy (`CHANGELOG.md` [0.2.8])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.7]`)
- **REQ-011 (Campaigns ฝั่ง server) เสร็จ** — CRUD `/api/campaigns` + resolver รับ campaign (priority 30, ระดับ campaign 21-40) + server/client rotation + CampaignManager ใช้ API แทน localStorage — smoke test 12/12 + เทส UI เต็มวงจร (สร้างผ่าน UI → จอแสดง campaign → rotation A→B→A) + แก้ bug stuck layout แรก — ยังไม่ deploy (`CHANGELOG.md` [0.2.7])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.6]`)
- **REQ-006 (6-Level Priority) เสร็จ** — ขยาย priority จาก 3 เป็น 6 ระดับ (emergency>critical>scheduled>campaign>default>standby) + resolver (REQ-003) เทียบระดับก่อนเลข + คืน priorityLevel/source ใน API — smoke test 8/8 + ยืนยัน UI — ยังไม่ deploy (`CHANGELOG.md` [0.2.6])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.5]`)
- **REQ-005 (Proof of Play เข้าระบบจริง) เสร็จ** — จอ POST หลักฐานการเล่นสื่อเข้า server (admin/display token, กันส่งแทนจออื่น 403) → หน้า Analytics มีข้อมูลจริง — smoke test 8/8 + เทส live ใน preview (TV Player เล่นจริง → รายการ COMPLETED ทุก 15 วิ) — ยังไม่ deploy (`CHANGELOG.md` [0.2.5])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.4]`)
- **REQ-003 (Server-side scheduler) เสร็จ** — server ตัดสินใจว่าจอโชว์อะไรตามเวลา (filter วันที่/วัน/เวลา/เป้าหมาย + priority) + WS push `SCHEDULE_CHANGED` + kiosk/player apply — smoke test 19/19 ผ่าน — ยังไม่ deploy (`CHANGELOG.md` [0.2.4])

### 2026-08-15 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.3]`)
- **Deploy REQ-001/002 ขึ้น prod สำเร็จ** — ยืนยัน live tests 7 จุด (SSRF block ×2, trigger 401/200, health container ใหม่) — `CHANGELOG.md` [0.2.3]
- **ตั้ง git version control** — baseline commit 313 ไฟล์ + `git-help.md` + remote GitHub (`kritjobs/NextGen-Digital-signage`) — กติกาใน §6.7

### 2026-08-12 — 🤖 แก้ไขโดย Kiro (`CHANGELOG.md` → `[0.2.2]`)
- **REQ-002 (IP priority fix):** กลับลำดับ IP priority ใน `server.ts` — เดิม device IP > connection IP (spoof ได้) → ใหม่ connection IP > device IP (spoof ไม่ได้)
- แก้ 2 จุด: pair endpoint + heartbeat endpoint
- typecheck 0 errors, build ผ่าน — ยังไม่ deploy (ต้อง `redeploy.bat` ที่เครื่อง prod)

### 2026-08-12 — 🤖 แก้ไขโดย Freebuff (`CHANGELOG.md` → `[0.2.0]`)
- **Security 6 จุด:** JWT_SECRET fail-fast, webhook ต้องมี token, WS กันปลอม, SSRF guard (media-proxy/RSS), Interact auth+rate limit, compose ส่ง secrets เข้า container
- **Prod .env:** JWT_SECRET ใหม่ 64 hex + WEBHOOK_TOKEN 64 hex + NODE_ENV=production + ลบ UTF-8 BOM (backup: `.env.backup-20260812-181817`)
- **Type errors 49 → 0** — Zod v4 fix, ขยาย types (contentData/SlideData/RealtimeCommand), ซิงค์ mock data, ลบ dead code
- **Deploy ขึ้น prod สำเร็จ** — เทส live 7 จุดผ่าน (WS relay block, trigger 401/200, SSRF block ×2, health)
- **เครื่องมือใหม่:** rollback.bat, check-deploy.bat, redeploy.bat, sync-to-prod.ps1, deploy-security-guide.md
- **REQ-001 (IP/MAC จริง):** server เก็บ IP จริงจาก connection + Android ส่ง MAC จริง + UI โชว์ "—" แทน mock — ยังไม่ deploy (`CHANGELOG.md` [0.2.1])

---

## 5. งานที่ค้าง / ต้องทำต่อ (Pending)

- [ ] **scr-002 กลับออนไลน์** — offline 2 วัน+ (ปิด/ถอดจริง — ตรวจทางกายภาพ) — คู่มือช่าง: `docs/recover-scr002.md` — ✅ **เนื้อหาพร้อมแล้ว** (pl-cafeteria-menu + lay-menu-board + sch-002 แก้แล้ว — เปิดจอแล้วแสดงเลย) เหลือใช้ token ใหม่ (JWT_SECRET เปลี่ยน)
- [x] **เปลี่ยนรหัส admin แล้ว** (2026-08-15) — ลบ default ทั้ง seed.ts/docs — วิธีเปลี่ยน: `change-admin-password.bat` หรือ `/api/auth/change-password`
- [ ] **แจก WEBHOOK_TOKEN** — ระบบภายนอก (Slack/IoT/POS) ที่เรียก `/api/trigger` ต้องส่ง header `X-Webhook-Token` (เดิมเปิดสาธารณะ)
- [ ] เทสหลัง deploy ครบ (วันที่ผู้ใช้สะดวก) — ดู checklist ใน `deploy-security-guide.md`
- [ ] **Deploy REQ-003 (server-side scheduler)** — โค้ด sync แล้ว ต้อง `redeploy.bat` ที่เครื่อง prod
- [ ] ฟีเจอร์จาก roadmap ที่ยังไม่ทำ (offline-first ใน web player, 6-Level Priority, campaigns ฝั่ง server (REQ-011), PoP จริง, backup อัตโนมัติ, monitoring, tests, audit log — ดู requests.md)

---

## 6. กติกาการทำงานร่วมกัน (Conventions)

1. **อัปเดต 3 ไฟล์นี้ทุกครั้งที่ทำงานเสร็จ:**
   - `enterprise-digital-signage-platform/CHANGELOG.md` (เพิ่ม entry version)
   - `.kiro/specs/nextgen-digital-signage/tasks.md` (อัปเดตสถานะ)
   - `AGENTS.md` (อัปเดต Work Log + Pending)
2. **มาร์คผู้ทำชัดเจน:** งานที่ Freebuff ทำ → "แก้ไขโดย Freebuff", งานที่ Kiro ทำ → "แก้ไขโดย Kiro"
3. **ภาษา:** ตอบ/เอกสารเป็นไทย, โค้ด/คอมเมนต์ในโค้ดเป็นอังกฤษ
4. **คุณภาพ:** typecheck 0 errors เสมอ, ไม่ใช้ `as any` แก้ปัญหา, แก้ที่ต้นเหตุ
5. **ความปลอดภัย:** ไม่เปิดเผย secret ในเอกสาร/แชท, ไม่แก้ไฟล์ prod ตรงๆ โดยไม่ผ่าน workflow
6. **Kiro:** อ่าน specs ใน `.kiro/specs/nextgen-digital-signage/` ก่อนเริ่มฟีเจอร์ใหม่ — งานที่ทำต้องตรง requirements.md + design.md
7. **Git (ตั้งแต่ 2026-08-15):** ทุกงานที่เสร็จต้อง commit + push — มาร์คผู้ทำใน commit message (`🤖 Freebuff` / `🤖 Kiro`) ห้าม commit `.env` / `uploads/` / `.freebuff/` (อยู่ใน .gitignore แล้ว) — ดูคำสั่ง/กฎทั้งหมดใน `git-help.md` (root)

## 7. การรับไอเดีย/ความต้องการใหม่ (Requirement Intake) — สำคัญ

> ผู้ใช้ (มนุษย์) มักมีไอเดียเพิ่มเติมทันทีกลางงาน — **ทุกไอเดียต้องผ่านกล่องรับของกลางเสมอ**

### วงจรที่ถูกต้อง
```
1. ไอเดียใหม่ (มนุษย์พูด/พิมพ์)  →  เขียนลง .kiro/requests.md  (Open)
2. Agent ตรวจ: ชนกับงานเดิมไหม? เปิดช่องโหว่ไหม? ต้องแก้ type/DB ไหม?
3. อนุมัติ → ย้ายเข้า requirements.md (FR-20+) + tasks.md  →  เริ่ม implement
4. เสร็จ → ลบออกจาก requests.md + อัปเดต CHANGELOG.md + AGENTS.md (Work Log)
5. ถ้าเป็นระบบ prod → sync ผ่าน sync-to-prod.ps1 + ทดสอบตาม checklist
```

### กฎสำหรับ agent ทุกตัว
- ❌ **ห้าม implement ไอเดียที่ยังไม่เขียนลง requests.md** (กันสองตัวทำคนละเวอร์ชัน)
- ❌ **ห้ามแก้ requirements.md/design.md เองตามอำเภอใจ** — ต้องมีบันทึกใน requests.md ก่อน
- ✅ ไอเดียที่ยังไม่ชัด → เขียนเป็นคำถามใน requests.md ให้มนุษย์ตอบ
- ✅ งานที่ทำ → ต้องอัปเดต spec ให้ตรงโค้ดเสมอ (กัน spec กับโค้ดแยกกัน)

### Git setup (2026-08-15 — 🤖 Freebuff)
- ตั้ง repo ที่ workspace root — baseline commit มี AGENTS.md + .kiro + docs + โปรเจคหลัก + prototypes (exclude: .freebuff, node_modules, dist, .env, uploads, backups, logs)

### บทบาท (Agreed 2026-08-12 — 🤖 Freebuff)
- **มนุษย์ (เจ้าของระบบ):** พิมพ์คำสั่ง/ไอเดียในแชทเท่านั้น — **ไม่ต้องแก้ไฟล์เอง**
- **Freebuff:** เลขาฯ + ผู้รับผิดชอบหลัก — รับคำสั่งจากแชท → เขียนลง requests.md → implement → อัปเดต spec/CHANGELOG/AGENTS.md → รายงานกลับเป็นไทย
- **Kiro:** อ่านไฟล์กลาง (AGENTS.md + requests.md + specs) เพื่อรู้สถานะ — รับงานต่อจาก requests.md (In Progress/Open) หรือช่วยตรวจ/ทำคู่ขนานได้ แต่ต้องไม่ชนงานที่ Freebuff กำลังทำอยู่ (เช็คที่ requests.md ก่อนเสมอ)
