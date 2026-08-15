# ADR-004: State Management Strategy

**วันที่:** 2026-08-04  
**สถานะ:** Accepted

## บริบท

ระบบมี state ที่ซับซ้อน: screens, media, playlists, schedules, emergency alerts, telemetry  
และต้องการ realtime updates จาก WebSocket + future API calls

## ตัวเลือกที่พิจารณา

1. **Zustand** (เลือก) — lightweight, TypeScript-friendly
2. **Redux Toolkit** — verbose, boilerplate มาก
3. **React Context** — ไม่เหมาะกับ state ซับซ้อน + re-render บ่อย
4. **Jotai/Recoil** — atomic state, ดีแต่ ecosystem เล็กกว่า

## การตัดสินใจ

**ใช้ Zustand** เป็น single store พร้อม selectors

## Architecture

```
useSignageStore (Zustand)
  ├── State: screens[], mediaItems[], playlists[], ...
  ├── CRUD Actions: addScreen, updateScreen, deleteScreen, ...
  ├── Emergency Actions: triggerEmergency, clearEmergency
  ├── Command Actions: sendCommandToScreen
  └── Telemetry: addTelemetryLog, recordProofOfPlay

Data Flow:
  1. Initial load: seed data (dev) หรือ API fetch (production)
  2. User action → store action → optimistic UI update
  3. WebSocket event → store action → UI re-render
  4. API success → store confirmed update
  5. API error → rollback store state
```

## ผลที่ตามมา

### ข้อดี
- Boilerplate น้อย — action + state ใน file เดียว
- Selector ป้องกัน unnecessary re-renders
- DevTools extension รองรับ Zustand

### ข้อระวัง
- State เป็น in-memory ตอนนี้ — refresh หน้า = ข้อมูลหาย
- เมื่อ DB layer พร้อม ต้องเพิ่ม `initialLoad()` action ดึงข้อมูลจาก API
- ต้องระวัง race condition ระหว่าง WebSocket events + API responses
