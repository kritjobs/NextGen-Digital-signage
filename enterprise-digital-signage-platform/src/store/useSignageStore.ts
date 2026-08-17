import { create } from 'zustand';import {
  DigitalScreen, 
  LayoutTemplate, 
  MediaItem, 
  Playlist, 
  ScheduleItem, 
  EmergencyAlert, 
  TelemetryLog, 
  ProofOfPlayLog,
  RealtimeCommand,
  HistoryEntry
} from '../types/signage';
import {
  screenApi, mediaApi, layoutApi, playlistApi,
  scheduleApi, emergencyApi, controlApi, analyticsApi, monitoringApi,
} from '../services/api';
import { useLanguageStore } from './useLanguageStore';

export type AppViewMode = 'admin' | 'player' | 'simulator';

interface SignageStoreState {
  // Navigation & Mode
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  activeAdminTab: 'screens' | 'layouts' | 'playlists' | 'media' | 'schedules' | 'campaigns' | 'control' | 'telemetry' | 'slideshows' | 'ai_settings' | 'backups';
  setActiveAdminTab: (tab: 'screens' | 'layouts' | 'playlists' | 'media' | 'schedules' | 'campaigns' | 'control' | 'telemetry' | 'slideshows' | 'ai_settings' | 'backups') => void;

  // Loading state
  isLoading: boolean;
  loadError: string | null;

  // Realtime WS
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

  // Live Screen Preview: สถานะการแสดงผลล่าสุดของแต่ละจอ (key = screenId)
  screenStates: Record<string, any>;
  receiveScreenState: (state: any) => void;
  loadScreenStates: () => Promise<void>;

  // Core Data Collections
  screens: DigitalScreen[];
  mediaItems: MediaItem[];
  layouts: LayoutTemplate[];
  playlists: Playlist[];
  schedules: ScheduleItem[];
  emergencyAlerts: EmergencyAlert[];
  telemetryLogs: TelemetryLog[];
  proofOfPlayLogs: ProofOfPlayLog[];

  // Active Selections
  selectedScreenId: string | null;
  setSelectedScreenId: (id: string | null) => void;
  selectedLayoutId: string | null;
  setSelectedLayoutId: (id: string | null) => void;
  selectedPlaylistId: string | null;
  setSelectedPlaylistId: (id: string | null) => void;

  // Player App Specific State
  playerScreenId: string;
  setPlayerScreenId: (id: string) => void;
  isSimulatedOffline: boolean;
  setIsSimulatedOffline: (offline: boolean) => void;
  playerBufferProgress: number;
  
  // ─── API-backed Actions ──────────────────────────────────
  // Load all data from API (called once on app start)
  loadAllData: () => Promise<void>;

  // Schedule resolver — apply active schedule to screens
  resolveSchedules: () => void;
  applyScheduleToScreens: (scheduleId: string) => void;

  // Emergency
  triggerEmergency: (alertData: Partial<EmergencyAlert>) => void;
  clearEmergency: (alertId: string) => void;
  // WS: รับสถานะ emergency จาก broadcast (state เท่านั้น — ไม่ POST ซ้ำ)
  receiveEmergencyTrigger: (alert: any) => void;
  receiveEmergencyClear: (alertId: string) => void;

  // WS: Quick Post broadcast → ทุกแท็บ/player เห็นพร้อมกัน (auto-hide ตาม duration)
  quickPost: any | null;
  receiveQuickPost: (post: any) => void;
  
  // CRUD Actions (now call API + update local state)
  addScreen: (screen: DigitalScreen) => void;
  updateScreen: (id: string, partial: Partial<DigitalScreen>) => void;
  deleteScreen: (id: string) => void;

  // REQ-008: รีเฟรชสถานะจอจาก server (monitoring poll)
  refreshScreens: () => Promise<void>;

  addMediaItem: (media: MediaItem) => void;
  deleteMediaItem: (id: string) => void;

  addLayout: (layout: LayoutTemplate) => void;
  updateLayout: (id: string, layout: Partial<LayoutTemplate>) => void;
  deleteLayout: (id: string) => void;

  addPlaylist: (playlist: Playlist) => void;
  updatePlaylist: (id: string, playlist: Partial<Playlist>) => void;
  deletePlaylist: (id: string) => void;

