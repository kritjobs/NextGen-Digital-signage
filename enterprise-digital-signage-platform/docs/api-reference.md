# API Reference — REST & WebSocket

อัปเดตล่าสุด: 2026-08-04  
Base URL: `http://localhost:3100`  
WebSocket: `ws://localhost:3100/ws`

---

## 1. REST API

### Convention

| รายการ | ค่า |
|--------|-----|
| Content-Type | `application/json` |
| Date format | ISO 8601: `2026-08-04T10:34:00.000Z` |
| ID format | `VARCHAR(50)` เช่น `scr-001`, `med-001` |
| Error format | `{ "error": "message", "code": "ERROR_CODE" }` |

---

### 1.1 System

#### `GET /api/health`
ตรวจสอบสถานะระบบ

**Response 200:**
```json
{
  "status": "ok",
  "service": "Enterprise Digital Signage Engine",
  "uptime": 3820.5,
  "connectedClients": 3,
  "database": "connected",
  "timestamp": "2026-08-04T10:34:00.000Z"
}
```

---

### 1.2 Emergency

#### `POST /api/emergency/trigger`
เปิดสัญญาณฉุกเฉินทุกจอ (broadcast ผ่าน WebSocket)

**Request Body:**
```json
{
  "title": "FIRE EVACUATION WARNING",
  "message": "PLEASE EVACUATE THE BUILDING IMMEDIATELY.",
  "type": "fire",
  "severity": "critical",
  "targetScreenIds": []
}
```

| Field | Type | Required | ค่า |
|-------|------|----------|-----|
| `title` | string | ❌ | default: `"EMERGENCY BROADCAST ALERT"` |
| `message` | string | ❌ | default: `"ATTENTION ALL OCCUPANTS..."` |
| `type` | string | ❌ | `fire`, `weather`, `lockdown`, `custom`, `all-clear` |
| `severity` | string | ❌ | `critical`, `warning`, `info` |
| `targetScreenIds` | string[] | ❌ | `[]` = ทุกจอ |

**Response 200:**
```json
{
  "success": true,
  "alert": {
    "id": "emg-1722765240000",
    "title": "FIRE EVACUATION WARNING",
    "message": "PLEASE EVACUATE THE BUILDING IMMEDIATELY.",
    "type": "fire",
    "severity": "critical",
    "targetScreenIds": [],
    "active": true,
    "triggeredAt": "2026-08-04T10:34:00.000Z"
  }
}
```

**Side-effect:** broadcast WebSocket event `EMERGENCY_TRIGGERED`

---

#### `POST /api/emergency/clear`
ยกเลิกสัญญาณฉุกเฉิน

**Request Body:**
```json
{ "alertId": "emg-1722765240000" }
```

**Response 200:**
```json
{ "success": true, "alertId": "emg-1722765240000" }
```

**Side-effect:** broadcast WebSocket event `EMERGENCY_CLEARED`

---

### 1.3 Screen Control

#### `POST /api/control/command`
ส่งคำสั่งไปยังจอแสดงผล

**Request Body:**
```json
{
  "screenId": "scr-001",
  "command": "REBOOT",
  "payload": {}
}
```

| Command | Payload | คำอธิบาย |
|---------|---------|---------|
| `REBOOT` | `{}` | รีบูตอุปกรณ์ |
| `TAKE_SCREENSHOT` | `{}` | ถ่ายภาพหน้าจอปัจจุบัน |
| `SYNC_PLAYBACK` | `{}` | บังคับ sync playlist |
| `PURGE_CACHE` | `{}` | ล้าง media cache |
| `SET_LAYOUT` | `{ "layoutId": "lay-split-3zone" }` | เปลี่ยน layout |
| `SET_VOLUME` | `{ "volume": 75 }` | ตั้งระดับเสียง (0–100) |
| `TRIGGER_EMERGENCY` | `EmergencyAlert partial` | (ใช้ผ่าน `/api/emergency/trigger` แทน) |
| `CLEAR_EMERGENCY` | `{ "alertId": "..." }` | (ใช้ผ่าน `/api/emergency/clear` แทน) |

**Response 200:**
```json
{
  "success": true,
  "screenId": "scr-001",
  "command": "REBOOT",
  "payload": {}
}
```

**Side-effect:** broadcast WebSocket event `SCREEN_COMMAND`

---

### 1.4 Telemetry

