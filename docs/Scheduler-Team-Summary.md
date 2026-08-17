# 📋 สรุปงาน — Scheduler Engine (ตารางเวลาออกอากาศ)

**ช่วงเวอร์ชัน:** 0.4.20 → 0.4.30 (2026-08-16)
**สถานะ:** พัฒนาเสร็จ + ทดสอบครบบน dev · commit แล้ว · **ยังไม่ได้ sync ขึ้น production**
**รายละเอียดต่อเวอร์ชัน:** ดู [`CHANGELOG.md`](../enterprise-digital-signage-platform/CHANGELOG.md) · Work Log ใน [`AGENTS.md`](../AGENTS.md)

---

## ฟีเจอร์หลัก (6 กลุ่ม)

### 1. มุมมองแบบ Google Calendar
- **Day / Week / Month / List view** สลับได้ · ไฮไลต์สัปดาห์ปัจจุบัน · เส้นเวลาปัจจุบันเคลื่อนเรียลไทม์ทุกนาที (ไม่ต้อง reload)
- **Week strip** ใต้กริดเดือน: เส้นเวลา 7 วัน · คลิกคอลัมน์ = กรองเฉพาะวันนั้น · ย่อ/ขยายความสูง · ลากได้ 2 ทิศทาง (ชิปเดือน → strip = ตั้งวัน+เวลา, บล็อก strip → กริดเดือน = เปลี่ยนวัน)

### 2. ลากอีเวนต์ครบทุกรูปแบบ
- ย้าย / ขยาย (resize) / เปลี่ยนวันในทุก view · ลากข้ามเดือนไกลได้ด้วย **auto-scroll** (ขยายแถวเดือนอัตโนมัติ) · วางบน legend = เปลี่ยนเพลย์ลิสต์
- **Alt+ลาก = คัดลอกกฎใหม่** · **Shift = snap ชั่วโมงเต็ม** (แทน 15 นาที)
- **Multi-select** (Ctrl/Shift+คลิก) ลากทั้งกลุ่มพร้อมกัน — selection อยู่รอดข้าม view

### 3. Undo/Redo ครบวงจร
- ย้อนกลับได้ทุกแบบ: ลาก / ฟอร์ม (สร้าง-แก้ไข-ลบ) / สีเพลย์ลิสต์ / import / กู้คืน — **เก็บใน store อยู่รอดข้ามแท็บ**
- **ซิงก์ข้ามแท็บ** (BroadcastChannel) — แท็บหนึ่ง undo อีกแท็บอัปเดตตาม
- dropdown ประวัติแสดง **ก่อน→หลัง** + คลิก jump ไปกฎ · **ปุ่มขั้นตอนใหญ่** (ย้อนทั้งกลุ่มที่แก้ต่อเนื่องกัน) + badge แสดงจำนวน + **คลิกขวาเลือกย้อนเฉพาะบางรายการ**

### 4. Import / Export / สำรอง
- **Export JSON** รวมประวัติ · **Import ไฟล์ต่างระบบ** (schema mapping อัตโนมัติ) พร้อม **diff preview** (ค้นหา + ติ๊กเลือกเฉพาะกฎก่อนเขียน) · **ลาก/วางไฟล์ลงหน้าทั้งหมด** ได้เลย
- **Restore Points ลง DB** — สแนปชอตซิงก์ข้ามเครื่อง (เปิดจากเครื่องอื่นกู้ได้) · localStorage เดิมเป็น fallback

### 5. โหมดทดลอง (sandbox)
- กด "ทดลอง" → **สแนปชอตอัตโนมัติ + undo ไม่จำกัด** → จบด้วย **Commit / Revert**
- **Visual diff** — สรุปการเปลี่ยนแปลง + ไฮไลต์กฎที่เปลี่ยน (ring เขียว) ระหว่างทดลอง

### 6. ซิงก์เรียลไทม์ข้ามแท็บ
- view / วันที่ / การเลือกหลายอีเวนต์ · **การลากสด (ghost)** — แท็บอื่นเห็นบล็อก/ชิปเลื่อนตามตำแหน่งจริง ครบ move / resize / วาง legend

---

## 🐛 บั๊กสำคัญที่เจอและแก้ระหว่างพัฒนา
- **PATCH เขียน DB เรียงสลับกัน** ตอนย้อน/ทำซ้ำหลายขั้นตอน → serialize รอทีละตัว (store คืน Promise → await)
- **import ที่เพิ่มกฎล้วน ๆ ไม่สร้าง history entry** → Ctrl+Z ไม่ทำงาน (แก้ `sectionChanged` ให้ตรวจจับ id ใหม่)
- **undo สีเพลย์ลิสต์ไม่คืนค่า** (`undefined` โดน `JSON.stringify` ทิ้ง) → ส่ง `color ?? ''`
- **กฎจาก DB เวลา `HH:MM:SS` ชน `CreateScheduleSchema`** (ต้องการ HH:MM) → normalize `slice(0,5)` ตอนสร้าง/คัดลอก
- **remote resize ghost ใช้ `curMin` เป็น top** (บล็อกกระโดดตาม cursor) → ยึด top เดิมในโหมด resize

---

## การเปลี่ยนแปลงฝั่ง server/DB (ที่ต้อง migrate)
| รายการ | migration | ไฟล์ |
|---|---|---|
| คอลัมน์ `playlists.color` (hex, กำหนดเองใน Scheduler legend) | `0012` | `src/db/migrations/0012_*.sql` |
| ตาราง `scheduler_snapshots` (restore points ข้ามเครื่อง) | `0013` | `src/db/migrations/0013_*.sql` |
| API `/api/scheduler-snapshots` GET/POST/DELETE (auth + `read/write:schedules` + audit log) | — | `server.ts` + `src/services/api.ts` |

> ⚠️ การ migrate ทำงานอัตโนมัติผ่าน container `signage-migrate` ตอน `redeploy.bat` แต่**ควรตรวจตาราง/คอลัมน์หลัง deploy** (ดู checklist)

---

## ✅ สถานะการตรวจ
- typecheck **0 errors** · build **ผ่าน** · integration test **18/18**
- i18n ครบ **3 ภาษา** (EN / ไทย / 中文) — ทุกคีย์ใหม่เพิ่มครบทั้ง 3 ไฟล์
- dev data กลับ baseline แล้ว (sch-001/002 = จ-ศ, sch-003 = ทุกวัน 06:00–22:00, สีเพลย์ลิสต์ว่าง, ไม่มีกฎเทส, snapshots ว่าง)
- มี CHANGELOG + Work Log (AGENTS.md) + tasks.md อัปเดตทุกรอบ

---

## 📦 สิ่งที่ยังต้องทำ
- ⏳ **sync ขึ้น production** — ดู [`docs/Prod-Sync-Checklist.md`](./Prod-Sync-Checklist.md)
- ยังไม่ได้ commit / sync prod (สถานะ ณ 2026-08-17)