  addSchedule: (schedule: ScheduleItem) => void;
  updateSchedule: (id: string, schedule: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;

  // ─── Scheduler Undo/Redo — เก็บใน store เพื่ออยู่รอดข้ามการสลับแท็บ ──
  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  setUndoStack: (updater: (prev: HistoryEntry[]) => HistoryEntry[]) => void;
  setRedoStack: (updater: (prev: HistoryEntry[]) => HistoryEntry[]) => void;
  clearHistory: () => void;

  // ─── Scheduler multi-select — เก็บใน store เพื่ออยู่รอดข้ามมุมมอง (เลือกใน Month → สลับไป Week แล้วลากกลุ่ม) ──
  selectedScheduleIds: Set<string>;
  toggleSelectedSchedule: (id: string) => void;
  clearSelectedSchedules: () => void;

  // ─── Scheduler view (มุมมอง + วันที่) — เก็บใน store เพื่อซิงก์ข้ามแท็บ (BroadcastChannel) ──
  schedulerViewMode: 'list' | 'day' | 'week' | 'month';
  schedulerViewDate: string; // 'YYYY-MM-DD'
  setSchedulerView: (mode: 'list' | 'day' | 'week' | 'month', date: string) => void;

  // ─── ลากสดจากแท็บอื่น (BroadcastChannel) — แท็บอื่นเห็น ghost อีเวนต์ตามตำแหน่งลากจริง (move/resize/legend) ──
  remoteDrag: { ids: string[]; curMin: number; curDay: number; mode?: 'move' | 'resize'; edge?: 'top' | 'bottom'; plDrop?: string | null } | null;
  setRemoteDrag: (d: { ids: string[]; curMin: number; curDay: number; mode?: 'move' | 'resize'; edge?: 'top' | 'bottom'; plDrop?: string | null } | null) => void;

  // ─── ข้ามแท็บ: ดึง schedules/playlists ล่าสุดจาก server (เรียกเมื่อรับ BroadcastChannel sync) ──
  refreshSchedulesAndPlaylists: () => Promise<void>;

  // Remote Commands
  sendCommandToScreen: (screenId: string, command: RealtimeCommand['command'], payload?: any) => void;
  addTelemetryLog: (log: Omit<TelemetryLog, 'id'>) => void;
  recordProofOfPlay: (pop: Omit<ProofOfPlayLog, 'id'>) => void;
}

// ─── Helper: Map API response → frontend types ──────────────
function mapScreen(s: any): DigitalScreen {
  return {
    id: s.id,
    pairingCode: s.pairingCode || s.pairing_code || '',
    name: s.name,
    group: s.group || '',
    tags: s.tags || [],
    location: s.location || '',
    orientation: s.orientation || 'landscape',
    resolution: s.resolution || '1920x1080 (FHD)',
    status: s.status || 'offline',
    lastHeartbeat: s.lastHeartbeat || s.last_heartbeat || new Date().toISOString(),
    ipAddress: s.ipAddress || s.ip_address || '',
    macAddress: s.macAddress || s.mac_address || '',
    storageUsageMb: s.storageUsageMb ?? s.storage_usage_mb ?? 0,
    storageTotalMb: s.storageTotalMb ?? s.storage_total_mb ?? 8000,
    bufferCachedItemsCount: s.bufferCachedItems ?? s.buffer_cached_items ?? 0,
    currentLayoutId: s.currentLayoutId || s.current_layout_id || undefined,
    currentPlaylistId: s.currentPlaylistId || s.current_playlist_id || undefined,
    fallbackLayoutId: s.fallbackLayoutId || s.fallback_layout_id || undefined,
    activeEmergencyId: s.activeEmergencyId || s.active_emergency_id || undefined,
    volume: s.volume ?? 75,
    isMuted: s.isMuted ?? s.is_muted ?? false,
    firmwareVersion: s.firmwareVersion || s.firmware_version || 'v1.0.0',
    uptimeSeconds: s.uptimeSeconds ?? s.uptime_seconds ?? 0,
    lastScreenshotUrl: s.lastScreenshotUrl || s.last_screenshot_url || undefined,
  };
}

function mapMedia(m: any): MediaItem {
  return {
    id: m.id,
    title: m.title,
    type: m.type,
    url: m.url || '',
    duration: m.duration || 10,
    sizeMb: Number(m.sizeMb ?? m.size_mb ?? 0),
    tags: m.tags || [],
    thumbnailUrl: m.thumbnailUrl || m.thumbnail_url || '',
    contentData: {
      tickerText: m.tickerText || m.ticker_text,
      speed: m.tickerSpeed || m.ticker_speed,
      weatherCity: m.weatherCity || m.weather_city,
      clockFormat: m.clockFormat || m.clock_format,
      announcementHeader: m.announceHeader || m.announce_header,
      announcementBody: m.announceBody || m.announce_body,
      webUrl: m.webUrl || m.web_url,
    },
    expiresAt: m.expiresAt || m.expires_at || undefined,
    releaseDate: m.releaseDate || m.release_date || undefined,
    fallbackImageUrl: m.fallbackImageUrl || m.fallback_image_url || '',
    createdAt: m.createdAt || m.created_at || new Date().toISOString(),
  };
}

function mapLayout(l: any): LayoutTemplate {
  return {
    id: l.id,
    name: l.name,
    description: l.description || '',
    orientation: l.orientation || 'landscape',
    aspectRatio: l.aspectRatio || l.aspect_ratio || '16:9',
    widthPx: l.widthPx || l.width_px || 1920,
    heightPx: l.heightPx || l.height_px || 1080,
    status: l.status || 'published',
    approvalStatus: l.approvalStatus || l.approval_status || 'approved',
    tags: l.tags || [],
    zones: (l.zones || []).map((z: any) => ({
      id: z.id,
      name: z.name,
      x: Number(z.x),
      y: Number(z.y),
      width: Number(z.width),
      height: Number(z.height),
      zIndex: z.zIndex || z.z_index || 1,
      playlistId: z.playlistId || z.playlist_id || undefined,
      mediaType: z.mediaType || z.media_type || undefined,
      isLocked: z.isLocked ?? z.is_locked ?? false,
      backgroundColor: z.backgroundColor || z.background_color || '#000000',
      contentData: z.contentData || z.content_data || undefined,
    })),
    createdAt: l.createdAt || l.created_at || new Date().toISOString(),
    updatedAt: l.updatedAt || l.updated_at || new Date().toISOString(),
  };
}

function mapPlaylist(p: any): Playlist {
  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    items: (p.items || []).map((it: any) => ({
      id: it.id,
      mediaId: it.mediaId || it.media_id || '',
      duration: it.duration || 10,
      order: it.order || 1,
      transition: it.transition || 'fade',
    })),
    totalDuration: p.totalDuration || p.total_duration || 0,
    tags: p.tags || [],
    status: p.status || 'published',
    approvalStatus: p.approvalStatus || 'approved',
    color: p.color || undefined,
    updatedAt: p.updatedAt || p.updated_at || new Date().toISOString(),
  };
}

