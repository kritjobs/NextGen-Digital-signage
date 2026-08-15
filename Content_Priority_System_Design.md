# Content Priority System 6-Level — Design Document
**สำหรับ:** NextGen Digital Signage Platform  
**วันที่:** 8 สิงหาคม 2026  
**อ้างอิง:** Yodeck Content Type Prioritization  
**สถานะ:** Approved for Implementation

---

## 1. แนวคิดหลัก

จอ signage 1 จอมี "กฎ" หลายตัวที่กำหนดว่าจะแสดงอะไร — เมื่อกฎหลายตัว active พร้อมกัน
Priority System ตัดสินว่า content ไหน "ชนะ" โดยกำหนดลำดับชั้นตายตัว —
content ที่อยู่ level สูงกว่า **ชนะเสมอ** ไม่ว่าจะมีอะไรอยู่ level ต่ำกว่า

---

## 2. Priority Hierarchy (6 Levels)

```
┌─────────────────────────────────────────────────────────┐
│  Level 1: EMERGENCY ALERT          ← สูงสุด, ไม่มีใครชนะ │
├─────────────────────────────────────────────────────────┤
│  Level 2: SCREEN TAKEOVER          ← manual override       │
├─────────────────────────────────────────────────────────┤
│  Level 3: SCHEDULE                 ← content ตาม time slot │
├─────────────────────────────────────────────────────────┤
│  Level 4: PLAYLIST                 ← default playlist      │
├─────────────────────────────────────────────────────────┤
│  Level 5: FILLER (Default Content) ← เติมช่องว่าง          │
├─────────────────────────────────────────────────────────┤
│  Level 6: FALLBACK                 ← ต่ำสุด, ป้องกันจอดำ    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. อธิบายแต่ละ Level

### Level 1: Emergency Alert (สูงสุด)
**คืออะไร:** ข้อความฉุกเฉินที่ override ทุกอย่างทันที  
**ตัวอย่าง:**
- ไฟไหม้ → ทุกจอเปลี่ยนเป็น "อพยพทันที ใช้ทางออกฉุกเฉิน"
- แผ่นดินไหว → จอแสดงจุดรวมพล
- Active shooter → คำแนะนำ "Lock down"

**พฤติกรรม:** กดปุ่ม Emergency → ทุกจอ (หรือจอที่เลือก) เปลี่ยนทันที
ไม่ว่าจะกำลังแสดงอะไรอยู่

### Level 2: Screen Takeover (Manual Override)
**คืออะไร:** Admin สั่งให้จอแสดง content เฉพาะ ชั่วคราว  
**ตัวอย่าง:**
- CEO ต้องการ broadcast วิดีโอ Town Hall ไปทุกจอตอน 14:00
- ฝ่าย HR ต้องแสดงประกาศเร่งด่วน "ปิดที่จอดรถชั้น B2 วันนี้"
- ทีม event สั่งให้จอ lobby แสดงวิดีโอต้อนรับแขก VIP

**พฤติกรรม:** Admin กด Takeover → จอแสดง content ที่กำหนดจนกว่าจะยกเลิก → กลับไปเล่น content ปกติ

**ต่างจาก Emergency:** ไม่ใช่เหตุฉุกเฉิน แค่ "ขอแทรกหน่อย"

### Level 3: Schedule (ตารางเวลา)
**คืออะไร:** Content ที่กำหนดให้แสดงตาม time slot เฉพาะ  
**ตัวอย่าง:**

```
จอร้านกาแฟ:
  07:00-11:00  → เมนูอาหารเช้า
  11:00-14:00  → เมนูอาหารกลางวัน + โปรโมชั่น set lunch
  14:00-17:00  → เมนูเครื่องดื่ม + ขนม
  17:00-21:00  → เมนูอาหารเย็น + happy hour
