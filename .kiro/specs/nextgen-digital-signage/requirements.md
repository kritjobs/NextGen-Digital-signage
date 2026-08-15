# Requirements — NextGen Digital Signage Platform
**Version:** 1.0  
**อ้างอิงต้นแบบ:** `enterprise-digital-signage-platform/` + `stitch_edusign_admin_pro/`  
**เป้าหมาย:** ผลลัพธ์ตรงต้นแบบ 100% ทั้ง UI, Logic, และ Behavior

---

## 1. ภาพรวมระบบ (System Overview)

ระบบ **NextGen Digital Signage** คือ Smart School Communication Platform สำหรับควบคุมและแสดงผลสื่อดิจิทัลบนจอหลายจอพร้อมกัน รองรับโหมด Realtime, Offline-first, และ Emergency Override

### 1.1 กลุ่มผู้ใช้งาน

| กลุ่ม | บทบาท | สิทธิ์ |
|-------|--------|--------|
| Super Admin | ดูแลระบบทั้งหมด | ทุกอย่าง รวม Emergency |
| Staff Admin | จัดการ Media/Playlist/Schedule | ไม่มีสิทธิ์ Emergency |
| Viewer | ดูสถานะและ Analytics เท่านั้น | Read-only |
| Player (Device) | อุปกรณ์แสดงผล | รับคำสั่งจาก Admin เท่านั้น |

### 1.2 Application Views (3 โหมด)

| Mode | คำอธิบาย | Route |
|------|-----------|-------|
| **Admin Mode** | CMS จัดการระบบทั้งหมด | `/admin` |
| **Player Mode** | จำลองจอแสดงผล | `/player` |
| **Simulator Mode** | เปิด Admin + Player คู่กัน | `/simulator` |

---

## 2. ฟีเจอร์หลัก (Functional Requirements)

### FR-01: Admin Panel — Navigation

- **FR-01.1** Sidebar ซ้ายกว้าง 280px แสดงโลโก้ SmartSchool + ชื่อระบบ `SignageControl`
- **FR-01.2** Menu items: Dashboard, Media Library, Playlist Builder, Scheduling, Screens, Control Panel, Analytics, Settings
- **FR-01.3** Active item แสดง Electric Indigo text + `border-r-2 border-primary` + background tint
- **FR-01.4** Topbar สูง 64px แสดง Search bar กลาง + Notification + Apps + Avatar ขวา
- **FR-01.5** Topbar ตรึงบนสุด `fixed top-0` มี `backdrop-blur-xl` และ `border-b`
- **FR-01.6** Mobile: Sidebar ซ่อน ใช้ Mobile Header แทน

### FR-02: Dashboard (Admin Home)

- **FR-02.1** แสดง Summary Cards: จำนวนจอ Online/Offline/Warning, Playlists active, Last Sync time
- **FR-02.2** Bento Grid layout — 12 คอลัมน์ responsive
- **FR-02.3** Screen Status Card แสดง Network Status summary (จำนวน Online/Offline/Warning)
- **FR-02.4** Usage Graph (Line/Bar chart) แสดงการเล่นสื่อ 7 วันย้อนหลัง
- **FR-02.5** Alerts section แสดง Active Emergency + Latest Telemetry logs
- **FR-02.6** Glass Card style: `backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.1)`

### FR-03: Screen Management (Screens & Devices)

- **FR-03.1** แสดงจอทั้งหมดในรูปแบบ Card Grid (2 คอลัมน์ + Quick Stats ซ้าย)
- **FR-03.2** Screen Card ประกอบด้วย:
  - Preview Image (thumbnail จาก `lastScreenshotUrl`) ความสูง 128px
  - Status Badge: `Online` (emerald), `Offline` (gray), `Syncing` (amber), `Emergency` (red pulse)
  - ชื่อจอ + สถานที่
  - Tesla-style toggle switch (enable/disable จอ)
  - Last sync timestamp
  - ปุ่ม "Assign Playlist" / "Wake Device"
  - ปุ่ม Screenshot (Camera icon, แสดงเมื่อ hover)
