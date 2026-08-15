# Implementation Tasks — NextGen Digital Signage Platform
**Version:** 1.0  
**เป้าหมาย:** พัฒนาระบบให้ตรงต้นแบบ 100% ตาม requirements.md + design.md + architecture.md  
**วิธีอ่าน:** ทำตามลำดับ Phase → Task → Sub-task เรียงจากบนลงล่าง

---

## 📌 สถานะการพัฒนา (อัปเดต 2026-08-12 — 🤖 โดย Freebuff)

> เอกสารนี้คือแผนเริ่มต้น (Phase 0–9) — **โปรเจคถูก implement ไปแล้วเกือบทั้งหมด**
> ตรวจสอบไฟล์จริงที่ `enterprise-digital-signage-platform/` แทนการเชื่อว่า checkbox ในนี้

- ✅ **Phase 0–9 สร้างเสร็จแล้ว** — React+Vite+Zustand+Express+WS+PostgreSQL (Drizzle) + Docker + Android player
- ✅ **2026-08-12 (Freebuff):** Security 6 จุด + Type errors 49→0 + Deploy ขึ้น prod (10.70.0.1) สำเร็จ — รายละเอียดใน `enterprise-digital-signage-platform/CHANGELOG.md` [0.2.0] และ `AGENTS.md` (root)
- ✅ **REQ-001 (IP/MAC จริงของจอ):** เสร็จแล้ว (เทสผ่าน) — ยังไม่ deploy ต้อง `redeploy.bat` — รายละเอียด `CHANGELOG.md` [0.2.1]
- ⏳ **Pending:** re-pair จอ (JWT_SECRET เปลี่ยน), เปลี่ยนรหัส admin default, แจก WEBHOOK_TOKEN, เทสหลัง deploy, deploy REQ-001
- 🔧 **งานถัดไปที่แนะนำ (จาก roadmap):** server-side scheduler, offline-first (IndexedDB) ใน web player, 6-Level Priority Resolver ให้ครบทั้ง 6 ระดับ

---

## Phase 0 — Project Bootstrap

### TASK-001: Initialize Project
- [ ] **0.1** สร้าง Vite project ด้วย React + TypeScript template
  ```bash
  bun create vite@latest enterprise-digital-signage-platform --template react-ts
  cd enterprise-digital-signage-platform
  ```
- [ ] **0.2** ติดตั้ง dependencies ทั้งหมด
  ```bash
  bun add zustand lucide-react motion qrcode.react express ws @google/genai
  bun add -d @types/ws @types/express tailwindcss @tailwindcss/vite
  ```
- [ ] **0.3** ตั้งค่า Tailwind v4 ใน `vite.config.ts` + `src/index.css`
- [ ] **0.4** สร้าง `.env.example` ตามที่กำหนดใน architecture.md §12
- [ ] **0.5** สร้าง `.gitignore` ครอบคลุม `node_modules/`, `dist/`, `.env`
- [ ] **0.6** สร้างโครงสร้างโฟลเดอร์ทั้งหมดตาม architecture.md §2

### TASK-002: Configure Tailwind & Global Styles
- [ ] **0.7** เพิ่ม Tailwind color tokens ทั้งหมดใน `tailwind.config.js`  
  (Admin colors: `surface-container-lowest` → `#0b0e14`, `primary` → `#c0c1ff`, ฯลฯ)
- [ ] **0.8** เพิ่ม Player color tokens (Signage Extension palette — `background: #131313`)
- [ ] **0.9** ตั้งค่า `borderRadius`, `fontFamily: Inter`, `fontSize` tokens ครบ
- [ ] **0.10** เพิ่ม custom CSS ใน `index.css`:
  - `.glass-card` (backdrop-blur, rgba border)
  - `.scrolling-text` + `@keyframes scroll-left`
  - `.animate-marquee` สำหรับ ticker
  - `.pulse-red` + `@keyframes pulse-red` (emergency button)
  - `.bg-emergency-pulse` + `@keyframes emergencyPulse`
  - `.animate-scroll` + `@keyframes scrollTicker`
  - Custom scrollbar (`::-webkit-scrollbar`)
  - `.timeline-track` (repeating grid lines)
  - `.pulse-animation` (sync dot)
