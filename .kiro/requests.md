# 📥 New Requirements / Change Requests — Inbox

> กล่องรับไอเดียกลาง — **ทุกคน (มนุษย์, Kiro, Freebuff) เขียนได้ตลอดเวลา**
> วิธีใช้:
> 1. เขียนไอเดียใหม่ลงท้ายไฟล์นี้ (คร่าวๆ ก็พอ — 1-2 บรรทัด)
> 2. Agent จะช่วยขัดเกลา + ตรวจว่าชนกับงานเดิมไหม
> 3. ไอเดียที่ "อนุมัติ" → ย้ายไป `.kiro/specs/nextgen-digital-signage/requirements.md` (เพิ่ม FR-20+) + tasks.md
> 4. หลัง implement → ลบออกจากตรงนี้ + บันทึกลง CHANGELOG.md + AGENTS.md

---

## รายการที่รอพิจารณา (Open)

_(ว่าง)_

---

## รายการที่กำลังทำ (In Progress)

_(ว่าง)_

---

## ประวัติ (Done — ดู CHANGELOG.md สำหรับรายละเอียด)

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
- เทส: typecheck 0 error, build ผ่าน, smoke test ผ่าน (IP จาก connection + MAC จาก heartbeat ถูกเก็บจริง) — ยังไม่ deploy ต้อง `redeploy.bat`

### REQ-002 — กลับลำดับ IP priority: connection IP เป็นหลัก ✅ เสร็จ (2026-08-12 — 🤖 Kiro)
- **Security fix:** กลับลำดับ IP priority ใน `server.ts` — connection IP (spoof ไม่ได้) > reported IP จาก device (fallback)
- แก้ 2 จุด: pair endpoint + heartbeat endpoint
- typecheck 0 errors, build ผ่าน — ยังไม่ deploy ต้อง `redeploy.bat`