function mapSchedule(s: any): ScheduleItem {
  return {
    id: s.id,
    name: s.name,
    playlistId: s.playlistId || s.playlist_id || undefined,
    layoutId: s.layoutId || s.layout_id || undefined,
    screenGroupIds: s.screenGroupIds || s.screen_group_ids || [],
    screenIds: s.screenIds || s.screen_ids || [],
    priority: s.priority || 50,
    startDate: s.startDate || s.start_date || '',
    endDate: s.endDate || s.end_date || '',
    startTime: s.startTime || s.start_time || '00:00',
    endTime: s.endTime || s.end_time || '23:59',
    daysOfWeek: s.daysOfWeek || s.days_of_week || [1,2,3,4,5],
    isActive: s.isActive ?? s.is_active ?? true,
  };
}

function mapEmergency(e: any): EmergencyAlert {
  return {
    id: e.id,
    title: e.title,
    message: e.message,
    type: e.type || 'custom',
    severity: e.severity || 'critical',
    targetScreenIds: e.targetScreenIds || e.target_screen_ids || [],
    active: e.isActive ?? e.is_active ?? e.active ?? false,
    triggeredAt: e.triggeredAt || e.triggered_at || new Date().toISOString(),
    triggeredBy: e.triggeredBy || e.triggered_by || '',
  };
}

// ─── Store ───────────────────────────────────────────────────
// timer ของ Quick Post auto-hide (module-level — reset เมื่อมี post ใหม่)
let quickPostTimer: any = null;

// ─── Cross-tab history sync (BroadcastChannel) — undo/redo/ประวัติซิงก์ข้ามแท็บ ──
// เปิด Scheduler 2 แท็บ: กด Ctrl+Z ในแท็บหนึ่ง → อีกแท็บได้ stack เดียวกัน + ดึงข้อมูลล่าสุดจาก server
const HISTORY_CHANNEL = 'signage-history-sync';
let historyChannel: BroadcastChannel | null = null;
try { if (typeof BroadcastChannel !== 'undefined') historyChannel = new BroadcastChannel(HISTORY_CHANNEL); } catch { historyChannel = null; }
const broadcastHistorySync = () => {
  if (!historyChannel) return;
  try {
    const st = useSignageStore.getState();
    historyChannel.postMessage({ type: 'history-sync', undoStack: st.undoStack, redoStack: st.redoStack });
  } catch { /* ignore */ }
};
// Scheduler view/selection sync — แท็บหนึ่งสลับ view/วันที่/เลือก → อีกแท็บตาม
const broadcastViewSync = (mode: string, date: string) => {
  if (!historyChannel) return;
  try { historyChannel.postMessage({ type: 'scheduler-view-sync', viewMode: mode, viewDate: date }); } catch { /* ignore */ }
};
const broadcastSelectionSync = (ids: Set<string>) => {
  if (!historyChannel) return;
  try { historyChannel.postMessage({ type: 'selection-sync', ids: [...ids] }); } catch { /* ignore */ }
};
// ลากสด (drag animation) — broadcast ตำแหน่งลากจริงไปทุกแท็บ → อีกแท็บเห็น ghost อีเวนต์
const broadcastDragSync = (action: 'start' | 'move' | 'end', payload?: { ids?: string[]; curMin?: number; curDay?: number; mode?: 'move' | 'resize'; edge?: 'top' | 'bottom'; plDrop?: string | null }) => {
  if (!historyChannel) return;
  try { historyChannel.postMessage({ type: 'scheduler-drag-sync', action, ...payload }); } catch { /* ignore */ }
};
export { broadcastDragSync };