- [ ] **0.11** โหลด Inter font จาก Google Fonts ใน `index.html`
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
  ```

---

## Phase 1 — Core Foundation

### TASK-003: TypeScript Types (`src/types/signage.ts`)
- [ ] **1.1** สร้าง type aliases: `ScreenStatus`, `Orientation`, `MediaType`, `PriorityLevel`
- [ ] **1.2** สร้าง interface `LayoutZone` (x, y, width, height %, zIndex, playlistId)
- [ ] **1.3** สร้าง interface `LayoutTemplate` (zones[], orientation, aspectRatio)
- [ ] **1.4** สร้าง interface `MediaItem` + `contentData` optional object
- [ ] **1.5** สร้าง interface `PlaylistItem` (transition: fade|slide|zoom|none)
- [ ] **1.6** สร้าง interface `Playlist` (items: PlaylistItem[])
- [ ] **1.7** สร้าง interface `ScheduleItem` (daysOfWeek[], priority 1–100)
- [ ] **1.8** สร้าง interface `DigitalScreen` (ครบทุก field ตาม architecture.md §3.6)
- [ ] **1.9** สร้าง interface `EmergencyAlert` (type union, targetScreenIds[])
- [ ] **1.10** สร้าง interface `TelemetryLog` + `ProofOfPlayLog`
- [ ] **1.11** สร้าง interface `RealtimeCommand` (command union type + payload)
- [ ] **1.12** export `AppViewMode = 'admin' | 'player' | 'simulator'`

### TASK-004: Initial Seed Data (`src/data/initialData.ts`)
- [ ] **1.13** สร้าง `INITIAL_SCREENS` — 5 จอตาม requirements.md §6
  - scr-001: Main Lobby 4K, online, landscape, `LOBBY-88`
  - scr-002: Cafeteria, online, landscape, `CAFE-20`
  - scr-003: Elevator Portrait, online, portrait, muted, `TOWER-91`
  - scr-004: Outdoor LED, syncing, landscape, `QUAD-15`
  - scr-005: Innovation Hub, offline, landscape, `CONF-04`
- [ ] **1.14** สร้าง `INITIAL_MEDIA_ITEMS` — 8 items (video×2, image×2, ticker, weather, clock, announcement)
- [ ] **1.15** สร้าง `INITIAL_LAYOUTS` — 4 templates พร้อม zones[] ครบ
  - `lay-split-3zone`: 3 zones (70/30 landscape + bottom ticker 12%)
  - `lay-portrait-kiosk`: 3 zones portrait (20/65/15%)
  - `lay-menu-board`: 1 zone fullscreen
  - `lay-hero-banner`: 2 zones (LED hero + overlay ticker)
- [ ] **1.16** สร้าง `INITIAL_PLAYLISTS` — 6 playlists พร้อม items[] และ transitions
- [ ] **1.17** สร้าง `INITIAL_SCHEDULES` — 3 schedules (priority 50/80/50)
- [ ] **1.18** สร้าง `INITIAL_EMERGENCY_ALERTS` — 2 templates (fire, weather) active=false
- [ ] **1.19** สร้าง `INITIAL_TELEMETRY_LOGS` — 4 sample logs
- [ ] **1.20** สร้าง `INITIAL_PROOF_OF_PLAY` — 3 sample records

### TASK-005: Zustand Store (`src/store/useSignageStore.ts`)
- [ ] **1.21** สร้าง `SignageStoreState` interface ครบทุก field ตาม architecture.md §4
- [ ] **1.22** implement `viewMode` + `setViewMode`
- [ ] **1.23** implement `activeAdminTab` + `setActiveAdminTab`
- [ ] **1.24** implement `wsConnected` + `setWsConnected`
- [ ] **1.25** initialize all collections จาก INITIAL_* seed data
- [ ] **1.26** implement `triggerEmergency` ตาม logic ใน architecture.md §4.1
- [ ] **1.27** implement `clearEmergency` (deactivate alert + restore screen status)
- [ ] **1.28** implement CRUD: `addScreen`, `updateScreen`, `deleteScreen`
- [ ] **1.29** implement CRUD: `addMediaItem`, `deleteMediaItem`
- [ ] **1.30** implement CRUD: `addLayout`, `updateLayout`, `deleteLayout`
- [ ] **1.31** implement CRUD: `addPlaylist`, `updatePlaylist`, `deletePlaylist`
- [ ] **1.32** implement CRUD: `addSchedule`, `updateSchedule`, `deleteSchedule`
- [ ] **1.33** implement `sendCommandToScreen` ตาม switch-case ใน architecture.md §4.2
- [ ] **1.34** implement `addTelemetryLog` (prepend to array, max 500 items)
- [ ] **1.35** implement `recordProofOfPlay` (prepend to array, max 1000 items)

---

## Phase 2 — Shell & Navigation

### TASK-006: Root App Shell (`src/App.tsx`)
- [ ] **2.1** สร้าง `App.tsx` ตาม architecture.md §7 — แสดงผลตาม `viewMode`
- [ ] **2.2** เพิ่ม `<EmergencyBanner />` บนสุด (แสดงเมื่อ active alert มีอยู่)
- [ ] **2.3** เพิ่ม `<Navbar />` พร้อม prop `onOpenEmergencyModal`
- [ ] **2.4** เพิ่ม `<main>` wrap ด้วย `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6`
- [ ] **2.5** render Admin tabs แบบ conditional ตาม `activeAdminTab`
- [ ] **2.6** render Player view ใน wrapper `bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl`
- [ ] **2.7** render DualSimulator ตรงๆ ไม่มี wrapper
- [ ] **2.8** สร้าง `<EmergencyModal>` ด้วย `isOpen` state
- [ ] **2.9** เพิ่ม Footer: platform name + version + WS port + "● System Operational"

### TASK-007: Navbar (`src/components/Navbar.tsx`)
- [ ] **2.10** สร้าง top bar `h-16` fixed + backdrop-blur + border-b
- [ ] **2.11** แสดง Logo/Brand ซ้าย + Admin Tab buttons กลาง + View switcher ขวา
- [ ] **2.12** Admin Tab buttons: Screens, Layouts, Media, Playlists, Schedule, Control, Analytics
  - Active tab: `bg-slate-700 text-white`
  - Inactive tab: `text-slate-400 hover:text-white`
- [ ] **2.13** View Mode switcher: Admin | Player | Simulator
  - Active mode: primary color highlight
- [ ] **2.14** Emergency button (ขวาสุด): สีแดง + `pulse-red` animation + icon warning
- [ ] **2.15** WS indicator dot: green `animate-ping` (connected) | amber static (disconnected)

### TASK-008: EmergencyBanner (`src/components/EmergencyBanner.tsx`)
- [ ] **2.16** แสดง sticky banner เมื่อ `emergencyAlerts.find(a => a.active)` มีค่า
- [ ] **2.17** สไตล์: `bg-rose-600 text-white` + `animate-pulse` + icon `AlertOctagon`
- [ ] **2.18** แสดง alert title + "ACTIVE" badge + timestamp
- [ ] **2.19** ซ่อนทั้งหมดเมื่อไม่มี active alert

### TASK-009: EmergencyModal (`src/components/EmergencyModal.tsx`)
- [ ] **2.20** Modal overlay `fixed inset-0 bg-black/80 backdrop-blur-sm z-50`
- [ ] **2.21** Modal card: `glass-card rounded-xl p-8 max-w-lg w-full`
- [ ] **2.22** Form fields: Alert Type select, Title input, Message textarea, Target Screens
- [ ] **2.23** ปุ่ม TRIGGER EMERGENCY: `bg-rose-600 hover:bg-rose-500 pulse-red` ขนาดใหญ่
- [ ] **2.24** ปุ่ม CLEAR ALL / Close
- [ ] **2.25** เมื่อ trigger → `store.triggerEmergency(formData)` + close modal

---

## Phase 3 — Admin Panel Modules

### TASK-010: ScreensManager (`src/components/admin/ScreensManager.tsx`)
- [ ] **3.1** Layout: `grid grid-cols-1 lg:grid-cols-12 gap-6`
- [ ] **3.2** Quick Stats panel (lg:col-span-3):
  - `display-lg` font สำหรับจำนวนจอ Online
  - Status breakdown list (Online/Offline/Warning counts + colored dots)
  - `bg-surface rounded-xl p-6 card-inner-border`
- [ ] **3.3** Screen Grid (lg:col-span-9): `grid-cols-1 md:grid-cols-2 gap-4`
- [ ] **3.4** แต่ละ Screen Card ตาม design.md §5.3 ครบทุก element:
  - Preview image (h-32) + gradient overlay + status badge
  - Camera button (hover:opacity-100, group-hover)
  - Name + location (location_on icon)
  - Tesla toggle switch
  - Footer: last sync + action button
- [ ] **3.5** Status badge logic: online=emerald, offline=gray, syncing=amber pulse, emergency=rose animate-pulse
- [ ] **3.6** Camera button → `store.sendCommandToScreen(id, 'TAKE_SCREENSHOT')`
- [ ] **3.7** Tesla toggle → `store.updateScreen(id, { status: active ? 'online' : 'offline' })`
- [ ] **3.8** "Assign Playlist" button → inline select dropdown / modal
- [ ] **3.9** "Wake Device" button → `store.sendCommandToScreen(id, 'REBOOT')`
- [ ] **3.10** Header: "Screen Management" title + Filter button + "Provision Screen" button
- [ ] **3.11** Offline card: `opacity-75` + `tv_off` icon placeholder + `sync_problem` icon + error color

### TASK-011: MediaLibrary (`src/components/admin/MediaLibrary.tsx`)
- [ ] **3.12** Header: Filter tabs (All / Video / Image / Widget) + Search input + Upload button
- [ ] **3.13** Grid layout `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4`
- [ ] **3.14** Media Card ตาม design.md §FR-04:
  - Thumbnail (h-32 bg-black, image/video/widget icon overlay top-left)
  - Duration badge bottom-right: `bg-black/70 font-code text-[10px]`
  - Title truncate + type label
  - Hover: `border-primary/50 shadow-[0_0_15px_rgba(192,193,255,0.1)]`
- [ ] **3.15** Filter logic: filter `mediaItems` by `type`
- [ ] **3.16** Search: filter by `title` + `tags`
- [ ] **3.17** Delete button (hover on card) → `store.deleteMediaItem(id)`
- [ ] **3.18** Upload button: file input trigger → `store.addMediaItem(newItem)`
  - สำหรับ demo: เพิ่มด้วยข้อมูล mock URL

### TASK-012: PlaylistEditor (`src/components/admin/PlaylistEditor.tsx`)
- [ ] **3.19** Layout 3 panels ตาม design.md §6.1 (Media Library | Preview+Timeline | Inspector)
- [ ] **3.20** Media Library Panel (w-80 glass-panel):
  - Grid 2 cols + scroll, แต่ละ card: thumbnail h-20, duration badge, type icon
  - `cursor-move` + `hover:border-primary/50 hover:shadow-[...]`
- [ ] **3.21** Playlist selector dropdown บน header (เลือก playlist ที่จะแก้ไข)
- [ ] **3.22** Preview Monitor (flex-1 glass-panel):
  - Black canvas + media thumbnail preview
  - Safe area dashed border `absolute inset-[5%] border-dashed border-white/20`
  - Playback controls overlay: prev / PLAY (primary rounded-full glow) / next
  - Stats bar: `Live Engine Active` + FPS + Timecode (font-code text-xs)
- [ ] **3.23** Inspector Panel (w-64):
  - Duration input (text, font-code)
  - Scale/Fit select: Fill | Fit | Stretch
  - Brightness slider (range -100→100)
  - Contrast slider (range -100→100)
- [ ] **3.24** Timeline Toolbar (h-12):
  - "Sequence" label + Add Track / Cut / Delete buttons
  - Loop toggle switch (primary color)
  - Zoom range slider
- [ ] **3.25** Track Headers (w-48): V1 Main + V2 Overlay rows + visibility/lock icons
- [ ] **3.26** Timeline Canvas:
  - Time Ruler (h-8, timeline-track class, timecodes every 10s)
  - Playhead: `absolute border-l border-error` + triangle marker top
  - Clip blocks: `bg-primary/20 border border-primary rounded h-16`
  - Resize handles left/right: `w-2 cursor-ew-resize hover:bg-primary/50`
  - Transition icon between clips: `w-8 h-8 animation icon` + hover tooltip dropdown
- [ ] **3.27** "Save Playlist" → `store.updatePlaylist(id, updatedPlaylist)`
- [ ] **3.28** "Preview Full" → setViewMode('player') + setPlayerScreenId

### TASK-013: SchedulerEngine (`src/components/admin/SchedulerEngine.tsx`)
- [ ] **3.29** Layout: 12-col grid (3 left + 9 right) ตาม design.md §7
- [ ] **3.30** Left: Mini Calendar (grid 7 cols, วันปัจจุบัน = primary + glow)
- [ ] **3.31** Left: Playlist List (draggable items ตาม design §7, 4 color variants)
  - Normal: white/5 border + drag_indicator icon
  - Emergency: border-error/20 + red icon/text
  - Event: border-tertiary/20 + amber text
- [ ] **3.32** Right: Timeline Grid toolbar:
  - Toggle: Timeline | Month buttons
  - Legend: Normal / Event / Emergency colored dots
- [ ] **3.33** Timeline Grid (CSS grid, 80px left col + 24 time cols):
  - Sticky time header + sticky row labels
  - time-slot cells: `min-height: 80px, hover:bg-primary/5`
  - Current Time Indicator: cyan vertical line + timestamp badge
- [ ] **3.34** Event blocks: `.event-block` + priority class ตาม design.md §7.2
- [ ] **3.35** "New Event" button → modal ให้ตั้งค่า: playlist, screen group, time range, priority, repeat
- [ ] **3.36** Save schedule → `store.addSchedule(newSchedule)`

### TASK-014: RealtimeControlConsole (`src/components/admin/RealtimeControlConsole.tsx`)
- [ ] **3.37** Emergency Section (top):
  - ปุ่ม "🚨 EMERGENCY BROADCAST" ขนาดใหญ่ `bg-rose-600 pulse-red`
  - Alert type select + custom message textarea
  - ปุ่ม "✅ CLEAR EMERGENCY" (emerald)
  - Trigger → `store.triggerEmergency(data)`
- [ ] **3.38** Screen Selector (dropdown เลือก All Screens หรือ specific screen)
- [ ] **3.39** Command Buttons Grid (2–3 คอลัมน์):
  - REBOOT (RefreshCw icon)
  - TAKE SCREENSHOT (Camera icon)
  - FORCE SYNC (Sync icon)
  - PURGE CACHE (Trash icon)
  - SET LAYOUT (Layout icon + dropdown)
  - SET VOLUME (slider 0–100)
  - แต่ละปุ่ม → `store.sendCommandToScreen(screenId, command, payload)`
- [ ] **3.40** Live Telemetry Feed (scrollable log list):
  - แสดง `telemetryLogs` ล่าสุด 50 รายการ
  - แต่ละ log: timestamp + screenName + eventType badge + message
  - eventType color: heartbeat=cyan, command_exec=indigo, error=red, media_played=emerald
- [ ] **3.41** WS Connected indicator บน header

### TASK-015: SmartLayoutBuilder (`src/components/admin/SmartLayoutBuilder.tsx`)
- [ ] **3.42** Layout Templates list sidebar (เลือก template)
- [ ] **3.43** Canvas area แสดง aspect ratio preview (16:9, 9:16, 21:9)
- [ ] **3.44** Render zones เป็น div absolute positioned (x/y/width/height %)
  - แต่ละ zone: colored border + label + playlistId badge
- [ ] **3.45** Zone Properties form panel:
  - name, backgroundColor (color picker), zIndex, playlistId (select)
- [ ] **3.46** Add Zone / Delete Zone
- [ ] **3.47** Save Layout → `store.updateLayout(id, layout)` หรือ `store.addLayout`

### TASK-016: AnalyticsTelemetry (`src/components/admin/AnalyticsTelemetry.tsx`)
- [ ] **3.48** Summary Cards row (4 cards): Total Play Events, Total Duration, Error Count, Uptime %
- [ ] **3.49** Proof of Play table: Screen | Media Title | Played At | Duration | Status badge
- [ ] **3.50** Telemetry Log table: Screen | Timestamp | Event Type | Message
- [ ] **3.51** Filter controls: Screen dropdown + Event Type filter + date range
- [ ] **3.52** Event Type badges ใช้สีตาม §3.40
- [ ] **3.53** Status badge ใน PoP: completed=emerald, interrupted=amber, buffered=cyan
- [ ] **3.54** Bar chart (SVG หรือ CSS bars) แสดง media play frequency per item

---

## Phase 4 — Player Engine

### TASK-017: PlayerApp (`src/components/player/PlayerApp.tsx`)
- [ ] **4.1** รับ `playerScreenId` จาก store → หา `activeScreen`
- [ ] **4.2** หา `activeLayout` จาก `activeScreen.currentLayoutId`
- [ ] **4.3** หา `activeEmergency` = `emergencyAlerts.find(a => a.active)`
- [ ] **4.4** Clock state: `useState(new Date())` + `setInterval(1000)` cleanup
- [ ] **4.5** OSD state: `showOsd` + `setTimeout(8000)` auto-hide ตาม architecture.md §5.4
- [ ] **4.6** Fullscreen toggle ด้วย `document.fullscreenElement` API
- [ ] **4.7** Conditional render: `showPairingQr` → `<PairingQRCode />`
- [ ] **4.8** Emergency Overlay ตาม requirements.md FR-11:
  - `absolute inset-0 z-50 bg-rose-950/95`
  - `border-8 border-rose-500 animate-pulse`
  - AlertOctagon icon (`h-24 w-24 animate-bounce`)
  - "🚨 EMERGENCY OVERRIDE BROADCAST" badge
  - title (`text-3xl sm:text-5xl font-black`)
  - message (`text-lg sm:text-2xl text-rose-100`)
  - timestamp footer (font-mono text-rose-300)
- [ ] **4.9** Multi-Zone Canvas wrapper:
  - landscape: `w-full aspect-video`
  - portrait: `max-w-[480px] mx-auto aspect-[9/16]`
  - `relative w-full h-full bg-black overflow-hidden`
- [ ] **4.10** Map zones → `<ZoneContainer key={zone.id} zone={zone} ... />`
- [ ] **4.11** OSD Bar (absolute bottom-0 z-40, `transition-all` opacity/translate):
  - Left: ping dot + Screen name (bold) + pairingCode (font-mono slate-400)
  - Left: Buffer Cache badge (HardDrive icon + "Buffer Cache: 100% Synced")
  - Right: Offline toggle button (amber/emerald styling)
  - Right: Screen picker `<select>` (bg-slate-900 border rounded-xl)
  - Right: QR button (QrCode icon, text-cyan-400)
  - Right: Fullscreen toggle (Maximize2/Minimize2)
  - Right: "Exit Player" button (bg-blue-600)

### TASK-018: ZoneContainer (inside PlayerApp.tsx)
- [ ] **4.12** `absolute overflow-hidden flex-col justify-center items-center`
- [ ] **4.13** Style: `left/top/width/height` จาก `zone.x/y/width/height` %
- [ ] **4.14** `zIndex: zone.zIndex`, `backgroundColor: zone.backgroundColor`
- [ ] **4.15** หา `playlist` จาก `zone.playlistId`
- [ ] **4.16** `useState(currentIndex)` — วนผ่าน `playlist.items`
- [ ] **4.17** `useEffect` ตาม architecture.md §9.2:
  - `setTimeout(duration * 1000)` → advance index + `recordProofOfPlay`
  - cleanup: `clearTimeout`
- [ ] **4.18** Render `<MediaRenderer media={activeMedia} isMuted={...} currentTime={...} />`
- [ ] **4.19** Fallback (ไม่มี media): แสดง zone name (text-slate-500 text-[10px] uppercase)

### TASK-019: MediaRenderer (inside PlayerApp.tsx)
- [ ] **4.20** `video` → `<video autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover" />`
- [ ] **4.21** `image` → `<img className="w-full h-full object-cover animate-fade-in" />`
- [ ] **4.22** `ticker` → Ticker bar:
  - `w-full h-full bg-slate-900 border-t border-cyan-500/40 flex items-center overflow-hidden px-4`
  - Left label: `Radio icon animate-pulse` + "NEWS TICKER:"
  - Text: `whitespace-nowrap animate-marquee` จาก `contentData.tickerText`