- **FR-03.3** Quick Stats ซ้ายแสดง: Online count (display-lg font), Offline, Warning
- **FR-03.4** ปุ่ม "Provision Screen" เพิ่มจอใหม่ผ่าน Pairing Code
- **FR-03.5** ปุ่ม Filter + Search จอ
- **FR-03.6** Offline card แสดง `tv_off` icon + opacity 75% + ปุ่ม "Wake Device"

### FR-04: Media Library

- **FR-04.1** Grid layout แสดง thumbnail การ์ดสื่อ (2-4 คอลัมน์ตาม viewport)
- **FR-04.2** สื่อแต่ละประเภทมี icon overlay:
  - `movie` = Video
  - `image` = Image  
  - `widgets` = Widget (Clock, Weather, Ticker, Announcement)
- **FR-04.3** Badge แสดง duration (วิดีโอ) หรือ "Static" (รูปภาพ) หรือ "Widget" ที่มุมล่างขวา
- **FR-04.4** Drag-and-drop items ไปยัง Playlist Builder ได้
- **FR-04.5** Filter แยกตาม type: All / Video / Image / Widget
- **FR-04.6** Search ตามชื่อ/tag
- **FR-04.7** ปุ่ม Upload Media (drag-drop zone + file picker)
- **FR-04.8** รองรับ Media Types: `video`, `image`, `ticker`, `weather`, `clock`, `announcement`, `webpage`

### FR-05: Playlist Builder

- **FR-05.1** Layout แบ่งเป็น 3 ส่วน:
  - **ซ้าย (w-80):** Media Library Panel (draggable items, grid 2 cols)
  - **กลาง:** Preview Monitor + Timeline Editor
  - **ขวา (w-64):** Clip Properties Inspector
- **FR-05.2** Preview Monitor แสดงสื่อที่กำลัง active + playback controls (prev/play/next)
- **FR-05.3** Monitor Stats Bar แสดง: Live Engine Active indicator, FPS, Timecode
- **FR-05.4** Timeline Editor ประกอบด้วย:
  - Time Ruler บนสุดพร้อม Playhead (เส้นสีแดง + triangle marker)
  - Track Headers (V1 Main, V2 Overlay) + lock/visibility icons
  - Clip blocks บน track: สีฟ้า (selected) หรือ cyan (unselected)
  - Resize handles ซ้าย-ขวาของ clip
  - Transition Indicator (animation icon) ระหว่าง clips พร้อม dropdown picker
  - Zoom slider
  - Loop toggle switch
- **FR-05.5** Clip Properties Inspector แสดง: Duration input, Scale/Fit dropdown, Brightness/Contrast sliders
- **FR-05.6** ปุ่ม "Preview Full" และ "Save Playlist" (primary button with glow shadow)
- **FR-05.7** Drag media จาก Library ลง Timeline ได้ทันที

### FR-06: Scheduling System

- **FR-06.1** Master Schedule view — Timeline Grid ขนาดใหญ่ (24 ชั่วโมง × N zones)
- **FR-06.2** Left column (3/12): Mini Calendar + Playlist Draggable List
- **FR-06.3** Right column (9/12): Timeline Grid แบบ Gantt
- **FR-06.4** Timeline Grid:
  - Header แสดงชั่วโมง (06:00–24:00)
  - แต่ละ Row = Screen Group (All Campus, Main Hallway, Cafeteria, Library, Gymnasium, Staff Room)
  - Sticky row header ซ้าย + sticky time header บน
  - Current Time Indicator (เส้นสี Cyan พร้อม timestamp tooltip)
- **FR-06.5** Event Blocks มี 3 Priority สี:
  - `priority-normal`: Indigo border-left + tint
  - `priority-event`: Amber border-left + tint
  - `priority-emergency`: Red border-left + pulse animation
