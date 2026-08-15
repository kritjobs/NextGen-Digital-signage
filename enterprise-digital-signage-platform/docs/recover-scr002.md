# 🔧 กลับออนไลน์จอ scr-002 — คู่มือช่างหน้างาน + Admin

> ตรวจสถานะเมื่อ **15 ส.ค. 2026 ~22:40** — scr-002 (`Cafeteria Digital Menu Board`, ตึก B ชั้น 2 โซนอาหาร)
> offline **~2 วัน 4 ชม.** (heartbeat สุดท้าย 13 ส.ค. 19:04 ไทย) — หลักฐานชี้ว่าจอถูกปิด/ถอดสายจริง ต้องตรวจที่หน้างาน

---

## 1. สถานะปัจจุบัน (ตรวจจากระบบแล้ว)

| หัวข้อ | ค่า | หมายถึง |
|---|---|---|
| สถานะ | `offline` 3,096 นาที | จอไม่ส่งสัญญาณมา 2 วันกว่า |
| IP สุดท้าย | `172.19.0.1` | เป็น IP ของ Docker (เครื่อง server) **ไม่ใช่ IP จริงของจอ** → จอไม่ได้ต่อ LAN จริง — ตรวจทางกายภาพ |
| รหัสจับคู่ | `CAFE-20` (ยังใช้ได้ ไม่หมดอายุ) | จอที่เปิดหน้า /pair ใส่รหัสนี้ได้เลย ไม่ต้องสร้างใหม่ |
| โหมดระบบ | **HTTPS** (`caddy/mode.conf`) | URL จอต้องใช้ `https://10.70.0.1/...` |
| เนื้อหาที่ผูก | playlist `อนุบาลวันภาษาไทย` (**0 รายการ** — ถูกล้างรอบ 13 ส.ค.) + layout `lay-split-3zone` | ⚠️ จอกลับมาแล้วโซน content จะ**ว่าง** — Admin ต้องกำหนดเนื้อหาใหม่ (ข้อ 4) |
| Schedule `sch-002` | “Dining Hall Lunch Hours Menu” จ-ศ 11:00–18:00 (อ้าง playlist เดียวกับข้างบน) | นอกเวลา/นอกวัน → จอแสดง default |

---

## 2. ใครทำอะไร

| บทบาท | หน้าที่ |
|---|---|
| **ช่าง (หน้างาน)** | ตรวจไฟ/สาย → เปิดจอ → เช็คเน็ต → เปิด URL → (HTTPS) ติดตั้ง CA ถ้าจำเป็น |
| **Admin (หลังระบบ)** | สร้าง URL/token ใหม่ให้ช่าง → หลังจอกลับ: กำหนดเนื้อหาใหม่ + ตรวจ monitoring |

---

## 3. ขั้นตอนช่างหน้างาน (ทำที่จอ — ไม่ต้องแตะ server)

### ขั้นที่ 1 — เช็คอุปกรณ์จริง
- [ ] สายไฟจอ / สาย HDMI (ถ้ามีกล่อง) / สายแลน หรือ Wi-Fi — ดูว่าหลุด/ปิดอยู่ไหม
- [ ] เปิดจอ → รอให้ boot เสร็จ (จอ Android TV / Windows)

### ขั้นที่ 2 — เช็คว่าจอต่อถึง server ได้
- [ ] เปิดเบราว์เซอร์บนจอ → เปิด `http://10.70.0.1:3100/api/health`
- [ ] ควรเห็นข้อความ JSON ขึ้นต้น `{"status":"ok"...}` → แปลว่าต่อถึง server แล้ว
- [ ] ถ้าเปิดไม่ได้ → เช็ค Wi-Fi/สายแลนอีกครั้ง (ต้องอยู่เครือข่ายเดียวกับ server)

### ขั้นที่ 3 — เปิดหน้าจอแสดงผล (URL จาก Admin)
- รับ URL จาก Admin (โหมด HTTPS — ขึ้นต้น `https://10.70.0.1/display/scr-002?token=...`)
- เปิดในเบราว์เซอร์ แล้วรอให้แสดงเนื้อหาเต็มจอ

