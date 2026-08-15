# HikCentral FocSign Feature Analysis — สำหรับ NextGen Digital Signage Platform
**วันที่วิเคราะห์:** 8 สิงหาคม 2026  
**แหล่งข้อมูล:** [Hikvision FocSign](https://display.hikvision.com/apac/products/software/hikcentral-focsign/)  
**วัตถุประสงค์:** ศึกษาแนวคิด signage ที่มาจาก security/surveillance ecosystem  
**หมายเหตุ:** Hikvision เป็น #1 video surveillance ของโลก — FocSign เป็น signage module ใน HikCentral Professional ecosystem ที่เชื่อมกับ CCTV, Access Control, Video Intercom ทั้งหมด

---

## ทำไม HikCentral FocSign ต่างจากทุก Platform

FocSign ไม่ได้เกิดมาเป็น "digital signage platform" แต่เป็น **module ใน security/building management ecosystem** — จุดแข็งคือ **integration กับ CCTV, Access Control, และ Building Systems** ที่ platform อื่นไม่มี

---

## 1. Integration กับ Video Surveillance (CCTV)

**คำอธิบาย:** FocSign อยู่ใน HikCentral Professional ที่จัดการ CCTV ด้วย:
- แสดง CCTV live feed บนจอ signage ได้ทันที
- เมื่อเกิดเหตุ (alarm) → จอเปลี่ยนแสดง camera feed ที่เกี่ยวข้อง
- Video wall แสดงทั้ง signage + CCTV ได้พร้อมกัน
- Switch ระหว่าง signage mode กับ surveillance mode

**ตัวอย่าง:**
- ปกติ: จอ lobby แสดง welcome message
- ไฟ alarm ดัง → จอเปลี่ยนเป็น CCTV feed ของจุดที่เกิดเหตุ + คำแนะนำอพยพ
- สิ้นสุด alarm → กลับเป็น signage ปกติ

**ต่างจาก platform อื่น:** ไม่มี platform signage ใดที่ integrate กับ CCTV/VMS ได้โดยตรง

**ประโยชน์สำหรับเรา:** สำหรับ security-conscious deployments (อาคาร, โรงงาน, campus) — จอ signage ทำหน้าที่ emergency display แสดง camera feed ได้เมื่อจำเป็น

**ระดับความยาก:** สูง  
**Impact:** กลาง-สูง (security integration use case)

---

## 2. Integration กับ Access Control

**คำอธิบาย:** เชื่อมกับระบบ Access Control ใน HikCentral:
- แสดงชื่อ/รูปผู้เข้าอาคาร (welcome display)
- ผู้เยี่ยมชม scan → จอแสดง wayfinding ไปจุดหมาย
- Time & Attendance data → แสดงบนจอ (ใครมาทำงาน/ไม่มา)
- Event-triggered: ประตูเปิด → จอแสดง welcome + info

**ประโยชน์สำหรับเรา:** ถ้า platform ของเรา integrate กับ access control systems (HID, Suprema, etc.) → สร้าง "personalized welcome experience" ที่จอ lobby ได้

**ระดับความยาก:** สูง  
**Impact:** กลาง (building management use case)

---

## 3. Cut-to-Display (Super-Wide/Extra-Tall Content Splitting)

**คำอธิบาย:** เมื่อ content ใหญ่กว่าที่ controller จอจะรับได้:
- ระบบ auto-split content เป็นส่วนๆ
- แต่ละส่วน → ส่งไปแต่ละ controller
- ประกอบกลับ (reassemble) เป็นภาพเดียวบนจอ
- รองรับ super-wide LED (เช่น 10 เมตร) หรือ extra-tall (column LED)

**ต่างจาก Samsung VXT SyncPlay หรือ Yodeck Video Wall:**
- อื่นๆ: ใช้ 1 player ต่อ 1 section → sync ระหว่าง players
- FocSign: software-level split → หลาย controllers → reassemble (ไม่ต้อง manual crop content)

**ประโยชน์สำหรับเรา:** สำหรับ LED installations ขนาดใหญ่ที่ไม่ได้เป็น standard 16:9 — ระบบ auto-crop ให้ไม่ต้อง prepare content เฉพาะ

**ระดับความยาก:** สูง  
**Impact:** กลาง (large LED installations)

---

## 4. Emergency Cut-In Schedule (Instant Override)

**คำอธิบาย:** กำหนด "cut-in schedule" ที่ activate ทันทีเมื่อเกิดเหตุฉุกเฉิน:
- Pre-configure emergency content + target screens
- เมื่อ trigger → ตัดเข้าทันทีไม่ต้องรอ
- เชื่อมกับ fire alarm, intrusion alarm, emergency systems
- Automatic (ไม่ต้อง manual กดปุ่ม)

**ต่างจาก Emergency Alert ของ platform อื่น:**
- Yodeck/Appspace: Admin กดปุ่ม Emergency manual
- FocSign: **Auto-trigger** จาก alarm system โดยตรง (ไม่ต้องมีคนกด)

**ประโยชน์สำหรับเรา:** Emergency ที่ trigger อัตโนมัติจาก external system — ลดเวลา response จาก "คนต้องกด" เป็น "ระบบ trigger เอง"

**ระดับความยาก:** กลาง  
**Impact:** สูง (safety automation)

---

## 5. Batch Device Management (สำหรับ LED/Commercial Displays)

**คำอธิบาย:** จัดการ display devices เป็นกลุ่ม:
- Batch copy parameters (ตั้งค่าเดียว apply ทุกจอ)
- Screen display settings: brightness, boot logo, screen direction
- Volume schedule settings (ระดับเสียงตามเวลา)
- Unlocking screen settings
- สูงสุด 1,024 devices ต่อ platform

**ประโยชน์สำหรับเรา:** สำหรับ deployment ที่มีจอเหมือนกันหลายจุด — ตั้งค่าครั้งเดียว clone ไปทุกจอ

**ระดับความยาก:** ต่ำ-กลาง  
**Impact:** กลาง (operational efficiency)

---

## 6. Video Wall ↔ Single Screen Toggle

**คำอธิบาย:** สลับระหว่าง "video wall mode" กับ "individual screen mode" ได้ทันที:
- ปกติ: 4 จอเป็น video wall แสดง content ใหญ่
- เมื่อต้องการ: แยก 4 จอแสดง content คนละอัน
- Toggle ได้จาก CMS ไม่ต้อง rewire hardware

**ตัวอย่าง:**
- ห้องประชุม: ปกติ = 4 จอเป็น video wall แสดง dashboard
- ระหว่างประชุม: แยกเป็น 4 จอแสดง data 4 แผนก
- จบประชุม: กลับเป็น video wall

**ประโยชน์สำหรับเรา:** Flexibility สำหรับ meeting rooms / command centers — ไม่ต้องเลือกระหว่าง "video wall ถาวร" หรือ "จอแยกถาวร"

**ระดับความยาก:** กลาง-สูง  
**Impact:** กลาง (specific use case)

---

## 7. Lightweight / On-Premise Architecture

**คำอธิบาย:** FocSign ออกแบบเป็น lightweight platform ที่ run บน local server:
- ทำงานบน common web browser (ไม่ต้อง install desktop client)
- Mobile app สำหรับ remote management (Android + iOS)
- Minimum hardware requirements
- On-premise only (ไม่ใช่ cloud)
- Free version available (จำกัด features)

**ประโยชน์สำหรับเรา:** ยืนยันว่า on-premise option สำคัญ (เช่นเดียวกับ Navori) — โดยเฉพาะลูกค้าที่ไม่ต้องการ cloud

**ระดับความยาก:** กลาง  
**Impact:** กลาง (deployment flexibility)

---

## สรุปจัดลำดับความสำคัญ

| ลำดับ | ฟีเจอร์ | ระดับความยาก | Impact | หมวด |
|-------|---------|-------------|--------|------|
| 1 | Auto Emergency from Alarm System | กลาง | สูง | Safety |
| 2 | CCTV Integration (Camera Feed on Signage) | สูง | กลาง-สูง | Security |
| 3 | Cut-to-Display (Auto Content Split) | สูง | กลาง | LED/Video Wall |
| 4 | Video Wall ↔ Single Screen Toggle | กลาง-สูง | กลาง | Flexibility |
| 5 | Access Control Integration | สูง | กลาง | Building Mgmt |
| 6 | Batch Device Management | ต่ำ-กลาง | กลาง | Operations |
| 7 | On-Premise Lightweight | กลาง | กลาง | Deployment |

---

## Key Takeaways จาก HikCentral FocSign

### สิ่งที่เราเรียนรู้จาก Hikvision's approach:

1. **Signage as Part of Building Ecosystem** — ไม่ใช่ standalone แต่เป็น module ที่ integrate กับ CCTV, Access Control, Fire Alarm → เปิด use cases ใหม่ที่ signage-only platforms ทำไม่ได้

2. **Auto-Trigger Emergency from Physical Systems** — เชื่อม fire alarm → จอแสดง evacuation path อัตโนมัติ ไม่ต้องรอคนกด — ลด response time อย่างมีนัยสำคัญ

3. **CCTV + Signage Convergence** — จอเดียวทำได้ทั้ง signage + surveillance display → ลด hardware cost + ใช้จอให้คุ้มค่ากว่า

4. **Hardware-Manufacturer Perspective (เหมือน Samsung VXT)** — เมื่อผู้ผลิต hardware ทำ software เอง จะได้ deep integration ที่ third-party ทำไม่ได้

### แนวคิดสำหรับ NextGen Platform:

```
NextGen = Digital Signage + [ส่วนที่เพิ่ม]

Option A: Signage + Security Integration
  → ต่อ CCTV, Access Control, Fire Alarm
  → จอ signage = emergency display + welcome display
  → เหมาะ: อาคาร, campus, โรงงาน

Option B: Signage + Workplace Integration  
  → ต่อ Room Booking, Calendar, HR systems
  → จอ signage = workplace communication hub
  → เหมาะ: offices, co-working spaces

Option C: Signage + Retail Integration
  → ต่อ POS, Inventory, AI Analytics
  → จอ signage = dynamic merchandising tool
  → เหมาะ: ร้านค้า, ร้านอาหาร, ห้าง
```

**คำแนะนำ:** ออกแบบ platform ให้มี "integration layer" ที่เปิดให้เชื่อมกับ external systems ได้ง่าย — ไม่ว่าจะเป็น security, workplace, หรือ retail

---

## สรุปรวม 11 Platforms ที่วิเคราะห์

| # | Platform | Category | Unique Angle |
|---|----------|----------|-------------|
| 1 | Bizplay | Cloud CMS | Simplicity |
| 2 | Appspace | Enterprise CMS | AI + Workplace |
| 3 | ScreenCloud | Enterprise CMS | IT Security + Live |
| 4 | Yodeck | Cloud CMS | Value + Priority Logic |
| 5 | OptiSigns | Cloud CMS | Interactive + AI Audience |
| 6 | Samsung VXT | Hardware + CMS | Energy + ISO + SyncPlay |
| 7 | BrightSign | Hardware Player | State Machine + Reliability |
| 8 | Navori | Enterprise + DooH | Composable + Monetization |
| 9 | Broadsign | Ad Operations | Programmatic OOH Exchange |
| 10 | TelemetryTV | Developer-focused CMS | Git + Tags + IPTV |
| 11 | **HikCentral FocSign** | **Security Ecosystem** | **CCTV + Access Control + Auto-Emergency** |

---

*วิเคราะห์จาก: Hikvision official documentation และ product pages*  
*Content was rephrased for compliance with licensing restrictions*