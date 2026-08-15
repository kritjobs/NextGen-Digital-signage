export type ScreenStatus = 'online' | 'offline' | 'syncing' | 'error' | 'emergency';
export type Orientation = 'landscape' | 'portrait' | 'custom';
export type MediaType = 'image' | 'video' | 'ticker' | 'weather' | 'clock' | 'webpage' | 'announcement' | 'rss' | 'youtube' | 'google_calendar' | 'google_sheets' | 'world_clock' | 'menu_board' | 'countdown' | 'currencies' | 'hls_stream';
// REQ-006: 6-Level Priority Model (สูงสุด → ต่ำสุด)
// emergency(91-100) > critical(81-90) > scheduled(41-80) > campaign(21-40) > default(11-20) > standby(1-10)
// - emergency: ระบบฉุกเฉิน (Emergency alert — ระบบจัดการเอง, จองช่วง 91-100)
// - critical: ประกาศสำคัญเร่งด่วน / schedule priority สูง
// - scheduled: ตารางเวลาปกติ (schedule ทั่วไป)
// - campaign: แคมเปญ/โปรโมชัน
// - default: เนื้อหาปกติของจอ (screen default layout/playlist)
// - standby: เนื้อหารอ/offline (reserved — offline-first ในอนาคต)
export type PriorityLevel = 'emergency' | 'critical' | 'scheduled' | 'campaign' | 'default' | 'standby';

export interface PriorityLevelDef {
  level: PriorityLevel;
  label: string;       // English short label
  labelTh: string;     // Thai label
  desc: string;        // คำอธิบายสั้น (English)
  min: number;         // inclusive
  max: number;         // inclusive
  dot: string;         // legend swatch
  bar: string;         // timeline bar (Scheduler Engine)
  badge: string;       // list badge (Scheduler Engine)
  text: string;        // slider/label text color
  card: string;        // hierarchy card container
  iconBg: string;      // hierarchy card icon chip
  iconText: string;    // hierarchy card icon color
}

export const PRIORITY_LEVELS: PriorityLevelDef[] = [
  { level: 'emergency', label: 'Emergency', labelTh: 'ฉุกเฉิน', desc: 'Emergency alerts — overrides everything', min: 91, max: 100,
    dot: 'bg-rose-500', bar: 'bg-rose-500/60 border-rose-500', badge: 'bg-rose-950 text-rose-300 border-rose-800', text: 'text-rose-400',
    card: 'bg-rose-950/30 border-rose-800/40', iconBg: 'bg-rose-600/20', iconText: 'text-rose-400' },
  { level: 'critical', label: 'Critical', labelTh: 'วิกฤต', desc: 'Urgent time-sensitive announcements', min: 81, max: 90,
    dot: 'bg-amber-500', bar: 'bg-amber-500/60 border-amber-500', badge: 'bg-amber-950 text-amber-300 border-amber-800', text: 'text-amber-400',
    card: 'bg-amber-950/30 border-amber-800/40', iconBg: 'bg-amber-600/20', iconText: 'text-amber-400' },
  { level: 'scheduled', label: 'Scheduled', labelTh: 'ตามตาราง', desc: 'Normal time-based schedule rules', min: 41, max: 80,
    dot: 'bg-cyan-500', bar: 'bg-cyan-500/40 border-cyan-500', badge: 'bg-cyan-950 text-cyan-300 border-cyan-800', text: 'text-cyan-400',
    card: 'bg-cyan-950/30 border-cyan-800/40', iconBg: 'bg-cyan-600/20', iconText: 'text-cyan-400' },
  { level: 'campaign', label: 'Campaign', labelTh: 'แคมเปญ', desc: 'Marketing campaigns & promotions', min: 21, max: 40,
    dot: 'bg-violet-500', bar: 'bg-violet-500/40 border-violet-500', badge: 'bg-violet-950 text-violet-300 border-violet-800', text: 'text-violet-400',
    card: 'bg-violet-950/30 border-violet-800/40', iconBg: 'bg-violet-600/20', iconText: 'text-violet-400' },
  { level: 'default', label: 'Default', labelTh: 'ปกติ', desc: 'Screen default layout / playlist', min: 11, max: 20,
    dot: 'bg-slate-500', bar: 'bg-slate-600/40 border-slate-500', badge: 'bg-slate-950 text-slate-400 border-slate-700', text: 'text-slate-400',
    card: 'bg-slate-950 border-slate-800', iconBg: 'bg-slate-800', iconText: 'text-slate-400' },
  { level: 'standby', label: 'Standby', labelTh: 'สแตนด์บาย', desc: 'Idle / offline standby content', min: 1, max: 10,
    dot: 'bg-slate-700', bar: 'bg-slate-800/40 border-slate-600', badge: 'bg-slate-950 text-slate-500 border-slate-800', text: 'text-slate-500',
    card: 'bg-slate-900/60 border-slate-800', iconBg: 'bg-slate-800/60', iconText: 'text-slate-500' },
];

