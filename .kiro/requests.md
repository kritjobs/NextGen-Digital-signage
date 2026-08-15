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
- **REQ-004 — Offline-first ใน web player** — แคชเนื้อหาให้จอเล่นต่อได้เมื่อเน็ตหลุด (Android มี OfflineCacheService อยู่แล้ว)
- ~~**REQ-005 — Proof of Play เข้าระบบจริง**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — สถิติการเล่นสื่อจากจอเข้าสู่ฐานข้อมูลกลาง
- ~~**REQ-006 — 6-Level Priority Resolver ให้ครบ**~~ ✅ เสร็จแล้ว (ดูประวัติด้านล่าง) — ระบบ priority เต็มรูปแบบ 6 ระดับ
- **REQ-007 — Scheduled DB backup อัตโนมัติ** — pg_dump ผ่าน Task Scheduler + เก็บ 7 วัน
- **REQ-008 — Monitoring/alerting** — แจ้งเตือนเมื่อจอ offline / เซิร์ฟเวอร์ตาย
- **REQ-009 — Automated tests** — integration test ของ security guard + pair/heartbeat
- **REQ-010 — Audit log admin** — บันทึกการกระทำของ admin (login, trigger emergency, แก้ playlist ฯลฯ)

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
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

### REQ-005 — Proof of Play เข้าระบบจริง ✅ เสร็จ (2026-08-15 — 🤖 Freebuff)

**จอส่งหลักฐานการเล่นสื่อเข้า server → Analytics มีข้อมูลจริง**

- **`server.ts`:** เพิ่ม `POST /api/analytics/proof-of-play` (auth: admin หรือ display token ของจอตัวเองเท่านั้น — ส่งแทนจออื่นโดน 403) + validation (mediaId/screenId/durationMs/playedAt)
- **`validate.ts`:** เพิ่ม `CreateProofOfPlaySchema`
- **`PlayerApp.tsx`:** หลัง media จบ → POST เข้า server แทนบันทึก local อย่างเดียว (เก็บ local ต่อเป็น cache/offline)
- **`DisplayKiosk.tsx`:** KioskZone (จอจริง) บันทึก PoP เข้า server เช่นกัน
- **`api.ts`:** เพิ่ม `reportProofOfPlay()` helper
- เทส: typecheck 0 error, build ผ่าน, **smoke test 8/8 ผ่าน** (POST 201, GET roundtrip, ไม่มี token 401, จออื่น 403, body ผิด 400) + **เทส live ใน preview** — เปิด TV Player เล่นจริง → ข้อมูลไหลเข้าตารางทุก 15 วิ → Analytics UI แสดงรายการ COMPLETED ครบ
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

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
- ยังไม่ deploy — ต้อง `redeploy.bat` ที่เครื่อง prod

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