- [ ] **4.23** `weather` → Weather widget:
  - `bg-gradient-to-tr from-slate-900 via-slate-950 to-blue-950`
  - Label "LOCAL WEATHER & AIR QUALITY" + CloudSun icon
  - City name (`text-xl font-bold`) + temp (`text-4xl font-black`) + condition/AQI
- [ ] **4.24** `clock` → Clock widget:
  - `bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950`
  - Clock icon (cyan-400) + `toLocaleTimeString()` (`text-3xl font-black font-mono text-cyan-300`)
  - Date: `toLocaleDateString(undefined, { weekday:'long', month:'short', day:'numeric', year:'numeric' })`
- [ ] **4.25** `announcement` → Announcement card:
  - Dark gradient bg + header text (`font-bold text-amber-300 uppercase tracking-widest`)
  - Body text (`text-slate-100 text-sm leading-relaxed`)
- [ ] **4.26** `webpage` → `<iframe src={contentData.webUrl} className="w-full h-full border-none" />`

### TASK-020: PairingQRCode (`src/components/player/PairingQRCode.tsx`)
- [ ] **4.27** รับ `initialCode: string` + `onPairSuccess: () => void` props
- [ ] **4.28** แสดง QR Code ด้วย `qrcode.react` library
- [ ] **4.29** Countdown timer (simulate 5 นาที expire)
- [ ] **4.30** "Paired Successfully" simulate button → เรียก `onPairSuccess()`
- [ ] **4.31** Dark background + centered layout + pairing code text ขนาดใหญ่