// ระดับสูงสุด = ลำดับ 6, ต่ำสุด = ลำดับ 1
const PRIORITY_RANK: Record<PriorityLevel, number> = {
  emergency: 6, critical: 5, scheduled: 4, campaign: 3, default: 2, standby: 1,
};

export function priorityLevelOf(n: number): PriorityLevel {
  const clamped = Math.max(1, Math.min(100, Math.round(n)));
  for (const def of PRIORITY_LEVELS) {
    if (clamped >= def.min && clamped <= def.max) return def.level;
  }
  return 'default';
}

export function priorityDefOf(level: PriorityLevel): PriorityLevelDef {
  return PRIORITY_LEVELS.find((d) => d.level === level) ?? PRIORITY_LEVELS[4];
}

export function priorityRankOf(n: number): number {
  return PRIORITY_RANK[priorityLevelOf(n)];
}

export interface LayoutZone {
  id: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  zIndex: number;
  playlistId?: string;
  mediaType?: MediaType;
  isLocked?: boolean; // Admin-locked zone — non-admin users can't edit
  backgroundColor?: string;
  contentData?: {
    // Clock widget
    timezone?: string; // IANA timezone e.g. "Asia/Bangkok"
    clockFormat?: '12h' | '24h';
    clockLabel?: string; // e.g. "Phuket, Thailand"
    // Weather widget (OpenWeather API)
    weatherCity?: string;
    weatherUnit?: 'celsius' | 'fahrenheit';
    weatherApiKey?: string; // OpenWeather API key (or use global)
    // Ticker widget
    tickerText?: string;
    tickerSpeed?: number; // pixels per second
    // Announcement widget
    announcementHeader?: string;
    announcementBody?: string;
    // Webpage widget
    webUrl?: string;
    // Video/Image
    sourceUrl?: string;
    // RSS Feed widget
    rssUrl?: string;
    rssMaxItems?: number; // max items to display
    rssScrollSpeed?: number;
    // YouTube widget
    youtubeVideoId?: string; // YouTube video ID or full URL
    youtubeAutoplay?: boolean;
    youtubeMuted?: boolean;
    youtubeLoop?: boolean;
    // Google Calendar widget
    googleCalendarId?: string; // public calendar ID
    googleCalendarApiKey?: string;
    googleCalendarDaysAhead?: number;
    // Google Sheets widget
    googleSheetsUrl?: string; // Published Google Sheets embed URL
    googleSheetsRange?: string; // e.g. "Sheet1!A1:D10"
    googleSheetsApiKey?: string;
    // World Clock widget (multi-timezone)
    worldClockCities?: Array<{ label: string; timezone: string }>;
    worldClockStyle?: 'digital' | 'analog' | 'both';
    // Menu Board widget
    menuBoardTitle?: string;
    menuBoardCategories?: Array<{
      name: string;
      items: Array<{ name: string; price: string; description?: string; highlight?: boolean }>;
    }>;
    menuBoardCurrency?: string;
    menuBoardTheme?: 'dark' | 'light' | 'neon';
    // Countdown Timer widget
    countdownTarget?: string; // ISO date string
    countdownLabel?: string;
    countdownExpiredText?: string;
    countdownStyle?: 'flip' | 'simple' | 'circle';
    // Currencies / Stocks widget
    currencyPairs?: string[]; // e.g. ["USD/THB", "EUR/THB", "BTC/USD"]
    currencyRefreshSec?: number;
    // HLS Live Stream widget
    hlsUrl?: string;
    hlsAutoplay?: boolean;
    hlsMuted?: boolean;
  };
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  orientation: Orientation;
  aspectRatio: string; // e.g., "16:9", "9:16", "21:9"
  widthPx: number;
  heightPx: number;
  status: 'draft' | 'published' | 'archived';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  tags?: string[]; // REQ-TagMatch: จับคู่กับจออัตโนมัติ
  zones: LayoutZone[];
  createdAt: string;
  updatedAt: string;
}