export const useSignageStore = create<SignageStoreState>((set, get) => ({
  viewMode: 'admin',
  setViewMode: (viewMode) => set({ viewMode }),
  activeAdminTab: 'screens',
  setActiveAdminTab: (activeAdminTab) => set({ activeAdminTab }),

  isLoading: true,
  loadError: null,

  wsConnected: false,
  setWsConnected: (wsConnected) => set({ wsConnected }),

  // Live Screen Preview: สถานะล่าสุดของแต่ละจอ (รับจาก WS broadcast + REST catch-up)
  screenStates: {},
  receiveScreenState: (state) => {
    if (!state?.screenId) return;
    set((s) => ({ screenStates: { ...s.screenStates, [state.screenId]: state } }));
  },
  loadScreenStates: async () => {
    try {
      const res = await monitoringApi.live();
      const states = Array.isArray(res.states) ? res.states : [];
      set({ screenStates: Object.fromEntries(states.map((st: any) => [st.screenId, st])) });
    } catch { /* เงียบ — WS จะค่อยๆ ป้อนสถานะมาเอง */ }
  },

  screens: [],
  mediaItems: [],
  layouts: [],
  playlists: [],
  schedules: [],
  emergencyAlerts: [],
  quickPost: null,
  telemetryLogs: [],
  proofOfPlayLogs: [],

  undoStack: [],
  redoStack: [],
  // หลังเปลี่ยน stack → broadcast ไปทุกแท็บ (BroadcastChannel) — อีกแท็บซิงก์ stack + ดึงข้อมูลล่าสุด
  setUndoStack: (updater) => { set((s) => ({ undoStack: updater(s.undoStack) })); broadcastHistorySync(); },
  setRedoStack: (updater) => { set((s) => ({ redoStack: updater(s.redoStack) })); broadcastHistorySync(); },
  clearHistory: () => { set({ undoStack: [], redoStack: [] }); broadcastHistorySync(); },

  selectedScheduleIds: new Set(),
  toggleSelectedSchedule: (id) => {
    const next = new Set(useSignageStore.getState().selectedScheduleIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    set({ selectedScheduleIds: next });
    broadcastSelectionSync(next);
  },
  clearSelectedSchedules: () => { set({ selectedScheduleIds: new Set() }); broadcastSelectionSync(new Set()); },

  schedulerViewMode: 'list',
  schedulerViewDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(),
  setSchedulerView: (mode, date) => { set({ schedulerViewMode: mode, schedulerViewDate: date }); broadcastViewSync(mode, date); },

  remoteDrag: null,
  setRemoteDrag: (d) => set({ remoteDrag: d }),

  selectedScreenId: null,
  setSelectedScreenId: (id) => set({ selectedScreenId: id }),
  selectedLayoutId: null,
  setSelectedLayoutId: (id) => set({ selectedLayoutId: id }),
  selectedPlaylistId: null,
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id }),

  playerScreenId: 'scr-001',
  setPlayerScreenId: (playerScreenId) => set({ playerScreenId }),
  isSimulatedOffline: false,
  setIsSimulatedOffline: (isSimulatedOffline) => set({ isSimulatedOffline }),
  playerBufferProgress: 100,

  // ─── Load ALL data from API ──────────────────────────────
  loadAllData: async () => {
    set({ isLoading: true, loadError: null });

    // Guest mode — skip API, use initial mock data from store
    const token = localStorage.getItem('signage_access_token');
    if (token === 'guest-token-bypass') {
      set({ isLoading: false, loadError: null });
      return;
    }

    try {
      const [screensRes, mediaRes, layoutsRes, playlistsRes, schedulesRes, telemetryRes, popRes] = await Promise.all([
        screenApi.getAll(),
        mediaApi.getAll(),
        layoutApi.getAll(),
        playlistApi.getAll(),
        scheduleApi.getAll(),
        analyticsApi.getTelemetry(50, useLanguageStore.getState().language),
        analyticsApi.getProofOfPlay(50),
      ]);

      set({
        screens:         screensRes.data.map(mapScreen),
        mediaItems:      mediaRes.data.map(mapMedia),
        layouts:         layoutsRes.data.map(mapLayout),
        playlists:       playlistsRes.data.map(mapPlaylist),
        schedules:       schedulesRes.data.map(mapSchedule),
        telemetryLogs:   telemetryRes.data.map((t: any) => {
          const details = (t.details ?? {}) as Record<string, any>;
          return {
            id: String(t.id),
            screenId: t.screenId || t.screen_id || '',
            screenName: t.screenName || t.screen_name || '',
            timestamp: t.createdAt || t.created_at || new Date().toISOString(),
            eventType: t.eventType || t.event_type || 'heartbeat',
            message: t.message || '',
            eventKey: typeof details.eventKey === 'string' ? details.eventKey : undefined,
            messageParams: (details.params ?? undefined) as Record<string, string | number> | undefined,
            details,
          };
        }),
        proofOfPlayLogs: popRes.data.map((p: any) => ({
          id: String(p.id),
          screenId: p.screenId || p.screen_id || '',
          screenName: p.screenName || p.screen_name || '',
          mediaId: p.mediaId || p.media_id || '',
          mediaTitle: p.mediaTitle || p.media_title || '',
          playedAt: p.playedAt || p.played_at || new Date().toISOString(),
          durationSeconds: p.durationSeconds || p.duration_seconds || 0,
          status: p.status || 'completed',
        })),
        selectedScreenId: screensRes.data[0]?.id || null,
        selectedLayoutId: layoutsRes.data[0]?.id || null,
        selectedPlaylistId: playlistsRes.data[0]?.id || null,
        isLoading: false,
      });

      console.log('[Store] ✅ Loaded data from API:', {
        screens: screensRes.data.length,
        media: mediaRes.data.length,
        layouts: layoutsRes.data.length,
        playlists: playlistsRes.data.length,
      });

      // Auto-resolve schedules after loading data
      setTimeout(() => get().resolveSchedules(), 500);
    } catch (err: any) {
      console.error('[Store] ❌ Failed to load data from API:', err.message);
      set({ isLoading: false, loadError: err.message });
    }
  },

  // ข้ามแท็บ sync (BroadcastChannel): ดึง schedules/playlists ล่าสุดจาก server — ใช้ตอนแท็บอื่น undo/redo/แก้กฎ
  refreshSchedulesAndPlaylists: async () => {
    const token = localStorage.getItem('signage_access_token');
    if (token === 'guest-token-bypass') return;
    try {
      const [schedulesRes, playlistsRes] = await Promise.all([scheduleApi.getAll(), playlistApi.getAll()]);
      set({
        schedules: schedulesRes.data.map(mapSchedule),
        playlists: playlistsRes.data.map(mapPlaylist),
      });
      get().resolveSchedules();
    } catch { /* เงียบ — ครั้งถัดไปลองใหม่ */ }
  },

  // ─── 6-Level Content Priority Resolver ─────────────────────
  // Priority levels: Emergency(100) > Takeover(90) > Campaign(70) > Schedule(50) > Default(20) > Fallback(10)
  resolveSchedules: () => {
    const state = get();
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sun
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    // Level 1: Emergency — already handled by triggerEmergency (priority 100)
    // If emergency active, skip schedule resolution for those screens
    const emergencyScreenIds = state.emergencyAlerts
      .filter(a => a.active)
      .flatMap(a => a.targetScreenIds.length > 0 ? a.targetScreenIds : state.screens.map(s => s.id));

    // Level 2-3: Takeover (priority 90-99) + Campaign (priority 70-89) — handled by priority ranges
    // Level 4: Scheduled Events (priority 50-69) — standard schedules
    // Level 5: Default (priority 20-49) — always-on default content
    // Level 6: Fallback (priority 1-19) — last resort (fallbackLayoutId on screen)

    // Find active schedules right now (sorted by priority desc)
    const activeSchedules = state.schedules
      .filter(s => s.isActive)
      .filter(s => s.daysOfWeek.includes(currentDay))
      .filter(s => currentTime >= s.startTime && currentTime <= s.endTime)
      .sort((a, b) => b.priority - a.priority);

    // For each screen, apply highest priority content (skip emergency screens)
    const updatedScreens = state.screens.map(screen => {
      // Skip screens under emergency — they are managed by emergency system
      if (emergencyScreenIds.includes(screen.id)) return screen;

      const matchingSchedule = activeSchedules.find(sch => {
        if (sch.screenGroupIds.length === 0 && sch.screenIds.length === 0) return true;
        if (sch.screenIds.includes(screen.id)) return true;
        if (sch.screenGroupIds.includes(screen.group)) return true;
        return false;
      });

      if (matchingSchedule) {
        const changes: Partial<typeof screen> = {};
        if (matchingSchedule.layoutId && matchingSchedule.layoutId !== screen.currentLayoutId) {
          changes.currentLayoutId = matchingSchedule.layoutId;
        }
        if (matchingSchedule.playlistId && matchingSchedule.playlistId !== screen.currentPlaylistId) {
          changes.currentPlaylistId = matchingSchedule.playlistId;
        }
        if (Object.keys(changes).length > 0) {
          return { ...screen, ...changes };
        }
      } else if (screen.fallbackLayoutId && !screen.currentLayoutId) {
        // Level 6: Apply fallback if no schedule matches and no layout set
        return { ...screen, currentLayoutId: screen.fallbackLayoutId };
      }
      return screen;
    });

    set({ screens: updatedScreens });

    const priorityLabels = activeSchedules.map(s => {
      const level = s.priority >= 90 ? '🔴 Takeover' : s.priority >= 70 ? '🟣 Campaign' : s.priority >= 50 ? '🟡 Schedule' : s.priority >= 20 ? '🟢 Default' : '⚪ Fallback';
      return `${level}: ${s.name}`;
    });
    if (priorityLabels.length > 0) {
      console.log('[Priority Engine] ✅ Resolved:', priorityLabels.join(' | '));
    }
  },

  applyScheduleToScreens: (scheduleId: string) => {
    const state = get();
    const schedule = state.schedules.find(s => s.id === scheduleId);
    if (!schedule) return;

    // Find target screens
    const targetScreens = state.screens.filter(screen => {
      if (schedule.screenGroupIds.length === 0 && schedule.screenIds.length === 0) return true;
      if (schedule.screenIds.includes(screen.id)) return true;
      if (schedule.screenGroupIds.includes(screen.group)) return true;
      return false;
    });

    // Apply layout + playlist to each target screen
    const updatedScreens = state.screens.map(screen => {
      if (!targetScreens.find(t => t.id === screen.id)) return screen;
      const changes: Partial<typeof screen> = {};
      if (schedule.layoutId) changes.currentLayoutId = schedule.layoutId;
      if (schedule.playlistId) changes.currentPlaylistId = schedule.playlistId;
      // Sync via API (silent — won't force logout on token expiry)
      screenApi.silentUpdate(screen.id, changes).catch(err =>
        console.warn('[Scheduler] API sync skipped:', err.message)
      );
      return { ...screen, ...changes };
    });

    set({ screens: updatedScreens });
    console.log(`[Scheduler] Applied "${schedule.name}" to ${targetScreens.length} screens`);
  },

  // ─── Emergency ────────────────────────────────────────────
  triggerEmergency: async (alertData) => {
    try {
      const res = await emergencyApi.trigger(alertData);
      get().receiveEmergencyTrigger(res.alert);
    } catch (err) {
      // Fallback: local-only emergency
      get().receiveEmergencyTrigger({
        id: 'emg-' + Date.now(),
        title: alertData.title || 'EMERGENCY BROADCAST ALERT',
        message: alertData.message || 'ATTENTION ALL OCCUPANTS: Follow facility emergency safety guidelines immediately.',
        type: alertData.type || 'custom',
        severity: alertData.severity || 'critical',
        targetScreenIds: alertData.targetScreenIds || [],
        active: true,
        triggeredAt: new Date().toISOString(),
        triggeredBy: 'Security Operations Center',
      });
    }
  },

  // WS broadcast → อัปเดต state ทันที (ทุก client เห็นพร้อมกัน) — ไม่ POST ซ้ำ
  receiveEmergencyTrigger: (alert) => {
    set((state) => ({
      emergencyAlerts: [mapEmergency({ ...alert, active: true }), ...state.emergencyAlerts.map(a => ({ ...a, active: false }))],
      screens: state.screens.map((scr) => {
        const targets = alert.targetScreenIds || alert.target_screen_ids || [];
        if (targets.length === 0 || targets.includes(scr.id)) {
          return { ...scr, status: 'emergency' as const, activeEmergencyId: alert.id };
        }
        return scr;
      }),
    }));
  },

  clearEmergency: async (alertId) => {
    try {
      await emergencyApi.clear(alertId);
    } catch { /* continue anyway */ }
    get().receiveEmergencyClear(alertId);
  },

  // WS broadcast → เคลียร์ state (ทุก client เห็นพร้อมกัน)
  receiveEmergencyClear: (alertId) => {
    set((state) => ({
      emergencyAlerts: state.emergencyAlerts.map((a) => a.id === alertId ? { ...a, active: false } : a),
      screens: state.screens.map((scr) => scr.activeEmergencyId === alertId ? { ...scr, status: 'online' as const, activeEmergencyId: undefined } : scr),
    }));
  },

  // WS broadcast → ตั้ง Quick Post + auto-hide ตาม duration (post ใหม่แทนที่ post เก่า; null = ปิดทันที)
  receiveQuickPost: (post) => {
    if (quickPostTimer) clearTimeout(quickPostTimer);
    if (!post) { set({ quickPost: null }); return; }
    set({ quickPost: post });
    quickPostTimer = setTimeout(() => set({ quickPost: null }), (post.duration || 30) * 1000);
  },

  // ─── CRUD: Screens ────────────────────────────────────────
  addScreen: (screen) => {
    set((state) => ({ screens: [screen, ...state.screens] }));
    screenApi.create(screen).catch(console.error);
  },
  updateScreen: (id, partial) => {
    set((state) => ({ screens: state.screens.map((s) => s.id === id ? { ...s, ...partial } : s) }));
    screenApi.update(id, partial).catch(console.error);
  },
  deleteScreen: (id) => {
    set((state) => ({ screens: state.screens.filter((s) => s.id !== id) }));
    screenApi.delete(id).catch(console.error);
  },
  // REQ-008: monitoring poll — ดึงสถานะจอล่าสุดจาก server โดยไม่รบกวน state อื่น
  refreshScreens: async () => {
    try {
      const res = await screenApi.getAll();
      set({ screens: res.data.map(mapScreen) });
    } catch { /* เงียบ — poll ครั้งถัดไปลองใหม่ */ }
  },

  // ─── CRUD: Media ──────────────────────────────────────────
  addMediaItem: (media) => {
    set((state) => ({ mediaItems: [media, ...state.mediaItems] }));
    mediaApi.create(media).catch(console.error);
  },
  deleteMediaItem: (id) => {
    set((state) => ({ mediaItems: state.mediaItems.filter((m) => m.id !== id) }));
    mediaApi.delete(id).catch(console.error);
  },

  // ─── CRUD: Layouts ────────────────────────────────────────
  addLayout: (layout) => {
    set((state) => ({ layouts: [layout, ...state.layouts] }));
    layoutApi.create(layout).catch(console.error);
  },
  updateLayout: (id, partial) => {
    set((state) => ({ layouts: state.layouts.map((l) => l.id === id ? { ...l, ...partial } : l) }));
    // Persist to server (auto-save)
    const layout = get().layouts.find((l) => l.id === id);
    if (layout) {
      layoutApi.update(id, { ...layout, ...partial }).catch(console.error);
    }
  },
  deleteLayout: (id) => {
    set((state) => ({ layouts: state.layouts.filter((l) => l.id !== id) }));
    layoutApi.delete(id).catch(console.error);
  },

  // ─── CRUD: Playlists ──────────────────────────────────────
  addPlaylist: (playlist) => {
    set((state) => ({ playlists: [playlist, ...state.playlists] }));
    playlistApi.create(playlist).catch(err => console.error('[Store] addPlaylist API failed:', err.message));
  },
  updatePlaylist: (id, partial) => {
    set((state) => ({ playlists: state.playlists.map((p) => p.id === id ? { ...p, ...partial } : p) }));
    return playlistApi.update(id, partial).catch(console.error) as Promise<unknown>;
  },
  deletePlaylist: (id) => {
    set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) }));
    playlistApi.delete(id).catch(console.error);
  },

  // ─── CRUD: Schedules — คืน Promise เพื่อให้ undo/redo กลุ่ม serialize การเขียน (กัน PATCH เรียงไม่ตรง) ──
  addSchedule: (schedule) => {
    set((state) => ({ schedules: [schedule, ...state.schedules] }));
    return scheduleApi.create(schedule).catch(console.error) as Promise<unknown>;
  },
  updateSchedule: (id, partial) => {
    set((state) => ({ schedules: state.schedules.map((s) => s.id === id ? { ...s, ...partial } : s) }));
    return scheduleApi.update(id, partial).catch(console.error) as Promise<unknown>;
  },
  deleteSchedule: (id) => {
    set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) }));
    return scheduleApi.delete(id).catch(console.error) as Promise<unknown>;
  },

  // ─── Remote Commands (via API) ────────────────────────────
  sendCommandToScreen: async (screenId, command, payload) => {
    const state = get();
    const scr = state.screens.find((s) => s.id === screenId);

    // Optimistic local update
    if (command === 'REBOOT') {
      state.updateScreen(screenId, { status: 'syncing', uptimeSeconds: 0 });
      setTimeout(() => state.updateScreen(screenId, { status: 'online' }), 3000);
    } else if (command === 'TAKE_SCREENSHOT') {
      const screenshots = [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      ];
      state.updateScreen(screenId, { lastScreenshotUrl: screenshots[Math.floor(Math.random() * screenshots.length)] });
    } else if (command === 'PURGE_CACHE') {
      state.updateScreen(screenId, { storageUsageMb: 250, bufferCachedItemsCount: 0 });
    } else if (command === 'SET_LAYOUT' && payload?.layoutId) {
      state.updateScreen(screenId, { currentLayoutId: payload.layoutId });
    } else if (command === 'SET_VOLUME' && payload?.volume !== undefined) {
      state.updateScreen(screenId, { volume: payload.volume, isMuted: payload.volume === 0 });
    }

    // Call API
    controlApi.sendCommand(screenId, command, payload).catch(console.error);

    // Add local telemetry log (eventKey → แสดงผ่าน t() ตามภาษาปัจจุบัน)
    state.addTelemetryLog({
      screenId,
      screenName: scr?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      eventType: 'command_exec',
      message: `Executed: ${command} ${payload ? JSON.stringify(payload) : ''}`,
      eventKey: 'evt.cmdExec',
      messageParams: { command, payload: payload ? JSON.stringify(payload) : '' },
    });
  },

  addTelemetryLog: (log) => set((state) => ({
    telemetryLogs: [{ id: 'log-' + Date.now() + Math.random(), ...log }, ...state.telemetryLogs.slice(0, 99)],
  })),

  recordProofOfPlay: (pop) => set((state) => ({
    proofOfPlayLogs: [{ id: 'pop-' + Date.now() + Math.random(), ...pop }, ...state.proofOfPlayLogs.slice(0, 99)],
  })),
}));