- **FR-06.6** Drag playlist จาก list ซ้ายวางลงบน timeline ได้
- **FR-06.7** Legend แสดง Normal / Event / Emergency
- **FR-06.8** Toggle view: Timeline | Month
- **FR-06.9** Mini Calendar ใน left panel: วันปัจจุบัน highlight primary color + glow
- **FR-06.10** ปุ่ม "New Event" + "Filter Groups"

### FR-07: Control Panel (Realtime Command Center)

- **FR-07.1** Emergency Section:
  - ปุ่ม 🚨 EMERGENCY BROADCAST ขนาดใหญ่ — `pulse-red` animation
  - Dropdown เลือกประเภท Emergency (fire, weather, lockdown, custom, all-clear)
  - Text input สำหรับ custom message
  - ปุ่ม CLEAR EMERGENCY
- **FR-07.2** Remote Commands per screen:
  - REBOOT (simulates status: syncing → online หลัง 3 วินาที)
  - TAKE SCREENSHOT (อัปเดต `lastScreenshotUrl`)
  - FORCE SYNC / SYNC PLAYBACK
  - PURGE CACHE (reset storageUsageMb = 250, bufferCachedItemsCount = 0)
  - SET LAYOUT (dropdown เลือก layout)
  - SET VOLUME (slider 0–100)
- **FR-07.3** Target Screen Selector — ทำงานกับจอเดียวหรือทุกจอ
- **FR-07.4** Live Telemetry feed แสดง log แบบ realtime (scroll เพิ่มขึ้น)
- **FR-07.5** WebSocket Status indicator (online/offline)

### FR-08: Analytics & Telemetry

- **FR-08.1** Proof of Play Log — ตารางแสดง: Screen, Media Title, Played At, Duration, Status
- **FR-08.2** Telemetry Event Log — ตารางแสดง: Screen, Timestamp, Event Type (heartbeat/media_played/error/command), Message
- **FR-08.3** Summary Cards: Total Play Events, Total Duration, Error Count, Uptime %
- **FR-08.4** Filter ตาม Screen, Event Type, Date Range
- **FR-08.5** Chart แสดง media play frequency (bar chart ต่อสื่อ)
- **FR-08.6** Export ข้อมูลเป็น CSV (ฟีเจอร์เสริม)

### FR-09: Smart Layout Builder

- **FR-09.1** Visual canvas แสดง layout zones บน aspect ratio ที่เลือก (16:9, 9:16, 21:9)
- **FR-09.2** Drag zones บน canvas ปรับตำแหน่ง/ขนาดได้ (x, y, width, height %)
- **FR-09.3** Zone Properties: name, backgroundColor, zIndex, playlistId, mediaType
- **FR-09.4** Layout Templates สำเร็จรูป: 3-Zone Landscape, Portrait Kiosk, Full Canvas, LED Hero Wall
- **FR-09.5** Preview live render ของ zones บน canvas
- **FR-09.6** Save/Update Layout ไปยัง store

---

## 3. Player App Requirements

### FR-10: Player Core

- **FR-10.1** แสดงผล Multi-Zone Layout ตาม `activeLayout.zones`
- **FR-10.2** แต่ละ Zone Render สื่อจาก Playlist ที่ assign ไว้
- **FR-10.3** Auto-advance ผ่าน playlist items ตาม `duration` ของแต่ละ item
- **FR-10.4** Proof of Play บันทึกทุกครั้งที่ item จบ duration
- **FR-10.5** รองรับ Portrait (9:16) — จำกัดความกว้าง max-w-[480px] mx-auto

### FR-11: Emergency Override

- **FR-11.1** เมื่อ `activeEmergency` มีค่า — Overlay ปิดทุก Zone ทันที
- **FR-11.2** Emergency Overlay: พื้นหลัง `bg-rose-950/95`, border `border-8 border-rose-500`
- **FR-11.3** แสดง: Warning icon (bounce), badge "EMERGENCY OVERRIDE BROADCAST", title (5xl), message (2xl)
- **FR-11.4** Footer ticker แสดงข้อความ Emergency วิ่งไปมา
- **FR-11.5** Overlay animate-pulse ทั้งหน้า

