# ADR-002: Database Strategy

**วันที่:** 2026-08-04  
**สถานะ:** Accepted

## บริบท

ต้องเลือกว่าจะใช้ PostgreSQL container อย่างไร มี 2 แนวทางหลัก

## ตัวเลือกที่พิจารณา

**Option A: ใช้ `thaihua-postgres` ที่มีอยู่แล้ว + สร้าง database ใหม่**
- เชื่อมต่อผ่าน `thaihua-network` ได้ทันที
- ประหยัด memory/CPU (ไม่รัน Postgres ซ้ำ)
- ง่ายกว่า — ไม่ต้องจัดการ container ใหม่

**Option B: สร้าง Postgres container ใหม่แยกต่างหาก (port 5433)**
- Isolated สมบูรณ์
- ไม่กระทบ thaihua databases เลย
- ต้อง manage container เพิ่ม

## การตัดสินใจ

**เลือก Option A** — ใช้ `thaihua-postgres` + สร้าง database `signage_db` แยก

## ผลที่ตามมา

### ข้อดี
- Resource ต่ำกว่า (ไม่รัน Postgres ซ้ำ)
- Network ง่าย — ใช้ `thaihua-network` ได้ทันที
- Backup ครอบคลุมโดย infra ของ thaihua อยู่แล้ว

### ข้อระวัง
- ถ้า `thaihua-postgres` ล่ม จะกระทบ signage ด้วย
- ต้องระวังไม่ให้ query ของ signage กระทบ performance ของ thaihua databases อื่น
- ใช้ connection pool max=20 ไม่ให้กิน connections มากเกิน
- password ของ postgres ต้องตรงกับ thaihua-postgres เสมอ

### การ Migrate ไป Option B (ถ้าจำเป็น)
ถ้าในอนาคตต้องการ isolated environment:
```bash
# สร้าง Postgres ใหม่
docker run -d --name signage-postgres \
  -p 5433:5432 \
  -e POSTGRES_DB=signage_db \
  -e POSTGRES_PASSWORD=<new_password> \
  --network thaihua-network \
  postgres:15-alpine

# Migrate ข้อมูล
pg_dump -h thaihua-postgres -U postgres signage_db | \
  psql -h localhost -p 5433 -U postgres signage_db
```