// ฟัง message จากแท็บอื่น → ซิงก์ undo/redo stack + รีเฟรชข้อมูล (เฉพาะ stacks — ไม่ broadcast กลับ → ไม่วนลูป)
// BroadcastChannel ส่งถึงแท็บที่โพสต์ด้วย (ตัวเอง) → message นี้ยังเป็นตัว trigger ให้แท็บเดียวกัน refetch เพื่อให้ข้อมูลตรงกับ PATCH ที่เพิ่งส่งไป
// หน่วง ~150ms + debounce เพื่อกัน race กับ PATCH ที่ยังไม่จบ (refetch ไปโดนค่าก่อนแก้)
let historySyncTimer: ReturnType<typeof setTimeout> | null = null;
if (historyChannel) {
  historyChannel.onmessage = (ev) => {
    const msg = ev.data;
    if (!msg) return;
    if (msg.type === 'history-sync') {
      useSignageStore.setState({
        undoStack: Array.isArray(msg.undoStack) ? msg.undoStack : [],
        redoStack: Array.isArray(msg.redoStack) ? msg.redoStack : [],
      });
      if (historySyncTimer) clearTimeout(historySyncTimer);
      historySyncTimer = setTimeout(() => { useSignageStore.getState().refreshSchedulesAndPlaylists(); }, 150);
    } else if (msg.type === 'scheduler-view-sync') {
      if (msg.viewMode) useSignageStore.setState({
        schedulerViewMode: msg.viewMode,
        schedulerViewDate: msg.viewDate || useSignageStore.getState().schedulerViewDate,
      });
    } else if (msg.type === 'selection-sync') {
      useSignageStore.setState({ selectedScheduleIds: new Set(Array.isArray(msg.ids) ? msg.ids : []) });
    } else if (msg.type === 'scheduler-drag-sync') {
      if (msg.action === 'end') useSignageStore.setState({ remoteDrag: null });
      else useSignageStore.setState({
        remoteDrag: {
          ids: Array.isArray(msg.ids) ? msg.ids : [],
          curMin: msg.curMin || 0,
          curDay: msg.curDay || 0,
          mode: msg.mode === 'resize' ? 'resize' : 'move',
          edge: msg.edge === 'top' || msg.edge === 'bottom' ? msg.edge : undefined,
          plDrop: msg.plDrop !== undefined ? msg.plDrop : null,
        },
      });
    }
  };
}
