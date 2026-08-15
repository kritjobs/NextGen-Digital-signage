# Architecture Specification — NextGen Digital Signage Platform
**Version:** 1.0  
**Stack:** React 19 + Vite + Zustand + Express + WebSocket + Tailwind v4  
**Pattern:** Monorepo-ready, Offline-First, Realtime Pub/Sub

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BROWSER / ELECTRON / WEBVIEW                 │
│                                                                   │
│  ┌─────────────────────┐    ┌──────────────────────────────────┐ │
│  │   ADMIN PANEL (CMS) │    │        PLAYER ENGINE             │ │
│  │                     │    │                                  │ │
│  │  ScreensManager     │    │  ┌─────────────────────────────┐ │ │
│  │  MediaLibrary       │    │  │  Smart Layout Engine        │ │ │
│  │  PlaylistEditor     │◄───┼──│  Priority Scheduler         │ │ │
│  │  SchedulerEngine    │    │  │  Preload & Buffer Engine    │ │ │
│  │  ControlConsole     │    │  │  IndexedDB Cache Engine     │ │ │
│  │  AnalyticsTelemetry │    │  │  Memory & GC Optimizer      │ │ │
│  └────────┬────────────┘    └──────────────┬───────────────────┘ │
│           │                                │                      │
│           └──────────┬─────────────────────┘                      │
│                      │  Zustand Store (useSignageStore)            │
└──────────────────────┼─────────────────────────────────────────────┘
                       │ HTTP REST + WebSocket (ws://)
┌──────────────────────▼─────────────────────────────────────────────┐
│                    EXPRESS + WS SERVER (server.ts)                  │
│                                                                     │
│  GET  /api/health              POST /api/emergency/trigger          │
│  POST /api/emergency/clear     POST /api/control/command            │
│  POST /api/telemetry/heartbeat                                      │
│                                                                     │
│  WebSocketServer (path: /ws) — Broadcast Hub                       │
│    INIT_CONNECTED | EMERGENCY_TRIGGERED | EMERGENCY_CLEARED        │
│    SCREEN_COMMAND | SCREEN_HEARTBEAT                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Project Structure

```
src/
├── App.tsx                        # Root — 3 view modes + Emergency Modal
├── main.tsx                       # Vite entry, StrictMode
├── index.css                      # Tailwind directives + custom animations
│
├── types/
│   └── signage.ts                 # All TypeScript interfaces & enums
│
├── store/
│   └── useSignageStore.ts         # Zustand store — single source of truth
│
├── data/
│   └── initialData.ts             # Seed data (5 screens, 8 media, 4 layouts…)
│
├── components/
│   ├── Navbar.tsx                 # Top navigation + view mode switcher
│   ├── EmergencyBanner.tsx        # Flashing banner (when emergency active)
│   ├── EmergencyModal.tsx         # Trigger emergency modal dialog
│   │
│   ├── admin/
│   │   ├── ScreensManager.tsx     # FR-03 — Screen grid + quick stats
│   │   ├── SmartLayoutBuilder.tsx # FR-09 — Zone canvas editor
│   │   ├── MediaLibrary.tsx       # FR-04 — Media grid + upload
│   │   ├── PlaylistEditor.tsx     # FR-05 — Timeline editor
│   │   ├── SchedulerEngine.tsx    # FR-06 — Gantt timeline scheduler
│   │   ├── RealtimeControlConsole.tsx # FR-07 — Commands + emergency
│   │   └── AnalyticsTelemetry.tsx # FR-08 — Logs + charts
│   │
│   ├── player/
│   │   ├── PlayerApp.tsx          # FR-10–13 — Multi-zone renderer + OSD
│   │   └── PairingQRCode.tsx      # FR-16 — QR pairing screen
│   │
│   └── simulator/
│       └── DualSimulator.tsx      # Admin + Player side-by-side
│
server.ts                          # Express + WebSocket server
vite.config.ts
tsconfig.json
package.json
```

---

## 3. TypeScript Data Model (Complete)

### 3.1 Core Enums & Primitives

```typescript
type ScreenStatus   = 'online' | 'offline' | 'syncing' | 'error' | 'emergency';
type Orientation    = 'landscape' | 'portrait' | 'custom';
type MediaType      = 'image' | 'video' | 'ticker' | 'weather' |
                      'clock' | 'webpage' | 'announcement';
type PriorityLevel  = 'emergency' | 'scheduled' | 'default';
type AppViewMode    = 'admin' | 'player' | 'simulator';
```

### 3.2 LayoutZone & LayoutTemplate

```typescript
interface LayoutZone {
  id: string;
  name: string;
  x: number;           // % 0–100 (left offset)
  y: number;           // % 0–100 (top offset)
  width: number;       // % 0–100
  height: number;      // % 0–100
  zIndex: number;
  playlistId?: string;
  mediaType?: MediaType;
  backgroundColor?: string;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  orientation: Orientation;
  aspectRatio: string;   // "16:9" | "9:16" | "21:9"
  widthPx: number;
  heightPx: number;
  zones: LayoutZone[];
  createdAt: string;     // ISO 8601
  updatedAt: string;
}
```

### 3.3 MediaItem

```typescript
interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  duration: number;      // seconds
  sizeMb: number;
  tags: string[];
  thumbnailUrl: string;
  contentData?: {
    tickerText?: string;
    speed?: number;           // ticker scroll speed
    weatherCity?: string;
    clockFormat?: '12h' | '24h';
    announcementHeader?: string;
    announcementBody?: string;
    webUrl?: string;
  };
  createdAt: string;
}
```

### 3.4 Playlist & PlaylistItem

```typescript
interface PlaylistItem {
  id: string;
  mediaId: string;
  duration: number;     // override duration (seconds)
  order: number;        // 1-based sort order
  transition: 'fade' | 'slide' | 'zoom' | 'none';
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  items: PlaylistItem[];
  totalDuration: number;  // sum of all item durations
  tags: string[];
  updatedAt: string;
}
```

### 3.5 ScheduleItem

```typescript
interface ScheduleItem {
  id: string;
  name: string;
  playlistId?: string;
  layoutId?: string;
  screenGroupIds: string[];  // group names e.g. "HQ Reception"
  screenIds: string[];       // specific screen IDs
  priority: number;          // 1–100 (Emergency=100, Scheduled=50, Default=10)
  startDate: string;         // "YYYY-MM-DD"
  endDate: string;
  startTime: string;         // "HH:MM" (24h)
  endTime: string;
  daysOfWeek: number[];      // 0=Sun, 1=Mon … 6=Sat
  isActive: boolean;
}
```

### 3.6 DigitalScreen

```typescript
interface DigitalScreen {
  id: string;
  pairingCode: string;          // e.g. "LOBBY-88"
  name: string;
  group: string;                // e.g. "HQ Reception"
  location: string;
  orientation: Orientation;
  resolution: string;           // e.g. "3840x2160 (4K)"
  status: ScreenStatus;
  lastHeartbeat: string;        // ISO 8601
  ipAddress: string;
  macAddress: string;
  storageUsageMb: number;
  storageTotalMb: number;
  bufferCachedItemsCount: number;
  currentLayoutId?: string;
  currentPlaylistId?: string;
  activeEmergencyId?: string;
  volume: number;               // 0–100
  isMuted: boolean;
  firmwareVersion: string;
  uptimeSeconds: number;
  lastScreenshotUrl?: string;
}
```

### 3.7 EmergencyAlert

```typescript
interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  type: 'fire' | 'weather' | 'lockdown' | 'custom' | 'all-clear';
  severity: 'critical' | 'warning' | 'info';
  targetScreenIds: string[];  // [] = ALL screens
  active: boolean;
  triggeredAt: string;
  triggeredBy: string;
}
```

### 3.8 Telemetry & Proof of Play

```typescript
interface TelemetryLog {
  id: string;
  screenId: string;
  screenName: string;
  timestamp: string;
  eventType: 'heartbeat' | 'media_played' | 'buffer_cached' |
             'offline_mode' | 'command_exec' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

interface ProofOfPlayLog {
  id: string;
  screenId: string;
  screenName: string;
  mediaId: string;
  mediaTitle: string;
  playedAt: string;
  durationSeconds: number;
  status: 'completed' | 'interrupted' | 'buffered';
}
```

### 3.9 RealtimeCommand

```typescript
interface RealtimeCommand {
  command: 'TRIGGER_EMERGENCY' | 'CLEAR_EMERGENCY' | 'REBOOT' |
           'TAKE_SCREENSHOT' | 'SYNC_PLAYBACK' | 'PURGE_CACHE' |
           'SET_LAYOUT' | 'SET_VOLUME';
  payload?: {
    layoutId?: string;    // SET_LAYOUT
    volume?: number;      // SET_VOLUME (0–100)
    alertId?: string;     // CLEAR_EMERGENCY
    [key: string]: unknown;
  };
  targetScreenId?: string;
}
```

---

## 4. Zustand Store — Complete State Shape

```typescript
// store/useSignageStore.ts
interface SignageStoreState {
  // ─── Navigation & View ───────────────────────────────────────
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;

  activeAdminTab: 'screens' | 'layouts' | 'playlists' | 'media' |
                  'schedules' | 'control' | 'telemetry';
  setActiveAdminTab: (tab: typeof activeAdminTab) => void;

  // ─── WebSocket ───────────────────────────────────────────────
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // ─── Core Data Collections ───────────────────────────────────
  screens: DigitalScreen[];
  mediaItems: MediaItem[];
  layouts: LayoutTemplate[];
  playlists: Playlist[];
  schedules: ScheduleItem[];
  emergencyAlerts: EmergencyAlert[];
  telemetryLogs: TelemetryLog[];
  proofOfPlayLogs: ProofOfPlayLog[];

  // ─── Active Selections ───────────────────────────────────────
  selectedScreenId: string | null;
  setSelectedScreenId: (id: string | null) => void;
  selectedLayoutId: string | null;
  setSelectedLayoutId: (id: string | null) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;

  // ─── Player State ────────────────────────────────────────────
  playerScreenId: string;
  setPlayerScreenId: (id: string) => void;
  isSimulatedOffline: boolean;
  setIsSimulatedOffline: (offline: boolean) => void;
  playerBufferProgress: number;  // 0–100

  // ─── Emergency Actions ───────────────────────────────────────
  triggerEmergency: (alertData: Partial<EmergencyAlert>) => void;
  clearEmergency: (alertId: string) => void;

  // ─── CRUD: Screens ───────────────────────────────────────────
  addScreen: (screen: DigitalScreen) => void;
  updateScreen: (id: string, partial: Partial<DigitalScreen>) => void;
  deleteScreen: (id: string) => void;

  // ─── CRUD: Media ─────────────────────────────────────────────
  addMediaItem: (media: MediaItem) => void;
  deleteMediaItem: (id: string) => void;

  // ─── CRUD: Layouts ───────────────────────────────────────────
  addLayout: (layout: LayoutTemplate) => void;
  updateLayout: (id: string, partial: Partial<LayoutTemplate>) => void;
  deleteLayout: (id: string) => void;

  // ─── CRUD: Playlists ─────────────────────────────────────────
  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, partial: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;

  // ─── CRUD: Schedules ─────────────────────────────────────────
  addSchedule: (schedule: ScheduleItem) => void;
  updateSchedule: (id: string, partial: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;

  // ─── Remote Commands ─────────────────────────────────────────
  sendCommandToScreen: (screenId: string,
                        command: RealtimeCommand['command'],
                        payload?: Record<string, unknown>) => void;

  // ─── Telemetry & PoP ─────────────────────────────────────────
  addTelemetryLog: (log: Omit<TelemetryLog, 'id'>) => void;
  recordProofOfPlay: (pop: Omit<ProofOfPlayLog, 'id'>) => void;
}
```

### 4.1 `triggerEmergency` Logic

```typescript
triggerEmergency: (alertData) => {
  const newAlert: EmergencyAlert = {
    id: 'emg-' + Date.now(),
    title:    alertData.title    || 'EMERGENCY BROADCAST ALERT',
    message:  alertData.message  || 'ATTENTION ALL OCCUPANTS: Follow facility emergency safety guidelines immediately.',
    type:     alertData.type     || 'custom',
    severity: alertData.severity || 'critical',
    targetScreenIds: alertData.targetScreenIds || [],  // [] = ALL screens
    active: true,
    triggeredAt: new Date().toISOString(),
    triggeredBy: 'Security Operations Center',
  };

  set((state) => ({
    // Deactivate all previous alerts, add new one at front
    emergencyAlerts: [newAlert, ...state.emergencyAlerts.map(a => ({ ...a, active: false }))],
    // Mark affected screens as 'emergency'
    screens: state.screens.map((scr) => {
      const isTargeted = newAlert.targetScreenIds.length === 0 ||
                         newAlert.targetScreenIds.includes(scr.id);
      return isTargeted
        ? { ...scr, status: 'emergency', activeEmergencyId: newAlert.id }
        : scr;
    }),
  }));

  get().addTelemetryLog({
    screenId: 'ALL', screenName: 'GLOBAL SYSTEM BROADCAST',
    timestamp: new Date().toISOString(), eventType: 'command_exec',
    message: `🚨 EMERGENCY TRIGGERED: ${newAlert.title}`,
  });
},
```

### 4.2 `sendCommandToScreen` Logic

```typescript
sendCommandToScreen: (screenId, command, payload) => {
  const scr = get().screens.find(s => s.id === screenId);

  switch (command) {
    case 'REBOOT':
      get().updateScreen(screenId, { status: 'syncing', uptimeSeconds: 0 });
      setTimeout(() => get().updateScreen(screenId, { status: 'online' }), 3000);
      break;

    case 'TAKE_SCREENSHOT':
      const urls = [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800',
      ];
      get().updateScreen(screenId, { lastScreenshotUrl: urls[Math.floor(Math.random() * urls.length)] });
      break;

    case 'PURGE_CACHE':
      get().updateScreen(screenId, { storageUsageMb: 250, bufferCachedItemsCount: 0 });
      break;

    case 'SET_LAYOUT':
      if (payload?.layoutId) get().updateScreen(screenId, { currentLayoutId: payload.layoutId as string });
      break;

    case 'SET_VOLUME':
      if (payload?.volume !== undefined) {
        const vol = payload.volume as number;
        get().updateScreen(screenId, { volume: vol, isMuted: vol === 0 });
      }
      break;
  }

  get().addTelemetryLog({
    screenId, screenName: scr?.name || 'Unknown',
    timestamp: new Date().toISOString(), eventType: 'command_exec',
    message: `Executed WebSocket Command: ${command} ${payload ? JSON.stringify(payload) : ''}`,
  });
},
```

---

## 5. Player Engine — Component Architecture

### 5.1 PlayerApp Component Tree

```
<PlayerApp>
  ├── [Condition] showPairingQr → <PairingQRCode />
  │
  ├── Emergency Check: activeEmergency?
  │   └── [TRUE] <EmergencyOverlay />     ← absolute inset-0 z-50
  │
  ├── Multi-Zone Canvas (relative, aspect-video | aspect-[9/16])
  │   └── activeLayout.zones.map(zone =>
  │         <ZoneContainer key={zone.id} zone={zone} ... />
  │       )
  │
  └── OSD Bar (absolute bottom-0 z-40, fade in/out on mouse move)
      ├── Screen name + Pairing Code + Buffer status
      ├── Offline toggle button
      ├── Screen picker <select>
      ├── QR button
      ├── Fullscreen toggle
      └── Exit Player button
```

### 5.2 ZoneContainer

```typescript
// ตำแหน่งจาก zone.x/y/width/height (%) ทำเป็น absolute positioning
const style = {
  left:   `${zone.x}%`,
  top:    `${zone.y}%`,
  width:  `${zone.width}%`,
  height: `${zone.height}%`,
  zIndex: zone.zIndex,
  backgroundColor: zone.backgroundColor || '#020617',
};

// State: currentIndex — วนผ่าน playlist.items[]
// Effect: setTimeout → advance index + record ProofOfPlay
// Render: <MediaRenderer media={activeMedia} />
```

### 5.3 MediaRenderer Decision Tree

```
MediaRenderer({ media, isMuted, currentTime })
  media.type === 'video'        → <video autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover" />
  media.type === 'image'        → <img className="w-full h-full object-cover animate-fade-in" />
  media.type === 'ticker'       → TickerBar (cyan label + animate-marquee)
  media.type === 'weather'      → WeatherWidget (gradient card, temp 4xl, AQI)
  media.type === 'clock'        → ClockWidget (gradient card, toLocaleTimeString 3xl mono)
  media.type === 'announcement' → AnnouncementCard (header + body on dark gradient)
  media.type === 'webpage'      → <iframe src={media.contentData?.webUrl} />
  default                       → null
```

### 5.4 OSD Auto-Hide Logic

```typescript
// Reset 8-second timer ทุกครั้งที่ showOsd เปลี่ยน
useEffect(() => {
  const timer = setTimeout(() => setShowOsd(false), 8000);
  return () => clearTimeout(timer);
}, [showOsd]);

// onMouseMove บน container → setShowOsd(true)
<div onMouseMove={() => setShowOsd(true)} ...>
```

---

## 6. Backend Server Architecture (server.ts)

### 6.1 Server Setup

```typescript
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const httpServer = createServer(app);

  app.use(express.json());

  // ── WebSocket Hub ──────────────────────────────────────────
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connectedClients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    connectedClients.add(ws);
    ws.send(JSON.stringify({ type: 'INIT_CONNECTED', timestamp: new Date().toISOString() }));

    ws.on('message', (raw) => {
      // Relay all messages to other clients (Player ↔ Admin sync)
      const msg = JSON.parse(raw.toString());
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN)
          client.send(JSON.stringify(msg));
      });
    });

    ws.on('close', () => connectedClients.delete(ws));
  });

  // ── Broadcast Helper ───────────────────────────────────────
  function broadcastWSEvent(type: string, payload: unknown) {
    const data = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) client.send(data);
    });
  }

  // ── REST API Routes ────────────────────────────────────────
  // (see section 6.2)

  // ── Vite Dev Middleware / Static Serve ─────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.join(process.cwd(), 'dist/index.html')));
  }

  httpServer.listen(PORT, '0.0.0.0');
}
```

### 6.2 REST API Contracts

#### GET `/api/health`
```json
// Response 200
{
  "status": "ok",
  "service": "Enterprise Digital Signage Engine",
  "uptime": 3820.5,
  "connectedClients": 3,
  "timestamp": "2026-08-04T10:34:00.000Z"
}
```

#### POST `/api/emergency/trigger`
```json
// Request Body
{
  "title": "FIRE EVACUATION WARNING",
  "message": "PLEASE EVACUATE THE BUILDING IMMEDIATELY.",
  "type": "fire",
  "severity": "critical",
  "targetScreenIds": []
}
// Response 200
{
  "success": true,
  "alert": { "id": "emg-1722765240000", "active": true, ... }
}
// Side-effect: broadcastWSEvent('EMERGENCY_TRIGGERED', alert)
```

#### POST `/api/emergency/clear`
```json
// Request Body
{ "alertId": "emg-1722765240000" }
// Response 200
{ "success": true, "alertId": "emg-1722765240000" }
// Side-effect: broadcastWSEvent('EMERGENCY_CLEARED', { alertId })
```

#### POST `/api/control/command`
```json
// Request Body
{ "screenId": "scr-001", "command": "REBOOT", "payload": {} }
// Response 200
{ "success": true, "screenId": "scr-001", "command": "REBOOT", "payload": {} }
// Side-effect: broadcastWSEvent('SCREEN_COMMAND', { screenId, command, payload })
```

#### POST `/api/telemetry/heartbeat`
```json
// Request Body
{ "screenId": "scr-001", "status": "online", "storageUsageMb": 2450, "uptimeSeconds": 864200 }
// Response 200
{ "success": true, "receivedAt": "2026-08-04T10:34:00.000Z" }
// Side-effect: broadcastWSEvent('SCREEN_HEARTBEAT', { screenId, status, storageUsageMb, uptimeSeconds })
```

### 6.3 WebSocket Event Payloads

| Event Type | Direction | Payload |
|------------|-----------|---------|
| `INIT_CONNECTED` | Server → Client | `{ message, timestamp }` |
| `EMERGENCY_TRIGGERED` | Broadcast | `EmergencyAlert object` |
| `EMERGENCY_CLEARED` | Broadcast | `{ alertId: string }` |
| `SCREEN_COMMAND` | Broadcast | `{ screenId, command, payload }` |
| `SCREEN_HEARTBEAT` | Broadcast | `{ screenId, status, storageUsageMb, uptimeSeconds }` |

---

## 7. App.tsx — Root Component Logic

```typescript
// src/App.tsx
export default function App() {
  const { viewMode, activeAdminTab } = useSignageStore();
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans
                    selection:bg-cyan-500 selection:text-black">
      <EmergencyBanner />   {/* Flash bar — visible when any alert is active */}
      <Navbar onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'admin' && (
          <>
            {activeAdminTab === 'screens'   && <ScreensManager />}
            {activeAdminTab === 'layouts'   && <SmartLayoutBuilder />}
            {activeAdminTab === 'media'     && <MediaLibrary />}
            {activeAdminTab === 'playlists' && <PlaylistEditor />}
            {activeAdminTab === 'schedules' && <SchedulerEngine />}
            {activeAdminTab === 'control'   && <RealtimeControlConsole />}
            {activeAdminTab === 'telemetry' && <AnalyticsTelemetry />}
          </>
        )}
        {viewMode === 'player' && (
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl">
            <PlayerApp />
          </div>
        )}
        {viewMode === 'simulator' && <DualSimulator />}
      </main>

      <EmergencyModal isOpen={isEmergencyModalOpen} onClose={() => setIsEmergencyModalOpen(false)} />

      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <span className="font-bold text-slate-300">Enterprise Digital Signage Platform</span>
          <span>WebSocket Realtime Engine v4.2 • 4K Smart TV Ready</span>
          <span className="text-cyan-400 font-semibold">● System Operational</span>
        </div>
      </footer>
    </div>
  );
}
```

---

## 8. Navbar Component Logic

```typescript
// Navbar props: onOpenEmergencyModal
// Uses: viewMode, setViewMode, setActiveAdminTab, wsConnected, emergencyAlerts

// Tab definitions (Admin tabs):
const ADMIN_TABS = [
  { id: 'screens',   label: 'Screens',    icon: 'monitor' },
  { id: 'layouts',   label: 'Layouts',    icon: 'dashboard_customize' },
  { id: 'media',     label: 'Media',      icon: 'perm_media' },
  { id: 'playlists', label: 'Playlists',  icon: 'playlist_add_check' },
  { id: 'schedules', label: 'Schedule',   icon: 'calendar_today' },
  { id: 'control',   label: 'Control',    icon: 'settings_remote' },
  { id: 'telemetry', label: 'Analytics',  icon: 'analytics' },
] as const;

// View mode switcher buttons: Admin | Player | Simulator
// Emergency button: text-red + pulse → opens EmergencyModal
// WS indicator: green dot (connected) | amber dot (disconnected)
```

---

## 9. Key State Flows

### 9.1 Emergency Flow

```
User clicks "TRIGGER EMERGENCY" in ControlConsole / EmergencyModal
  → store.triggerEmergency({ title, message, type, targetScreenIds })
    → EmergencyAlert created, pushed to emergencyAlerts[]
    → Affected screens: status = 'emergency', activeEmergencyId = alert.id
    → TelemetryLog added
    → [optional] POST /api/emergency/trigger → broadcastWSEvent to all WS clients
      → Player receives WS event → re-renders with activeEmergency
        → EmergencyOverlay renders over all zones

User clicks "CLEAR EMERGENCY"
  → store.clearEmergency(alertId)
    → alert.active = false
    → screens: status = 'online', activeEmergencyId = undefined
    → TelemetryLog added
    → [optional] POST /api/emergency/clear
```

### 9.2 Playlist Playback Flow

```
ZoneContainer mounts with zone.playlistId
  → finds playlist from store.playlists
  → items = playlist.items (sorted by order)
  → currentIndex = 0, renders items[0].mediaId
  → setTimeout(duration * 1000):
      → recordProofOfPlay({ screenId, mediaId, durationSeconds, status: 'completed' })
      → setCurrentIndex((prev) => (prev + 1) % items.length)
      → renders next item
```

### 9.3 Screen Command Flow

```
Admin clicks "REBOOT" on ControlConsole
  → store.sendCommandToScreen('scr-001', 'REBOOT')
    → updateScreen('scr-001', { status: 'syncing', uptimeSeconds: 0 })
    → setTimeout 3000ms → updateScreen('scr-001', { status: 'online' })
    → addTelemetryLog({ eventType: 'command_exec', message: 'Executed: REBOOT' })
    → [optional] POST /api/control/command → broadcastWSEvent('SCREEN_COMMAND')
```

---

## 10. Production Caveats (Critical)

### 10.1 Memory: Object URL Lifecycle

```typescript
// ❌ WRONG — Object URL never released → RAM accumulates
const url = URL.createObjectURL(blob);
videoEl.src = url;

// ✅ CORRECT — Revoke immediately after media ends or swaps
videoEl.onended = () => URL.revokeObjectURL(url);
// Or in useEffect cleanup:
return () => URL.revokeObjectURL(url);
```

### 10.2 Video Element A/B Buffering Pattern

```typescript
// ❌ WRONG — Creating new <video> each playback → DOM leak + autoplay blocked
const vid = document.createElement('video');
document.body.appendChild(vid);

// ✅ CORRECT — 2 fixed <video> elements, swap opacity
// videoA: currently playing (opacity-100)
// videoB: loading next (opacity-0, preloading)
// When videoB is ready: swap opacity (videoB → opacity-100, videoA → opacity-0)
// Then reload videoA with the item after videoB
```

### 10.3 Android TV Video Cleanup

```typescript
// Call this BEFORE changing src or unmounting
function destroyVideo(el: HTMLVideoElement) {
  el.pause();
  el.removeAttribute('src');
  el.load();  // Releases GPU buffer
}
```

### 10.4 WakeLock (WebView/Capacitor)

```typescript
// Web API (best-effort)
let wakeLock: WakeLockSentinel | null = null;
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* fallback: native FLAG_KEEP_SCREEN_ON */ }
}
// Re-acquire on visibilitychange (OS may release it)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestWakeLock();
});
```

---

## 11. Package Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.0",
    "lucide-react": "latest",
    "motion": "latest",
    "qrcode.react": "^4.0.0",
    "express": "^4.18.0",
    "ws": "^8.0.0",
    "@google/genai": "latest"
  },
  "devDependencies": {
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "latest",
    "typescript": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "@types/ws": "latest",
    "@types/express": "latest"
  }
}
```

### Build & Dev Commands

```bash
# Development (Vite + Express server with WS)
bun run dev         # หรือ npm run dev

# Production build
bun run build       # Vite build → dist/
bun run start       # NODE_ENV=production node server.ts

# Type check
bun run typecheck
```

---

## 12. Environment Variables

```bash
# .env.example
PORT=3000                           # Server port
NODE_ENV=development                # development | production
VITE_WS_URL=ws://localhost:3000/ws  # WebSocket endpoint for frontend
VITE_API_URL=http://localhost:3000  # REST API base URL
```