#### `POST /api/telemetry/heartbeat`
รับ heartbeat จากอุปกรณ์ (Player ส่งมาทุก 30 วินาที)

**Request Body:**
```json
{
  "screenId": "scr-001",
  "status": "online",
  "storageUsageMb": 2450,
  "uptimeSeconds": 864200
}
```

**Response 200:**
```json
{ "success": true, "receivedAt": "2026-08-04T10:34:00.000Z" }
```

**Side-effect:** broadcast WebSocket event `SCREEN_HEARTBEAT`

---

### 1.5 Screens (CRUD — ต้องพัฒนาเพิ่ม)

```
GET    /api/screens              ดู screens ทั้งหมด
GET    /api/screens/:id          ดู screen เดียว
POST   /api/screens              สร้าง screen ใหม่
PATCH  /api/screens/:id          อัปเดต screen
DELETE /api/screens/:id          ลบ screen
```

#### `GET /api/screens`
```json
{
  "data": [
    {
      "id": "scr-001",
      "pairingCode": "LOBBY-88",
      "name": "Main Lobby 4K Display",
      "group": "HQ Reception",
      "location": "Building A - Ground Floor",
      "orientation": "landscape",
      "resolution": "3840x2160 (4K)",
      "status": "online",
      "lastHeartbeat": "2026-08-04T10:34:00.000Z",
      "volume": 75,
      "isMuted": false,
      "currentLayoutId": "lay-split-3zone",
      "currentPlaylistId": "pl-corporate-main"
    }
  ],
  "total": 5
}
```

---

### 1.6 Media Items (CRUD — ต้องพัฒนาเพิ่ม)

```
GET    /api/media                ดู media ทั้งหมด (+ filter ?type=video)
GET    /api/media/:id            ดู media เดียว
POST   /api/media                สร้าง media (multipart/form-data สำหรับไฟล์)
DELETE /api/media/:id            ลบ media
```

---

### 1.7 Playlists (CRUD — ต้องพัฒนาเพิ่ม)

```
GET    /api/playlists            ดู playlists ทั้งหมด
GET    /api/playlists/:id        ดู playlist + items
POST   /api/playlists            สร้าง playlist
PUT    /api/playlists/:id        อัปเดต playlist + items ทั้งหมด
DELETE /api/playlists/:id        ลบ playlist
```

---

### 1.8 Schedules (CRUD — ต้องพัฒนาเพิ่ม)

```
GET    /api/schedules            ดู schedules ทั้งหมด
GET    /api/schedules/active     ดู schedules ที่ active ณ เวลาปัจจุบัน
POST   /api/schedules            สร้าง schedule
PATCH  /api/schedules/:id        อัปเดต schedule
DELETE /api/schedules/:id        ลบ schedule
```

---

### 1.9 Analytics (ต้องพัฒนาเพิ่ม)

```
GET /api/analytics/proof-of-play     ดู PoP logs (+ filter ?screenId=&limit=)
GET /api/analytics/telemetry         ดู telemetry logs
GET /api/analytics/summary           ดู summary stats
```

---

## 2. WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3100/ws');

ws.onopen = () => {
  console.log('Connected to Signage Hub');
};