---

## Phase 5 — Player Display Modes

### TASK-021: Player Fullscreen Mode (Standalone Display)
- [ ] **5.1** สร้าง WebGL Canvas component ตาม design.md §8.1:
  - `<canvas>` + `ResizeObserver` sync size
  - Vertex + Fragment shader (undulating gradient + vignette)
  - `requestAnimationFrame` render loop
- [ ] **5.2** Topbar (fixed top, pointer-events-none):
  - Logo/Name (`font-display-title text-white/90 tracking-tight`) ซ้าย
  - Sync indicator (cyan pulse dot + glow + sync icon) ขวา
- [ ] **5.3** Media Canvas area (absolute inset-0 -z-10, `p-margin-page`):
  - Inner container: `rounded-xl border border-outline/20 overflow-hidden`
  - Media: `bg-cover bg-center opacity-80 mix-blend-screen`
  - Vignette: `absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-90`
- [ ] **5.4** Bottom Ticker Bar (fixed bottom-0, h-32) ตาม design.md §8.3:
  - Clock section (border-r): time (`display-title`) + AM/PM (`headline-lg`) + date (`label-caps`)
  - Scrolling text (flex-grow): `font-headline-lg` + `animation: scroll-left 25s linear infinite`
  - Weather section (border-l): Material Symbol icon 64px + temp (`display-title`)
