# ADR-003: ORM Selection

**วันที่:** 2026-08-04  
**สถานะ:** Accepted

## บริบท

ต้องเลือก ORM/query builder สำหรับเชื่อมต่อ PostgreSQL ใน Node.js + TypeScript

## ตัวเลือกที่พิจารณา

| รายการ | Drizzle ORM | Prisma | node-postgres (raw pg) |
|--------|-------------|--------|----------------------|
| Bundle size | เล็กมาก (~50KB) | ใหญ่ (Prisma Client) | เล็ก |
| TypeScript | ✅ Type-safe native | ✅ Generated types | ❌ Manual |
| Migration | drizzle-kit (SQL) | prisma migrate | Manual SQL |
| Learning curve | ต่ำ | กลาง | ต่ำ |
| SQL-like API | ✅ ใกล้เคียง SQL | ❌ Prisma syntax | ✅ Raw SQL |
| Performance | สูง | กลาง | สูงสุด |
| Edge runtime | ✅ | บางส่วน | ❌ |

## การตัดสินใจ

**เลือก Drizzle ORM** เพราะ:
1. TypeScript-first — types ถูก generate จาก schema โดยตรง
2. Bundle size เล็ก — เหมาะกับ Express app
3. SQL-like API — เข้าใจง่ายสำหรับคนที่รู้ SQL
4. Fast migration — `drizzle-kit` สร้าง `.sql` migration files ที่อ่านได้

## ผลที่ตามมา

### ข้อดี
- Schema definition ใน TypeScript → auto type inference
- Migration files เป็น plain SQL — audit ได้ง่าย
- ไม่ต้องรัน Prisma generate ก่อน build

### ข้อระวัง
- Community เล็กกว่า Prisma (แต่กำลังโต)
- ถ้าต้องการ GUI database browser ต้องใช้ `drizzle-kit studio` หรือ TablePlus แยก

### Dependencies ที่ต้องติดตั้ง
```bash
bun add drizzle-orm pg
bun add -d drizzle-kit @types/pg
```
