export type ScreenStatus = 'online' | 'offline' | 'syncing' | 'error' | 'emergency';
export type Orientation = 'landscape' | 'portrait' | 'custom';
export type MediaType = 'image' | 'video' | 'ticker' | 'weather' | 'clock' | 'webpage' | 'announcement' | 'rss' | 'youtube' | 'google_calendar' | 'google_sheets' | 'world_clock' | 'menu_board' | 'countdown' | 'currencies' | 'hls_stream';
export type PriorityLevel = 'emergency' | 'scheduled' | 'default';

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
  priority: number; // 1-100 (Emergency: 100, Scheduled: 50, Default: 10)
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