- [ ] **5.5** JavaScript clock: `setInterval(updateClock, 1000)` อัปเดต hours:minutes + AM/PM + date

### TASK-022: Emergency Mode (Player Override)
- [ ] **5.6** `body { overflow: hidden }` เมื่อ emergency active
- [ ] **5.7** `<main>` — `bg-emergency-pulse z-[9999] p-margin-page`:
  - Radial vignette overlay (opacity-20)
  - Warning icon: Material Symbol 240px, FILL=1, wght=700, text-white
  - `<h1>` — `font-display-hero text-display-hero text-white tracking-tighter uppercase drop-shadow-2xl`
- [ ] **5.8** Emergency footer ticker (fixed bottom-0, h-24):
  - `font-headline-lg text-error uppercase font-bold tracking-wider`
  - `animation: scrollTicker 15s linear infinite`
  - ข้อความ: "EMERGENCY PROTOCOL ACTIVE | FOLLOW TEACHER INSTRUCTIONS | DO NOT USE ELEVATORS | ..."

---

## Phase 6 — Simulator & Shared Components

### TASK-023: DualSimulator (`src/components/simulator/DualSimulator.tsx`)
- [ ] **6.1** Layout แนวนอน: Admin panel ซ้าย + Player ขวา (flex, gap)
- [ ] **6.2** ฝั่ง Admin: `<RealtimeControlConsole />` + `<ScreensManager />` (compressed)
- [ ] **6.3** ฝั่ง Player: `<PlayerApp />` ใน container พร้อม border/rounded
- [ ] **6.4** Label header ทั้งสองฝั่ง: "ADMIN CONTROL" | "LIVE PLAYER PREVIEW"
- [ ] **6.5** เมื่อ Admin กดคำสั่ง → Player ตอบสนองทันที (ผ่าน Zustand store)

