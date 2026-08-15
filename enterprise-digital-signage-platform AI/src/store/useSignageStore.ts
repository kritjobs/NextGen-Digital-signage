import { create } from 'zustand';
import { 
  DigitalScreen, 
  LayoutTemplate, 
  MediaItem, 
  Playlist, 
  ScheduleItem, 
  EmergencyAlert, 
  TelemetryLog, 
  ProofOfPlayLog,
  RealtimeCommand
} from '../types/signage';
import { 
  INITIAL_SCREENS, 
  INITIAL_MEDIA_ITEMS, 
  INITIAL_LAYOUTS, 
  INITIAL_PLAYLISTS, 
  INITIAL_SCHEDULES, 
  INITIAL_EMERGENCY_ALERTS, 
  INITIAL_TELEMETRY_LOGS,
  INITIAL_PROOF_OF_PLAY 
} from '../data/initialData';

export type AppViewMode = 'admin' | 'player' | 'simulator';

interface SignageStoreState {
  // Navigation & Mode
  viewMode: AppViewMode;
  setViewMode: (mode: AppViewMode) => void;
  activeAdminTab: 'screens' | 'layouts' | 'playlists' | 'media' | 'schedules' | 'control' | 'telemetry';
  setActiveAdminTab: (tab: 'screens' | 'layouts' | 'playlists' | 'media' | 'schedules' | 'control' | 'telemetry') => void;

  // AI Feature Settings
  isAiEnabled: boolean;
  toggleAi: () => void;
  setIsAiEnabled: (enabled: boolean) => void;

  // Realtime WS
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;

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
  playerBufferProgress: number; // 0-100%
  
  // Realtime Command Dispatcher & Actions
  triggerEmergency: (alertData: Partial<EmergencyAlert>) => void;
  clearEmergency: (alertId: string) => void;
  
  // CRUD Actions
  addScreen: (screen: DigitalScreen) => void;
  updateScreen: (id: string, partial: Partial<DigitalScreen>) => void;
  deleteScreen: (id: string) => void;

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

  // Remote Commands
  sendCommandToScreen: (screenId: string, command: RealtimeCommand['command'], payload?: any) => void;
  addTelemetryLog: (log: Omit<TelemetryLog, 'id'>) => void;
  recordProofOfPlay: (pop: Omit<ProofOfPlayLog, 'id'>) => void;
}