```

**พฤติกรรม:** ถึงเวลา → เปลี่ยน content อัตโนมัติตาม schedule  
**แต่ถ้า** CEO กด Takeover ตอน 12:00 → จอแสดง Takeover content แทน schedule

### Level 4: Playlist (Default Playlist)
**คืออะไร:** Playlist ที่ assign ให้จอโดยตรง — เล่นเมื่อไม่มี schedule ที่ active  
**ตัวอย่าง:**
- จอ lobby มี playlist "Corporate Branding" ที่เล่นวน (logo, ค่านิยมองค์กร, news)
- จอ breakroom มี playlist "Entertainment" (social feeds, birthdays, quotes)

**พฤติกรรม:** เล่นไปเรื่อยๆ — **แต่ถ้า** มี schedule active ตอนนั้น → schedule ชนะ

### Level 5: Filler / Default Content
**คืออะไร:** Content ที่เติมช่องว่างเมื่อ schedule มี gap  
**ตัวอย่าง:**

```
Schedule ของจอ:
  09:00-12:00  → โปรโมชั่นเช้า
  [12:00-13:00 → ไม่มี schedule!]  ← Filler เข้ามาตรงนี้
  13:00-17:00  → โปรโมชั่นบ่าย
```

Filler content = slideshow รูปสวยๆ ของร้าน หรือ logo loop

**พฤติกรรม:** เล่นเฉพาะตอนที่ไม่มี Level 1-4 active

### Level 6: Fallback (ต่ำสุด — ป้องกันจอดำ)
**คืออะไร:** Safety net สุดท้าย — แสดงเมื่อไม่มี content อื่นเลย  
**ตัวอย่าง:**
- รูป logo บริษัท + เวลา/วันที่ (static)
- หน้าจอ "กำลังอัพเดต content..."
- Branded wallpaper

**สถานการณ์ที่ fallback ทำงาน:**
- Player เพิ่ง setup ยังไม่มี content assign
- ทุก content หมดอายุ (media expiration)
- Internet ล่ม + local cache ถูก clear
- Admin ลบ content ทั้งหมดโดยไม่ตั้งใจ


---

## 4. ตัวอย่างสถานการณ์จริง — จอ 1 จอตลอดทั้งวัน

```
จอ: "Lobby-Main" ที่ล็อบบี้ชั้น 1
Assigned: 
  - Playlist: "Corporate Branding" (logo + news + ESG video)
  - Schedule: 08:00-09:00 "Good Morning" / 12:00-13:00 "Lunch Menu"
  - Filler: "Company Logo Loop"
  - Fallback: "Static Logo.png"

Timeline ของวันนี้:
───────────────────────────────────────────────────────
06:00  จอเปิด → [Level 5: Filler] "Company Logo Loop"
       (ยังไม่มี schedule/playlist ที่ active)

08:00  Schedule เริ่ม → [Level 3: Schedule] "Good Morning"
       (ชนะ Filler เพราะ priority สูงกว่า)

09:00  Schedule จบ → [Level 4: Playlist] "Corporate Branding"
       (กลับมาเล่น playlist ปกติ)

10:30  Admin กด Takeover "ประกาศ: ลิฟต์ A ปิดซ่อม" 
       → [Level 2: Takeover] แสดงประกาศทันที
       (ชนะ Playlist เพราะ priority สูงกว่า)

10:45  Admin ยกเลิก Takeover 
       → [Level 4: Playlist] กลับมาเล่น "Corporate Branding"

12:00  Schedule เริ่ม → [Level 3: Schedule] "Lunch Menu"

12:20  🚨 เกิดไฟไหม้! Admin กด Emergency Alert
       → [Level 1: Emergency] "อพยพทันที!" (พื้นแดงกระพริบ)
       (ชนะทุกอย่าง!)

12:35  ✅ Emergency ถูกยกเลิก
       → [Level 3: Schedule] กลับมาแสดง "Lunch Menu"
       (ยังอยู่ใน time slot)

13:00  Schedule จบ → [Level 4: Playlist] "Corporate Branding"