ws.onmessage = (event) => {
  const { type, payload, timestamp } = JSON.parse(event.data);
  handleEvent(type, payload);
};
```

---

### 2.1 Events จาก Server → Client

#### `INIT_CONNECTED`
ส่งทันทีเมื่อ WebSocket เชื่อมต่อสำเร็จ
```json
{
  "type": "INIT_CONNECTED",
  "timestamp": "2026-08-04T10:34:00.000Z",
  "message": "Connected to Enterprise Digital Signage Realtime Hub"
}
```

---

#### `EMERGENCY_TRIGGERED`
เมื่อ emergency ถูก trigger (broadcast ทุก client)
```json
{
  "type": "EMERGENCY_TRIGGERED",
  "timestamp": "2026-08-04T10:34:00.000Z",
  "payload": {
    "id": "emg-1722765240000",
    "title": "FIRE EVACUATION WARNING",
    "message": "PLEASE EVACUATE THE BUILDING IMMEDIATELY.",
    "type": "fire",
    "severity": "critical",
    "targetScreenIds": [],
    "active": true,
    "triggeredAt": "2026-08-04T10:34:00.000Z"
  }
}
```

**Player ต้องทำ:** render Emergency Overlay ทันที

---

#### `EMERGENCY_CLEARED`
เมื่อ emergency ถูกยกเลิก
```json
{
  "type": "EMERGENCY_CLEARED",
  "timestamp": "2026-08-04T10:34:00.000Z",
  "payload": {
    "alertId": "emg-1722765240000"
  }
}
```

**Player ต้องทำ:** ซ่อน Emergency Overlay + กลับ normal playback

---

#### `SCREEN_COMMAND`
คำสั่ง remote สำหรับจอเฉพาะ
```json
{
  "type": "SCREEN_COMMAND",
  "timestamp": "2026-08-04T10:34:00.000Z",
  "payload": {
    "screenId": "scr-001",
    "command": "REBOOT",
    "payload": {}
  }
}
```

**Player ต้องทำ:** ตรวจสอบ `screenId` ตรงกับตัวเองก่อน execute

---

#### `SCREEN_HEARTBEAT`
Heartbeat จากอุปกรณ์ (broadcast ให้ Admin ดู)
```json
{
  "type": "SCREEN_HEARTBEAT",
  "timestamp": "2026-08-04T10:34:00.000Z",
  "payload": {
    "screenId": "scr-001",
    "status": "online",
    "storageUsageMb": 2450,
    "uptimeSeconds": 864200
  }
}
```

**Admin ต้องทำ:** อัปเดต screen status ใน UI

---

### 2.2 Events จาก Client → Server (Relay)

Client ส่ง message ใดก็ได้ — server จะ relay ไปยัง clients อื่นทั้งหมด

```javascript
// Admin ส่งคำสั่งไปยัง Player
ws.send(JSON.stringify({
  type: 'SCREEN_COMMAND',
  payload: {
    screenId: 'scr-001',
    command: 'SET_VOLUME',
    payload: { volume: 50 }
  }
}));

// Player ส่ง heartbeat
ws.send(JSON.stringify({
  type: 'SCREEN_HEARTBEAT',
  payload: {
    screenId: 'scr-001',
    status: 'online',
    storageUsageMb: 2450,
    uptimeSeconds: 864200
  }
}));
```

---

### 2.3 WebSocket Event Handling (ตัวอย่าง React)

```typescript
// hooks/useWebSocket.ts
import { useEffect } from 'react';
import { useSignageStore } from '../store/useSignageStore';

export function useWebSocket() {
  const { setWsConnected, triggerEmergency, clearEmergency, updateScreen } = useSignageStore();

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3100/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    ws.onmessage = (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);

        switch (type) {
          case 'EMERGENCY_TRIGGERED':
            triggerEmergency(payload);
            break;

          case 'EMERGENCY_CLEARED':
            clearEmergency(payload.alertId);
            break;

          case 'SCREEN_HEARTBEAT':
            updateScreen(payload.screenId, {
              status: payload.status,
              storageUsageMb: payload.storageUsageMb,
              uptimeSeconds: payload.uptimeSeconds,
              lastHeartbeat: new Date().toISOString(),
            });
            break;

          case 'SCREEN_COMMAND':
            // Player handles this — check if screenId matches
            break;
        }
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    // Reconnect logic
    ws.onclose = () => {
      setWsConnected(false);
      setTimeout(() => { /* reconnect */ }, 3000);
    };

    return () => ws.close();
  }, []);
}
```

---

## 3. Error Codes

| Code | HTTP Status | คำอธิบาย |
|------|-------------|---------|
| `NOT_FOUND` | 404 | ไม่พบ resource |
| `VALIDATION_ERROR` | 400 | ข้อมูลไม่ถูกต้อง |
| `DB_ERROR` | 500 | Database error |
| `WS_NOT_CONNECTED` | 503 | WebSocket server ไม่พร้อม |
| `SCREEN_NOT_FOUND` | 404 | ไม่พบ screen ID |

**Error Response Format:**
```json
{
  "error": "Screen not found",
  "code": "SCREEN_NOT_FOUND",
  "screenId": "scr-999"
}
```

---

## 4. Rate Limits (แนะนำ)

| Endpoint | Limit |
|----------|-------|
| `POST /api/emergency/trigger` | 10 req/min per IP |
| `POST /api/control/command` | 60 req/min per IP |
| `POST /api/telemetry/heartbeat` | 120 req/min per screen |
| `GET /api/*` | 300 req/min per IP |