### FR-12: Player UI — Fullscreen Mode

- **FR-12.1** WebGL Shader background (undulating gradient พื้นหลัง — ป้องกัน burn-in)
- **FR-12.2** Topbar (fixed top): โลโก้/ชื่อ + Sync indicator (cyan dot + pulse animation + glow)
- **FR-12.3** Media area เต็มจอ: รูปภาพ/วิดีโอ + vignette gradient overlay ด้านล่าง
- **FR-12.4** Bottom Ticker Bar (fixed bottom, h-32): 
  - ซ้าย: Clock widget — เวลา (`display-title` font) + AM/PM + วันที่
  - กลาง: Scrolling text (`headline-lg`, `animation: scroll-left 25s linear infinite`)
  - ขวา: Weather icon (64px) + อุณหภูมิ (`display-title`)
- **FR-12.5** Clock อัปเดตทุก 1 วินาที

### FR-13: Player UI — OSD (On-Screen Display)

- **FR-13.1** OSD แสดง/ซ่อนเมื่อ mouse move (timeout 8 วินาที)
- **FR-13.2** OSD bar ล่างสุด: Screen name + Pairing Code + Buffer Cache status
- **FR-13.3** Offline Simulation toggle (amber = offline, green = online)
- **FR-13.4** Screen picker dropdown เลือกจอที่ต้องการจำลอง
- **FR-13.5** QR Code button เปิด Pairing QR modal
- **FR-13.6** Fullscreen toggle button
- **FR-13.7** "Exit Player" button กลับไป Admin mode

### FR-14: Player UI — Emergency Mode

- **FR-14.1** ปิดทุก UI element ปกติ (Topbar, Sidebar, Footer)
- **FR-14.2** พื้นหลัง pulse animation: `#93000a` ↔ `#690005` cycle 1.5s
- **FR-14.3** Center content: Warning icon ขนาด 240px + ข้อความ `display-hero` (120px/800 weight)
- **FR-14.4** Bottom ticker: ข้อความ `headline-lg` สีแดง วิ่ง `scrollTicker 15s linear infinite`
- **FR-14.5** body `overflow: hidden` — ป้องกัน scroll

### FR-15: Media Renderers

| Type | Behavior |
|------|----------|
| `video` | `<video autoPlay loop muted playsInline>` + `object-cover` |
| `image` | `<img>` + `object-cover` + `animate-fade-in` |
| `ticker` | scrolling marquee animation, cyan label "NEWS TICKER:", ข้อความจาก `contentData.tickerText` |
| `weather` | gradient card, city name, temp (4xl), condition + AQI |
| `clock` | gradient card, `Clock` icon, `toLocaleTimeString()` (3xl mono), วันที่ |
| `announcement` | header + body text บน gradient dark card |

### FR-16: QR Pairing

- **FR-16.1** แสดง QR Code จาก `screen.pairingCode`
- **FR-16.2** Countdown timer สำหรับ code expiry (simulate)
- **FR-16.3** ปุ่ม "Return to Display Player"

---

## 4. Realtime & Backend Requirements

### FR-17: WebSocket Server

- **FR-17.1** WebSocket endpoint: `ws://host:3000/ws`
- **FR-17.2** Broadcast ทุก message ให้ clients ทุกตัว (ยกเว้น sender)
- **FR-17.3** Events ที่ broadcast:
  - `INIT_CONNECTED` — เมื่อ client connect
  - `EMERGENCY_TRIGGERED` — payload: EmergencyAlert object
  - `EMERGENCY_CLEARED` — payload: `{ alertId }`
  - `SCREEN_COMMAND` — payload: `{ screenId, command, payload }`
  - `SCREEN_HEARTBEAT` — payload: `{ screenId, status, storageUsageMb, uptimeSeconds }`