---

## Phase 7 — Backend Server

### TASK-024: Express + WebSocket Server (`server.ts`)
- [ ] **7.1** สร้าง `server.ts` ตาม architecture.md §6.1 ครบทุกส่วน
- [ ] **7.2** `connectedClients = new Set<WebSocket>()` track ทุก connection
- [ ] **7.3** `INIT_CONNECTED` message เมื่อ client เชื่อมต่อ
- [ ] **7.4** Relay all messages ไปยัง clients อื่น (ยกเว้น sender)
- [ ] **7.5** `broadcastWSEvent(type, payload)` helper function
- [ ] **7.6** implement `GET /api/health` — return uptime + connectedClients
- [ ] **7.7** implement `POST /api/emergency/trigger` — broadcast EMERGENCY_TRIGGERED
- [ ] **7.8** implement `POST /api/emergency/clear` — broadcast EMERGENCY_CLEARED
- [ ] **7.9** implement `POST /api/control/command` — broadcast SCREEN_COMMAND
- [ ] **7.10** implement `POST /api/telemetry/heartbeat` — broadcast SCREEN_HEARTBEAT
- [ ] **7.11** Dev mode: mount Vite middleware (`createViteServer middlewareMode: true`)
- [ ] **7.12** Production mode: serve `dist/` static + SPA fallback `*` → `index.html`
- [ ] **7.13** Listen on `PORT` (default 3000) + `0.0.0.0`