// Campaign: multi-layout rotation
export interface CampaignLayoutItem {
  layoutId: string;
  durationSec: number; // how long to show this layout
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  layoutSequence: CampaignLayoutItem[];
  cycleMode: 'sequential' | 'random';
  createdAt: string;
  updatedAt: string;
}

// Quick Post: instant notice
export interface QuickPost {
  id: string;
  message: string;
  style: 'info' | 'warning' | 'success' | 'urgent';
  targetScreenIds: string[];
  duration: number; // seconds
  createdBy?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: MediaType;
  url: string;
  duration: number; // in seconds
  sizeMb: number;
  tags: string[];
  thumbnailUrl: string;
  contentData?: {
    tickerText?: string;
    speed?: number;
    weatherCity?: string;
    clockFormat?: string;
    announcementHeader?: string;
    announcementBody?: string;
    webUrl?: string;
    // Widget fields created via MediaLibrary UI (rendered by DisplayKiosk/player)
    countdownDate?: string;
    countdownLabel?: string;
    qrCodeData?: string;
    qrCodeLabel?: string;
    promoTitle?: string;
    promoPrice?: string;
    promoOrigPrice?: string;
    promoDesc?: string;
    kpiValue?: string;
    kpiLabel?: string;
    kpiTrend?: string;
    worldClockCities?: string; // comma-separated city names
  };
  expiresAt?: string; // ISO date — auto-remove after this date
  releaseDate?: string; // ISO date — embargo: don't show before this date
  fallbackImageUrl?: string; // shown when primary media fails to load (no black screen)
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  subPlaylistId?: string; // nested playlist reference
  duration: number;
  order: number;
  transition: 'fade' | 'slide' | 'zoom' | 'none';
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  items: PlaylistItem[];
  totalDuration: number;
  tags: string[];
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  name: string;
  playlistId?: string;
  layoutId?: string;
  screenGroupIds: string[]; // Screen or Group IDs
  screenIds: string[];
  priority: number; // 1-100 (ดู PRIORITY_LEVELS — 6 ระดับ: emergency 91-100 > critical 81-90 > scheduled 41-80 > campaign 21-40 > default 11-20 > standby 1-10)
  priorityLevel?: PriorityLevel;
  startDate: string;
  endDate: string;
  startTime: string; // "08:00"
  endTime: string;   // "18:00"
  daysOfWeek: number[]; // 0=Sunday, 1=Monday...
  isActive: boolean;
}

export interface DigitalScreen {
  id: string;
  pairingCode: string;
  name: string;
  group: string;
  tags: string[];
  location: string;
  orientation: Orientation;
  resolution: string;
  status: ScreenStatus;
  lastHeartbeat: string;
  ipAddress: string;
  macAddress: string;
  storageUsageMb: number;
  storageTotalMb: number;
  bufferCachedItemsCount: number;
  currentLayoutId?: string;
  currentPlaylistId?: string;
  fallbackLayoutId?: string;
  activeEmergencyId?: string;
  volume: number;
  isMuted: boolean;
  firmwareVersion: string;
  uptimeSeconds: number;
  lastScreenshotUrl?: string;
}

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  type: 'fire' | 'weather' | 'lockdown' | 'custom' | 'all-clear';
  severity: 'critical' | 'warning' | 'info';
  targetScreenIds: string[]; // empty array means ALL SCREENS
  active: boolean;
  triggeredAt: string;
  triggeredBy: string;
}

export interface TelemetryLog {
  id: string;
  screenId: string;
  screenName: string;
  timestamp: string;
  eventType: 'heartbeat' | 'media_played' | 'buffer_cached' | 'offline_mode' | 'command_exec' | 'error';
  message: string;
  details?: Record<string, unknown>;
}

export interface ProofOfPlayLog {
  id: string;
  screenId: string;
  screenName: string;
  mediaId: string;
  mediaTitle: string;
  playedAt: string;
  durationSeconds: number;
  status: 'completed' | 'interrupted' | 'buffered';
}

export interface RealtimeCommand {
  command: 'TRIGGER_EMERGENCY' | 'CLEAR_EMERGENCY' | 'REBOOT' | 'TAKE_SCREENSHOT' | 'SYNC_PLAYBACK' | 'PURGE_CACHE' | 'SET_LAYOUT' | 'SET_VOLUME' | 'UNPAIR_DEVICE' | 'FORCE_DISPLAY' | 'REFRESH_CONTENT';
  payload?: any;
  targetScreenId?: string;
}
