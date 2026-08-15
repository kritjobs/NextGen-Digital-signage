export type ScreenStatus = 'online' | 'offline' | 'syncing' | 'error' | 'emergency';
export type Orientation = 'landscape' | 'portrait' | 'custom';
export type MediaType = 'image' | 'video' | 'ticker' | 'weather' | 'clock' | 'webpage' | 'announcement';
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
  backgroundColor?: string;
}

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  orientation: Orientation;
  aspectRatio: string; // e.g., "16:9", "9:16", "21:9"
  widthPx: number;
  heightPx: number;
  zones: LayoutZone[];
  createdAt: string;
  updatedAt: string;
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
  };
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  mediaId: string;
  duration: number; // override duration if specified
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
  command: 'TRIGGER_EMERGENCY' | 'CLEAR_EMERGENCY' | 'REBOOT' | 'TAKE_SCREENSHOT' | 'SYNC_PLAYBACK' | 'PURGE_CACHE' | 'SET_LAYOUT' | 'SET_VOLUME';
  payload?: any;
  targetScreenId?: string;
}