---

## Phase 8 — Production Hardening

### TASK-025: Memory Management (Android TV / Low-spec)
- [ ] **8.1** Video cleanup function ตาม architecture.md §10.3:
  ```typescript
  function destroyVideo(el: HTMLVideoElement) {
    el.pause(); el.removeAttribute('src'); el.load();
  }
  ```
- [ ] **8.2** เรียก `destroyVideo` ใน `useEffect` cleanup ของ `MediaRenderer` (video type)
- [ ] **8.3** ถ้าใช้ `URL.createObjectURL(blob)` → เรียก `URL.revokeObjectURL(url)` ใน cleanup
- [ ] **8.4** Implement A/B Video Buffering (videoA + videoB elements) สำหรับ seamless switch

### TASK-026: WakeLock & Offline Support
- [ ] **8.5** implement `requestWakeLock()` ตาม architecture.md §10.4
- [ ] **8.6** Re-acquire on `document.addEventListener('visibilitychange', ...)`
- [ ] **8.7** Offline simulation toggle ใน OSD ทำงานได้ (isSimulatedOffline state)
- [ ] **8.8** เมื่อ `isSimulatedOffline = true`: แสดง "OFFLINE SIMULATION" badge (amber)
- [ ] **8.9** เมื่อ `isSimulatedOffline = false`: แสดง "ONLINE CLOUD SYNC" badge (emerald)

---

## Phase 9 — Polish & Verification

