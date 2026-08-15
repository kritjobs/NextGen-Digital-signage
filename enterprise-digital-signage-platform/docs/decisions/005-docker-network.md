# ADR-005: Docker Network Strategy

**วันที่:** 2026-08-04  
**สถานะ:** Accepted

## บริบท

เครื่อง host มี Docker network `thaihua-network` ที่ services ทั้งหมดใช้ร่วมกัน  
ต้องตัดสินใจว่า signage-app จะเชื่อมต่ออย่างไร

## ตัวเลือกที่พิจารณา

**Option A: ใช้ `thaihua-network` (external network)**
```yaml
networks:
  thaihua-network:
    external: true
```
- เข้าถึง thaihua-postgres, thaihua-redis ได้ทันที
- เข้าถึง thaihua-auth-service ได้ (สำหรับ future auth integration)

**Option B: สร้าง network ใหม่ `signage-network`**
- Isolated สมบูรณ์
- ต้องสร้าง port mapping เพื่อเชื่อม thaihua-postgres

## การตัดสินใจ

**เลือก Option A** — ใช้ `thaihua-network` external

## ผลที่ตามมา

### ข้อดี
- resolve `thaihua-postgres`, `thaihua-redis` ด้วยชื่อได้ทันที
- ไม่ต้อง expose DB port ออก host เพิ่ม
- Future: integrate กับ `thaihua-auth-service` สำหรับ SSO

### ข้อระวัง
- signage-app เห็น services อื่นใน network ทั้งหมด — ต้องระวัง security
- ถ้า thaihua-network ถูกลบ/เปลี่ยนชื่อ → signage-app start ไม่ได้
- ต้องรัน `docker network create thaihua-network` ก่อนถ้า deploy ใน environment ใหม่

### การตรวจสอบ

```bash
# ตรวจสอบ network มีอยู่
docker network ls | grep thaihua-network

# ตรวจสอบ services ที่อยู่ใน network
docker network inspect thaihua-network --format '{{range .Containers}}{{.Name}} {{end}}'
```