22:00  จอปิดตาม Working Hours
───────────────────────────────────────────────────────
```

---

## 5. ทำไมถึงสำคัญ — ปัญหาที่เกิดถ้าไม่มี Priority System

| สถานการณ์ | ไม่มี Priority | มี Priority |
|-----------|---------------|-------------|
| Emergency + Schedule active พร้อมกัน | จอแสดง schedule (อันตราย!) | Emergency ชนะเสมอ ✅ |
| Admin Takeover แต่ Schedule เริ่ม | จอเปลี่ยนเป็น schedule (takeover หาย) | Takeover ชนะ schedule ✅ |
| ลบ content ทั้งหมดโดยไม่ตั้งใจ | จอดำ (ดูไม่ professional) | Fallback แสดง logo ✅ |
| Schedule จบแต่ไม่มี content ต่อ | จอดำ หรือค้างที่ content เก่า | Filler เข้ามาเติม ✅ |
| ทุก media หมดอายุ | จอดำ | Fallback ทำงาน ✅ |
| Internet ล่ม + cache clear | จอดำ | Fallback (embedded) ✅ |

**กฎทอง: จอต้องไม่มีวันดำ (No Black Screen Policy)**


---

## 6. Implementation Design

### 6.1 Content Resolution Engine (TypeScript)

```typescript
// Content Resolution Engine — หัวใจของ Player
enum ContentPriority {
  EMERGENCY = 1,   // สูงสุด
  TAKEOVER  = 2,
  SCHEDULE  = 3,
  PLAYLIST  = 4,
  FILLER    = 5,
  FALLBACK  = 6,   // ต่ำสุด
}

interface ContentLayer {
  priority: ContentPriority;
  isActive: boolean;
  content: MediaContent | Playlist | Layout;
  metadata: {
    source: string;       // ใครสั่ง
    activatedAt: Date;    // เริ่มเมื่อไหร่
    expiresAt?: Date;     // หมดอายุเมื่อไหร่ (optional)
    targetScreens?: string[]; // เฉพาะจอไหน (optional)
  };
}

// Player ทำ evaluation ทุก cycle (ทุก 1 วินาที):
function resolveContent(screen: Screen): ContentLayer {
  const layers: ContentLayer[] = screen.getContentLayers();
  
  // Sort by priority (1 = highest) แล้วเอาตัวแรกที่ active
  const activeLayer = layers
    .filter(layer => layer.isActive)
    .sort((a, b) => a.priority - b.priority)
    [0];
  
  // ไม่มีทาง return null — Fallback ต้อง active เสมอ
  return activeLayer ?? screen.getBuiltInFallback();
}
```

### 6.2 State Machine Diagram

```
                    ┌─────────────┐
                    │  EMERGENCY  │ ← Trigger: Admin/CAP/API
                    │  (Level 1)  │
                    └──────┬──────┘
                           │ cancel
                           ▼
                    ┌─────────────┐
                    │  TAKEOVER   │ ← Trigger: Admin manual
                    │  (Level 2)  │
                    └──────┬──────┘
                           │ cancel / expire
                           ▼
                    ┌─────────────┐
                    │  SCHEDULE   │ ← Trigger: Time-based
                    │  (Level 3)  │
                    └──────┬──────┘
                           │ outside time slot
                           ▼
                    ┌─────────────┐
                    │  PLAYLIST   │ ← Trigger: Assigned to screen
                    │  (Level 4)  │
                    └──────┬──────┘
                           │ no playlist assigned
                           ▼
                    ┌─────────────┐
                    │   FILLER    │ ← Trigger: Gap in schedule
                    │  (Level 5)  │
                    └──────┬──────┘
                           │ no filler set
                           ▼
                    ┌─────────────┐
                    │  FALLBACK   │ ← Always available (built-in)
                    │  (Level 6)  │
                    └─────────────┘
```

### 6.3 Resolution Rules

```typescript
// กฎสำคัญ:
// 1. Evaluation ทำทุก 1 วินาที (ไม่ใช่ event-driven อย่างเดียว)
// 2. Emergency/Takeover = push notification + polling
// 3. Schedule = time-based check
// 4. Fallback = hardcoded ใน player firmware (ไม่ต้อง network)