**ถ้าเจอคำเตือน “Your connection is not private / การเชื่อมต่อไม่เป็นส่วนตัว”** (โหมด HTTPS ปกติ):
- จอ Windows → ติดตั้ง CA ตัวปัจจุบัน: copy `caddy-root-ca.crt` (จาก `\\10.70.0.1\c\signage\caddy\`) → ดับเบิลคลิก → Install Certificate → Local Machine → Trusted Root Certification Authorities → Finish → ปิด/เปิดเบราว์เซอร์ใหม่
- จอ Android TV → ใช้แอป native player (`android-player/`) ที่ฝัง CA ไว้แล้ว ตั้ง Server URL = `https://10.70.0.1` — **ไม่ต้องติดตั้ง CA**
- หรือแจ้ง Admin ใช้โหมด HTTP ให้ (จอเล่นได้ปกติ แต่ไม่แคช offline)

### ขั้นที่ 4 — ตรวจว่าเนื้อหาขึ้น
- [ ] จอแสดงภาพ/วิดีโอ (หรือหน้าจอฟ้า “Display Ready” ถ้ายังไม่มีเนื้อหา — ปกติ รอ Admin กำหนดในข้อ 4)

---

## 4. ขั้นตอน Admin (หลังช่างแจ้งว่าจอเปิดได้แล้ว)

### 4.1 สร้าง URL ใหม่ให้ช่าง
- หน้า Admin → จอ → scr-002 → **สร้างลิงก์/QR** (หรือ `POST /api/display/generate-token`) — ผ่าน `https://10.70.0.1` เพื่อให้ URL เป็น `https://10.70.0.1/display/scr-002?token=...`
- ⚠️ จอที่เคยผูก token เก่า (ก่อน 12 ส.ค. — JWT_SECRET เปลี่ยน) ต้องใช้ URL ใหม่นี้เสมอ

### 4.2 กำหนดเนื้อหาใหม่ ✅ (ทำเสร็จแล้ว 15 ส.ค. 2026)
- ✅ สร้าง **`pl-cafeteria-menu`** (approved, 3 items: เมนู + ticker + ประกาศ) + ตั้ง tags `cafeteria`+`menu` ให้ scr-002 + ผูก **`lay-menu-board`** (Full Screen Menu Board)
- ✅ แก้ **`sch-002`** เดิมชี้ playlist ว่าง → ชี้ `pl-cafeteria-menu` + `lay-menu-board` (จ-ศ 11:00–18:00 โชว์เมนู ไม่จอว่าง)
- ✅ ตรวจผ่าน: display data scr-002 → `tag_match` + `effectivePlaylistId=pl-cafeteria-menu` + layout lay-menu-board — จออื่นไม่ถูกแย่ง
- หมายเหตุ: content ต้อง `approved + published` ถึงจะขึ้นจอ (Content Approval Workflow) — ถ้าจะเปลี่ยนเนื้อหาอีก ให้ทำ playlist ใหม่ + approve แล้วตั้งให้จอ/แก้ schedule

### 4.3 ตรวจว่าจอกลับมา online
- หน้า Admin → จอทั้งหมด → scr-002 ควรเป็น **online** (จุดเขียว) + heartbeat สด
- หรือรัน `watch-screen-online.bat` (ตั้งค่า default `scr-002` อยู่แล้ว — ที่เครื่อง dev ตั้ง `WATCH_API_BASE=http://10.70.0.1:3100` ก่อนรัน) → จะแจ้งเองเมื่อจอกลับมา

---

## 5. ปัญหาที่พบบ่อย

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| เปิด `http://10.70.0.1:3100/api/health` ไม่ได้ | จออยู่นอกเครือข่าย server | เช็ค Wi-Fi/สายแลน — ต้องต่อถึง 10.70.0.1 |
| เปิด `https://` แล้วคำเตือน cert | จอยังไม่ติดตั้ง CA ตัวปัจจุบัน | ติดตั้ง `caddy-root-ca.crt` ใหม่ หรือใช้ native player |
| จอขึ้นแต่เนื้อหาไม่มา / จอว่าง | playlist ถูกกำหนดไว้ว่าง (0 items) | Admin ทำข้อ 4.2 (tag-match หรือ playlist ใหม่ + approve) |
| ใส่ `CAFE-20` แล้ว “รหัสผิด” | พิมพ์ผิด หรือรหัสถูกใช้งานแล้ว | ขอ pairing code ใหม่จาก Admin (หน้า Admin → จอ) |
| จอขึ้น “Display Error” | token เก่าหมดอายุ | ใช้ URL/token ใหม่จาก Admin (ข้อ 4.1) |

---

*อ้างอิง: `docs/screen-install-guide.md` (ติดตั้งจอฉบับเต็ม), `caddy/TRUST-CA.md` (ติดตั้ง CA), `docs/change-admin-password.md`*