export const useSignageStore = create<SignageStoreState>((set, get) => ({
  viewMode: 'admin',
  setViewMode: (viewMode) => set({ viewMode }),
  activeAdminTab: 'screens',
  setActiveAdminTab: (activeAdminTab) => set({ activeAdminTab }),

  isAiEnabled: true,
  toggleAi: () => set((state) => ({ isAiEnabled: !state.isAiEnabled })),
  setIsAiEnabled: (isAiEnabled) => set({ isAiEnabled }),

  wsConnected: true,
  setWsConnected: (wsConnected) => set({ wsConnected }),

  screens: INITIAL_SCREENS,
  mediaItems: INITIAL_MEDIA_ITEMS,
  layouts: INITIAL_LAYOUTS,
  playlists: INITIAL_PLAYLISTS,
  schedules: INITIAL_SCHEDULES,
  emergencyAlerts: INITIAL_EMERGENCY_ALERTS,
  telemetryLogs: INITIAL_TELEMETRY_LOGS,
  proofOfPlayLogs: INITIAL_PROOF_OF_PLAY,

  selectedScreenId: 'scr-001',
  setSelectedScreenId: (id) => set({ selectedScreenId: id }),
  selectedLayoutId: 'lay-split-3zone',
  setSelectedLayoutId: (id) => set({ selectedLayoutId: id }),
  selectedPlaylistId: 'pl-corporate-main',
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id }),

  playerScreenId: 'scr-001',
  setPlayerScreenId: (playerScreenId) => set({ playerScreenId }),
  isSimulatedOffline: false,
  setIsSimulatedOffline: (isSimulatedOffline) => set({ isSimulatedOffline }),
  playerBufferProgress: 100,

  triggerEmergency: (alertData) => {
    const newAlert: EmergencyAlert = {
      id: 'emg-' + Date.now(),
      title: alertData.title || 'EMERGENCY BROADCAST ALERT',
      message: alertData.message || 'ATTENTION ALL OCCUPANTS: Follow facility emergency safety guidelines immediately.',
      type: alertData.type || 'custom',
      severity: alertData.severity || 'critical',
      targetScreenIds: alertData.targetScreenIds || [],
      active: true,
      triggeredAt: new Date().toISOString(),
      triggeredBy: 'Security Operations Center'
    };

    set((state) => ({
      emergencyAlerts: [newAlert, ...state.emergencyAlerts.map(a => ({ ...a, active: false }))],
      screens: state.screens.map((scr) => {
        if (newAlert.targetScreenIds.length === 0 || newAlert.targetScreenIds.includes(scr.id)) {
          return { ...scr, status: 'emergency', activeEmergencyId: newAlert.id };
        }
        return scr;
      })
    }));

    get().addTelemetryLog({
      screenId: 'ALL',
      screenName: 'GLOBAL SYSTEM BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: 'command_exec',
      message: `🚨 EMERGENCY TRIGGERED: ${newAlert.title}`
    });
  },

  clearEmergency: (alertId) => {
    set((state) => ({
      emergencyAlerts: state.emergencyAlerts.map((a) => a.id === alertId ? { ...a, active: false } : a),
      screens: state.screens.map((scr) => scr.activeEmergencyId === alertId ? { ...scr, status: 'online', activeEmergencyId: undefined } : scr)
    }));

    get().addTelemetryLog({
      screenId: 'ALL',
      screenName: 'GLOBAL SYSTEM BROADCAST',
      timestamp: new Date().toISOString(),
      eventType: 'command_exec',
      message: '✅ Emergency Broadcast Cleared. Normal playback restored.'
    });
  },

  // CRUD Actions
  addScreen: (screen) => set((state) => ({ screens: [screen, ...state.screens] })),
  updateScreen: (id, partial) => set((state) => ({
    screens: state.screens.map((s) => s.id === id ? { ...s, ...partial } : s)
  })),
  deleteScreen: (id) => set((state) => ({ screens: state.screens.filter((s) => s.id !== id) })),

  addMediaItem: (media) => set((state) => ({ mediaItems: [media, ...state.mediaItems] })),
  deleteMediaItem: (id) => set((state) => ({ mediaItems: state.mediaItems.filter((m) => m.id !== id) })),

  addLayout: (layout) => set((state) => ({ layouts: [layout, ...state.layouts] })),
  updateLayout: (id, partial) => set((state) => ({
    layouts: state.layouts.map((l) => l.id === id ? { ...l, ...partial } : l)
  })),
  deleteLayout: (id) => set((state) => ({ layouts: state.layouts.filter((l) => l.id !== id) })),

  addPlaylist: (playlist) => set((state) => ({ playlists: [playlist, ...state.playlists] })),
  updatePlaylist: (id, partial) => set((state) => ({
    playlists: state.playlists.map((p) => p.id === id ? { ...p, ...partial } : p)
  })),
  deletePlaylist: (id) => set((state) => ({ playlists: state.playlists.filter((p) => p.id !== id) })),

  addSchedule: (schedule) => set((state) => ({ schedules: [schedule, ...state.schedules] })),
  updateSchedule: (id, partial) => set((state) => ({
    schedules: state.schedules.map((s) => s.id === id ? { ...s, ...partial } : s)
  })),
  deleteSchedule: (id) => set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) })),

  // Remote Commands
  sendCommandToScreen: (screenId, command, payload) => {
    const state = get();
    const scr = state.screens.find((s) => s.id === screenId);
    const screenName = scr ? scr.name : 'Unknown Screen';

    if (command === 'REBOOT') {
      state.updateScreen(screenId, { status: 'syncing', uptimeSeconds: 0 });
      setTimeout(() => {
        state.updateScreen(screenId, { status: 'online' });
      }, 3000);
    } else if (command === 'TAKE_SCREENSHOT') {
      const screenshots = [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'
      ];
      const randomScreenshot = screenshots[Math.floor(Math.random() * screenshots.length)];
      state.updateScreen(screenId, { lastScreenshotUrl: randomScreenshot });
    } else if (command === 'PURGE_CACHE') {
      state.updateScreen(screenId, { storageUsageMb: 250, bufferCachedItemsCount: 0 });
    } else if (command === 'SET_LAYOUT' && payload?.layoutId) {
      state.updateScreen(screenId, { currentLayoutId: payload.layoutId });
    } else if (command === 'SET_VOLUME' && payload?.volume !== undefined) {
      state.updateScreen(screenId, { volume: payload.volume, isMuted: payload.volume === 0 });
    }

    state.addTelemetryLog({
      screenId,
      screenName,
      timestamp: new Date().toISOString(),
      eventType: 'command_exec',
      message: `Executed WebSocket Command: ${command} ${payload ? JSON.stringify(payload) : ''}`
    });
  },

  addTelemetryLog: (log) => set((state) => ({
    telemetryLogs: [{ id: 'log-' + Date.now() + Math.random(), ...log }, ...state.telemetryLogs.slice(0, 99)]
  })),

  recordProofOfPlay: (pop) => set((state) => ({
    proofOfPlayLogs: [{ id: 'pop-' + Date.now() + Math.random(), ...pop }, ...state.proofOfPlayLogs.slice(0, 99)]
  }))
}));