### FR-18: REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | System status + uptime + connected clients |
| POST | `/api/emergency/trigger` | Trigger emergency broadcast |
| POST | `/api/emergency/clear` | Clear emergency by alertId |
| POST | `/api/control/command` | Send command to screen |
| POST | `/api/telemetry/heartbeat` | Receive heartbeat from device |

---

## 5. Non-Functional Requirements

### NFR-01: Performance
- **NFR-01.1** Player ต้องไม่มี Black Frame (Zero-Flicker) ขณะสลับสื่อ
- **NFR-01.2** Preload สื่อถัดไป 1–2 รายการล่วงหน้า
- **NFR-01.3** Target: 60 FPS บน modern browser

### NFR-02: Offline-First
- **NFR-02.1** Player ต้องเล่นสื่อต่อได้แม้เน็ตหลุด (ใช้ cached data)
- **NFR-02.2** IndexedDB เก็บ media blobs สำหรับ offline playback
- **NFR-02.3** Delta Sync — โหลดเฉพาะ diff เมื่อ reconnect

### NFR-03: Memory Management (Android TV / Low-spec)
- **NFR-03.1** ต้อง `URL.revokeObjectURL()` ทุกครั้งหลัง blob หมดอายุ
- **NFR-03.2** Video element ต้อง `.pause()` + ลบ `src` + `.load()` ก่อน destroy
- **NFR-03.3** ใช้ Double-Video A/B Buffering (2 video elements สลับ opacity)

### NFR-04: Accessibility
- **NFR-04.1** Emergency overlay ต้องมี contrast ratio ≥ 7:1
- **NFR-04.2** Touch targets ≥ 48px สำหรับ tablet/touch device
- **NFR-04.3** Keyboard navigation ใน Admin Panel

### NFR-05: Responsive
- **NFR-05.1** Admin Panel รองรับ desktop (≥1280px) และ tablet (≥768px)
- **NFR-05.2** Player รองรับ Landscape 16:9, Portrait 9:16, Ultrawide 21:9

---

## 6. Data Seed Requirements

ระบบต้องมีข้อมูลเริ่มต้น (Initial Data) ดังนี้:

### Screens (5 จอ)
1. Main Lobby 4K Display — `LOBBY-88` — landscape 4K — online
2. Cafeteria Digital Menu Board — `CAFE-20` — landscape FHD — online
3. Executive Elevator Portrait Kiosk — `TOWER-91` — portrait — online (muted)
4. Campus Quad Outdoor LED Wall — `QUAD-15` — landscape 2K — syncing
5. Innovation Hub Welcome Screen — `CONF-04` — landscape FHD — offline

### Media Items (8 items)
1. Enterprise Welcome Showcase 2026 — video (30s)
2. Q1 All-Hands Townhall — video (45s)
3. Sustainability Poster — image (15s)
4. Daily Gourmet Dining Specials — image (20s)
5. Live Stock & News Ticker — ticker (60s)
6. Global City Weather Widget — weather (60s)
7. Precision Digital World Clock — clock (60s)
8. Security & Visitors Policy — announcement (25s)

### Layouts (4 templates)
1. Enterprise 3-Zone Landscape (70% main + 30% sidebar + 12% ticker)
2. Portrait Elevator Kiosk (20% header + 65% carousel + 15% ticker)
3. Full Screen Menu Board (100% single zone)
4. Outdoor LED Hero Wall (100% + 10% overlay ticker)

### Playlists (6 playlists)
1. Corporate Main Lobby Sequence
2. Cafeteria Lunch Specials
3. Live Weather & World Clock Widget Reel
4. Realtime Stock & Campus RSS News Ticker
5. Executive Elevator Reel
6. Campus Events & Outdoor Showcase

### Schedules (3 rules)
1. Lobby Standard Mon-Fri 07:00–19:00 (priority 50)
2. Dining Hall Lunch Hours 11:00–15:00 Mon-Fri (priority 80)
3. Elevator Kiosk All-Day 06:00–22:00 (priority 50)