### TASK-027: Animations & Transitions
- [ ] **9.1** ตรวจสอบ `animate-pulse` บน Emergency badge ทำงานถูกต้อง
- [ ] **9.2** ตรวจสอบ `animate-ping` บน Online dot ทำงานถูกต้อง
- [ ] **9.3** ตรวจสอบ `scrolling-text` ใน Fullscreen ticker วิ่งได้ (25s loop)
- [ ] **9.4** ตรวจสอบ `scrollTicker` ใน Emergency footer วิ่งได้ (15s)
- [ ] **9.5** ตรวจสอบ `emergencyPulse` background สลับสีได้ (1.5s)
- [ ] **9.6** ตรวจสอบ OSD bar fade in/out (transition-all duration-300)
- [ ] **9.7** ตรวจสอบ `pulse-animation` บน Sync dot ใน Player fullscreen

### TASK-028: Responsive & Accessibility
- [ ] **9.8** Admin Panel: sidebar ซ่อนบน mobile (`hidden md:flex`)
- [ ] **9.9** Mobile header แสดงบน mobile (`md:hidden`)
- [ ] **9.10** Topbar: left-[280px] → left-0 บน mobile
- [ ] **9.11** Touch targets ≥ 48px สำหรับปุ่มทุกปุ่มบน mobile
- [ ] **9.12** Emergency overlay contrast ratio ≥ 7:1 (white on rose-950)
- [ ] **9.13** Screen reader: `aria-label` บนปุ่ม icon-only

### TASK-029: Final Verification Checklist
- [ ] **9.14** Admin → Screens: จอ 5 จอแสดงครบ + สถานะถูกต้อง
- [ ] **9.15** Admin → Media: สื่อ 8 items แสดงครบ + icon ถูก type
- [ ] **9.16** Admin → Playlists: playlist 6 รายการ + items ครบ
- [ ] **9.17** Admin → Schedule: timeline grid แสดง 3 events ถูก priority color
- [ ] **9.18** Admin → Control: ทุก command ทำงาน → telemetry log อัปเดต
- [ ] **9.19** Admin → Analytics: PoP log + telemetry log แสดงข้อมูล seed
- [ ] **9.20** Player Mode: Multi-zone render ถูกต้องตาม lay-split-3zone
- [ ] **9.21** Player Mode: เปลี่ยนจอผ่าน Screen picker → layout เปลี่ยนตาม
- [ ] **9.22** Player Mode: Ticker zone เล่น med-005 วิ่งได้
- [ ] **9.23** Player Mode: Clock zone แสดงเวลาจริง อัปเดตทุกวินาที
- [ ] **9.24** Emergency: Trigger → ทุกจอ status = emergency + overlay ขึ้น Player
- [ ] **9.25** Emergency: Clear → status กลับ online + overlay หาย
- [ ] **9.26** REBOOT command: screen status = syncing 3 วิ → online
- [ ] **9.27** TAKE_SCREENSHOT: `lastScreenshotUrl` อัปเดต + แสดงใน card
- [ ] **9.28** Simulator Mode: Admin action → Player ตอบสนองทันที
- [ ] **9.29** OSD auto-hide: ไม่ขยับ mouse 8 วิ → bar ซ่อน, ขยับ → แสดง
- [ ] **9.30** QR Pairing: คลิก QR button → PairingQRCode แสดง → Return กลับ Player

---

## สรุปจำนวน Tasks

| Phase | หัวข้อ | จำนวน Sub-tasks |
|-------|--------|----------------|
| 0 | Project Bootstrap | 11 |
| 1 | Core Foundation (Types, Data, Store) | 35 |
| 2 | Shell & Navigation | 25 |
| 3 | Admin Panel (6 modules) | 42 |
| 4 | Player Engine | 31 |
| 5 | Player Display Modes | 8 |
| 6 | Simulator | 5 |
| 7 | Backend Server | 13 |
| 8 | Production Hardening | 9 |
| 9 | Polish & Verification | 17 |
| **รวม** | | **~196 sub-tasks** |

---

## ลำดับความสำคัญ (Priority Order)

```
CRITICAL PATH (ต้องทำก่อน):
  Phase 0 → Phase 1 (Types + Data + Store) → Phase 7 (Server) → Phase 2 (Shell)
    → Phase 3 (Screens + Control) → Phase 4 (Player Core + Emergency)

PARALLEL (ทำคู่กันได้หลัง Critical Path):
  Phase 3 remaining modules (Media, Playlist, Schedule, Analytics, Layout)
  Phase 5 (Fullscreen + Emergency display modes)

LAST (polish):
  Phase 6 (Simulator) → Phase 8 (Hardening) → Phase 9 (Verification)
```