// การเปลี่ยน content ระหว่าง level:
interface TransitionRule {
  from: ContentPriority;
  to: ContentPriority;
  transition: 'instant' | 'fade' | 'slide';
  duration: number; // ms
}

const transitionRules: TransitionRule[] = [
  // Emergency เข้าทันที ไม่มี transition
  { from: ANY, to: ContentPriority.EMERGENCY, transition: 'instant', duration: 0 },
  // Takeover fade-in เร็ว
  { from: ANY, to: ContentPriority.TAKEOVER, transition: 'fade', duration: 300 },
  // Schedule/Playlist เปลี่ยนแบบ smooth
  { from: ANY, to: ContentPriority.SCHEDULE, transition: 'fade', duration: 500 },
  { from: ANY, to: ContentPriority.PLAYLIST, transition: 'fade', duration: 500 },
  // กลับจาก Emergency → content ก่อนหน้า
  { from: ContentPriority.EMERGENCY, to: ANY, transition: 'fade', duration: 1000 },
];
```

### 6.4 Admin UI — Priority Indicator

```
Screen Detail View:
┌─────────────────────────────────────────────┐
│  จอ: Lobby-Main                              │
│  Status: 🟢 Online                           │
│                                              │
│  Currently Playing:                          │
│  ┌──────────────────────────────────────┐   │
│  │ 🔴 Level 3: Schedule                 │   │
│  │    "Lunch Menu Playlist"              │   │
│  │    Active: 12:00 - 13:00              │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Priority Stack:                             │
│  ┌──────────────────────────────────────┐   │
│  │ 1. 🚨 Emergency    [Not Active]      │   │
│  │ 2. 📢 Takeover     [Not Active]      │   │
│  │ 3. 📅 Schedule     [ACTIVE] ← now    │   │
│  │ 4. 🎬 Playlist     "Corp Branding"   │   │
│  │ 5. 🖼️ Filler       "Logo Loop"       │   │
│  │ 6. 🛡️ Fallback     "static-logo.png" │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 7. Edge Cases & Rules

| Case | Rule |
|------|------|
| 2 Schedules overlap เวลาเดียวกัน | ใช้ schedule ที่สร้างทีหลัง (latest wins) หรือ manual priority |
| Emergency ถูก trigger ขณะ Takeover active | Emergency ชนะ (Level 1 > Level 2) |
| Takeover มี expiry time | ถึงเวลา → auto-cancel → fall back to next active level |
| Playlist ว่าง (0 items) | Skip → ไปต่อที่ Filler |
| Filler ว่าง + Playlist ว่าง | Fallback ทำงาน |
| Internet ล่ม ขณะ Emergency active | Player cache Emergency content locally → ยังแสดงได้ |
| Player restart ขณะ Emergency active | Boot → check server → Emergency ยัง active → แสดง Emergency |

---

## 8. API Endpoints (Draft)

```
POST   /api/screens/{id}/emergency     → Trigger emergency (Level 1)
DELETE /api/screens/{id}/emergency     → Cancel emergency
POST   /api/screens/{id}/takeover      → Start takeover (Level 2)
DELETE /api/screens/{id}/takeover      → Cancel takeover
GET    /api/screens/{id}/active-layer  → Get current active priority layer
GET    /api/screens/{id}/priority-stack → Get full priority stack status
```

---

## 9. Integration Points กับระบบอื่น

| ระบบ | Integration | Priority Level |
|------|-------------|----------------|
| CAP (Alertus, Informacast) | Webhook → Emergency | Level 1 |
| Fire Alarm System | GPIO/API → Emergency | Level 1 |
| IoT Motion Sensor | HTTP trigger → Takeover | Level 2 |
| Calendar (Google/MS) | Sync → Schedule | Level 3 |
| Cloud Storage (Drive/Dropbox) | Folder sync → Playlist | Level 4 |
| Default Config | Hardcoded | Level 6 |

---

*Document version 1.0 — Ready for implementation review*