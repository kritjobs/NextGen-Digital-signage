# ADR-001: Port Selection

**วันที่:** 2026-08-04  
**สถานะ:** Accepted

## บริบท

เครื่อง host มี `thaihua-smart-school` ทำงานอยู่ และ port หลายตัวถูกครองแล้ว  
โดยเฉพาะ port `3000` ถูกใช้โดย `thaihua-auth-service`

## ตัวเลือกที่พิจารณา

1. ใช้ port `3000` ทับ thaihua-auth-service (หยุด service เดิม)
2. ใช้ port `8080` (ทั่วไป แต่อาจชนกับ service อื่นในอนาคต)
3. ใช้ port `3100` (ยังไม่มีใครใช้ + อยู่ในช่วง 3xxx เดียวกัน)

## การตัดสินใจ

**เลือก port `3100`** สำหรับ signage-app

## ผลที่ตามมา

### ข้อดี
- ไม่กระทบ services อื่นที่รันอยู่
- อยู่ในช่วง port เดียวกับ services อื่น (3000–3020) อ่านง่าย

### ข้อระวัง
- ต้องตั้ง `APP_PORT=3100` ใน `.env.local` ทุกครั้ง
- ถ้าเพิ่ม service ใหม่ใน thaihua ต้องตรวจสอบไม่ให้ชน 3100
- nginx config ต้อง proxy ไป 3100 ถ้าต้องการ route ผ่าน subdomain
