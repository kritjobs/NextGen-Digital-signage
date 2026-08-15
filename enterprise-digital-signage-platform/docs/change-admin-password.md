# 🔐 เปลี่ยนรหัส Admin (Password Management)

> ตั้งแต่ 2026-08-15: **ไม่มีรหัส default อีกต่อไป** — `Admin@2026!` ถูกถอนออกจากโค้ด/seed/เอกสารทั้งหมด

## วิธีที่ 1 — ผ่าน Web UI / API (แนะนำ สำหรับ admin ที่ login ได้อยู่)

```http
POST /api/auth/change-password
Authorization: Bearer <token>

{
  "currentPassword": "<รหัสเดิม>",
  "newPassword": "<รหัสใหม่>"
}
```

- ต้องส่งรหัสเดิมถูกต้อง → ไม่งั้น 401
- **ห้ามใช้รหัส default** (`Admin@2026!`) → 400
- รหัสใหม่ต้อง: ≥8 ตัว + พิมพ์ใหญ่ + พิมพ์เล็ก + ตัวเลข
- เปลี่ยนสำเร็จ → revoke refresh token ทุกเครื่อง → บังคับล็อกอินใหม่ทั้งหมด

## วิธีที่ 2 — สคริปต์เปลี่ยนรหัส (ใช้เมื่อ login ไม่ได้ / รีเซ็ตรหัสลืม)

ที่เครื่อง prod (`C:\signage`) หรือเครื่อง dev (มี node + เชื่อม DB ได้):

```bat
change-admin-password.bat  <email>  <new-password>
REM ตัวอย่าง:
change-admin-password.bat  admin@signage.local  "MyNew!Pass123"
```

หรือรัน node script ตรง:

```bash
DATABASE_URL="postgresql://signage_admin:SignageSecure2026!@localhost:5433/signage_db" \
  node scripts/change-password.mjs admin@signage.local "MyNew!Pass123"
```

- กันใช้รหัส default + บังคับความแข็งแรงเหมือน API
- **⚠️ prod:** ใช้ `10.70.0.1:5433` แทน `localhost:5433` ถ้ารันจากเครื่องอื่น

## วิธีที่ 3 — ตอน seed ใหม่ (สร้าง DB ใหม่)

ตั้ง env ก่อนรัน `npm run db:seed`:

```bash
export ADMIN_INITIAL_PASSWORD="MyStrong!Pass1"
export STAFF_INITIAL_PASSWORD="..."
export VIEWER_INITIAL_PASSWORD="..."
```

ถ้าไม่ตั้ง → **สุ่มอัตโนมัติ** (ไม่พิมพ์ออกมาใน log) → เปลี่ยนทีหลังด้วยวิธี 1/2

## หลังเปลี่ยนรหัส

1. ทดสอบ login ด้วยรหัสใหม่
2. อัปเดต `TEST_ADMIN_PASSWORD` ใน `.env` (dev) ถ้ารัน integration tests
3. บอกทีม/user ให้ใช้รหัสใหม่ — รหัสเก่าใช้ไม่ได้ทันที

## ความปลอดภัยอื่นที่เกี่ยวข้อง

- `JWT_SECRET` — ตั้งใน `.env` prod แล้ว (64 hex)
- `WEBHOOK_TOKEN` — ระบบภายนอกที่เรียก `/api/trigger` ต้องส่ง header นี้
- อย่าเก็บ password ลงใน repo/git — ถ้าเผลอ push ให้เปลี่ยนรหัสใหม่ทันที
