import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Grid, 
  List, 
  Plus, 
  RefreshCw, 
  Camera, 
  Volume2, 
  VolumeX, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Layers, 
  Maximize2, 
  Sliders, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Unlink,
  QrCode,
  Copy,
  Check,
  Eye
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../i18n';
import { DigitalScreen } from '../../types/signage';
import { LiveScreenPreview } from './LiveScreenPreview';

const STATUS_T_KEY: Record<string, TranslationKey> = {
  online: 'sm.statusOnline', syncing: 'sm.statusSyncing', offline: 'sm.statusOffline',
  emergency: 'sm.statusEmergency', error: 'sm.statusError',
};

export const ScreensManager: React.FC = () => {
  const { t } = useTranslation();
  const { 
    screens, 
    layouts, 
    playlists, 
    mediaItems,
    addScreen, 
    updateScreen, 
    deleteScreen, 
    refreshScreens,
    sendCommandToScreen,
    setPlayerScreenId,
    setViewMode,
    setSelectedScreenId
  } = useSignageStore();
  const screenStates = useSignageStore((s) => s.screenStates);

  // Live preview: มี state สด (< 90 วิ) → แสดง badge LIVE บนการ์ด
  const isLiveFresh = (scr: DigitalScreen) => {
    const st = screenStates[scr.id];
    if (!st?.updatedAt) return false;
    return Date.now() - new Date(st.updatedAt).getTime() < 90_000;
  };

  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  // REQ-008: monitoring poll — รีเฟรชสถานะจอจาก server ทุก 60 วิ
  useEffect(() => {
    void refreshScreens();
    const timer = setInterval(() => { void refreshScreens(); }, 60_000);
    return () => clearInterval(timer);
  }, [refreshScreens]);

  // REQ-008: heartbeat helpers — อัปล่าสุด/ระยะเวลา offline
  const heartbeatInfo = (scr: DigitalScreen) => {
    if (!scr.lastHeartbeat) return { label: t('sm.noHeartbeat'), minutes: null, stale: false };
    const hb = new Date(scr.lastHeartbeat).getTime();
    const minutes = Math.max(0, Math.floor((Date.now() - hb) / 60_000));
    return { label: minutes < 1 ? t('sm.justNow') : `❤️ ${minutes}m`, minutes, stale: minutes >= 5 };
  };
  const offlineScreens = screens.filter((s) => s.status === 'offline' && heartbeatInfo(s).stale);
  
  // Modal for adding a new screen
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenGroup, setNewScreenGroup] = useState('HQ Reception');
  const [newScreenLocation, setNewScreenLocation] = useState('Building A Lobby');
  const [newScreenOrientation, setNewScreenOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Live Screen Preview Modal (REQ-012): เห็นสิ่งที่จอแสดงอยู่แบบเรียลไทม์
  const [liveScreen, setLiveScreen] = useState<DigitalScreen | null>(null);

  // Detailed Screen Inspector Modal
  const [inspectScreen, setInspectScreen] = useState<DigitalScreen | null>(null);
  const [qrScreen, setQrScreen] = useState<DigitalScreen | null>(null);
  const [qrCopied, setQrCopied] = useState(false);

  // Mode-aware pairing URL (window.location.origin → http/https ถูกโหมดอัตโนมัติ)
  const pairingUrlFor = (scr: DigitalScreen) =>
    `${window.location.origin}/pair?code=${encodeURIComponent(scr.pairingCode)}`;

  // Bulk Actions
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkLayoutId, setBulkLayoutId] = useState('');
  const [bulkPlaylistId, setBulkPlaylistId] = useState('');

  const groups = Array.from(new Set(screens.map((s) => s.group)));

  const filteredScreens = screens.filter((scr) => {
    const matchesQuery = scr.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         scr.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scr.pairingCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || scr.status === statusFilter;
    const matchesGroup = selectedGroup === 'all' || scr.group === selectedGroup;
    return matchesQuery && matchesStatus && matchesGroup;
  });

  const handleCreateScreen = (e: React.FormEvent) => {
    e.preventDefault();
    const code = 'SCR-' + Math.floor(1000 + Math.random() * 9000);
    const newScr: DigitalScreen = {
      id: 'scr-' + Date.now(),
      pairingCode: code,
      name: newScreenName || 'New Display Unit',
      group: newScreenGroup,
      tags: [],
      location: newScreenLocation,
      orientation: newScreenOrientation,
      resolution: newScreenOrientation === 'portrait' ? '1080x1920 (Portrait)' : '1920x1080 (FHD)',
      status: 'offline',
      lastHeartbeat: new Date().toISOString(),
      ipAddress: '',
      macAddress: '',
      storageUsageMb: 0,
      storageTotalMb: 16000,
      bufferCachedItemsCount: 0,
      currentLayoutId: layouts[0]?.id || 'lay-split-3zone',
      currentPlaylistId: playlists[0]?.id || 'pl-corporate-main',
      volume: 80,
      isMuted: false,
      firmwareVersion: '',
      uptimeSeconds: 0,
    };

    addScreen(newScr);
    setIsAddModalOpen(false);
    setNewScreenName('');
  };

  const handleLaunchPlayer = (screenId: string) => {
    setPlayerScreenId(screenId);
    setViewMode('player');
  };

  // === Bulk Actions ===
  const toggleScreenSelection = (id: string) => {
    setSelectedScreenIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAllInGroup = () => {
    const ids = filteredScreens.map(s => s.id);
    setSelectedScreenIds(ids);
  };

  const clearSelection = () => {
    setSelectedScreenIds([]);
  };

  const handleBulkAssignLayout = () => {
    if (!bulkLayoutId) return;
    selectedScreenIds.forEach(id => {
      updateScreen(id, { currentLayoutId: bulkLayoutId } as any);
    });
    setBulkLayoutId('');
    setSelectedScreenIds([]);
  };

  const handleBulkAssignPlaylist = () => {
    if (!bulkPlaylistId) return;
    selectedScreenIds.forEach(id => {
      updateScreen(id, { currentPlaylistId: bulkPlaylistId } as any);
    });
    setBulkPlaylistId('');
    setSelectedScreenIds([]);
  };

  const handleBulkCommand = (command: string) => {
    selectedScreenIds.forEach(id => {
      sendCommandToScreen(id, command as any);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* REQ-008: Monitoring Alert Banner — จอ offline เกิน 5 นาที */}
      {offlineScreens.length > 0 && (
        <div className="flex items-center gap-3 bg-rose-950/40 border border-rose-700/40 rounded-2xl px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-bold text-rose-300">⚠️ {offlineScreens.length} จอไม่ตอบสนอง (offline &gt; 5 นาที)</p>
            <p className="text-[11px] text-rose-400/80 mt-0.5 truncate">{offlineScreens.map((s) => s.name).join(', ')}</p>
          </div>
          <button onClick={() => void refreshScreens()} className="px-3 py-1.5 rounded-lg bg-rose-800/50 hover:bg-rose-700/50 text-rose-200 text-[10px] font-bold shrink-0">
            <RefreshCw className="h-3 w-3 inline mr-1" />รีเฟรช
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-cyan-400" />
            <span>{t('sm.title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('sm.subtitle')}</p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewType('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewType('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            id="btn-add-screen"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('sm.pairNew')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('sm.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Group Filter */}
        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">{t('sm.allGroups', { count: screens.length })}</option>
          {groups.map((grp) => (
            <option key={grp} value={grp}>{grp}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">{t('sm.allStatuses')}</option>
          <option value="online">{t('sm.statusOnline')}</option>
          <option value="syncing">{t('sm.statusSyncing')}</option>
          <option value="offline">{t('sm.statusOffline')}</option>
          <option value="emergency">{t('sm.statusEmergency')}</option>
        </select>
      </div>

      {/* Bulk Actions Bar */}
      {selectedScreenIds.length > 0 && (
        <div className="flex items-center justify-between bg-cyan-950/50 border border-cyan-800/50 rounded-xl p-3 flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-cyan-300">{t('sm.selectedCount', { count: selectedScreenIds.length })}</span>
            <button onClick={selectAllInGroup} className="text-[10px] text-cyan-400 hover:text-cyan-300 underline">{t('sm.selectAllVisible')}</button>
            <button onClick={clearSelection} className="text-[10px] text-slate-400 hover:text-white underline">{t('sm.clear')}</button>
          </div>
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {/* Bulk Assign Layout */}
            <select
              value={bulkLayoutId}
              onChange={(e) => setBulkLayoutId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white"
            >
              <option value="">{t('sm.assignLayout')}</option>
              {layouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            {bulkLayoutId && (
              <button onClick={handleBulkAssignLayout} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg">{t('sm.apply')}</button>
            )}

            {/* Bulk Assign Playlist */}
            <select
              value={bulkPlaylistId}
              onChange={(e) => setBulkPlaylistId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[10px] text-white"
            >
              <option value="">{t('sm.assignPlaylist')}</option>
              {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {bulkPlaylistId && (
              <button onClick={handleBulkAssignPlaylist} className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg">{t('sm.apply')}</button>
            )}

            {/* Bulk Commands */}
            <button onClick={() => handleBulkCommand('REBOOT')} className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold rounded-lg">{t('sm.rebootAll')}</button>
            <button onClick={() => handleBulkCommand('REFRESH_CONTENT')} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg">{t('sm.refreshAll')}</button>
          </div>
        </div>
      )}

      {/* Screens Grid View */}
      {viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredScreens.map((scr) => {
            const currentLayout = layouts.find((l) => l.id === scr.currentLayoutId);
            const currentPlaylist = playlists.find((p) => p.id === scr.currentPlaylistId);
            const storagePercent = Math.round((scr.storageUsageMb / scr.storageTotalMb) * 100);

            return (
              <div 
                key={scr.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700 shadow-xl flex flex-col justify-between relative ${
                  selectedScreenIds.includes(scr.id) ? 'ring-2 ring-cyan-400/50 border-cyan-500/50' :
                  scr.status === 'emergency' 
                    ? 'border-rose-500/80 ring-2 ring-rose-500/30' 
                    : scr.status === 'online'
                    ? 'border-slate-800'
                    : 'border-slate-800/60 opacity-80'
                }`}
              >
                {/* Selection Checkbox */}
                <button
                  onClick={() => toggleScreenSelection(scr.id)}
                  className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center text-[10px] transition-all ${
                    selectedScreenIds.includes(scr.id)
                      ? 'bg-cyan-500 border-cyan-400 text-white'
                      : 'bg-slate-800/80 border-slate-600 text-transparent hover:border-cyan-500'
                  }`}
                >
                  ✓
                </button>
                {/* Live Screen Preview Frame */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                  {(() => {
                    // Try screenshot first, then playlist media thumbnail
                    const previewUrl = scr.lastScreenshotUrl || (() => {
                      const pl = playlists.find(p => p.id === scr.currentPlaylistId);
                      if (pl?.items?.length) {
                        const firstItem = pl.items[0];
                        const media = mediaItems.find(m => m.id === firstItem.mediaId);
                        return media?.thumbnailUrl || media?.url || null;
                      }
                      return null;
                    })();

                    return previewUrl ? (
                      previewUrl.endsWith('.mp4') || previewUrl.endsWith('.webm') ? (
                        <video src={previewUrl} muted preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
                      ) : (
                        <img src={previewUrl} alt={scr.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                        <Monitor className="h-10 w-10 mb-2 opacity-50" />
                        <span className="text-xs">{t('sm.noSignal')}</span>
                      </div>
                    );
                  })()}

                  {/* Top Status Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-md ${
                      scr.status === 'online' 
                        ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-500/40' 
                        : scr.status === 'emergency'
                        ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40 animate-pulse'
                        : scr.status === 'syncing'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-950/90 text-slate-400 border border-slate-700/40'
                    }`}>
                      <span className={`h-2 w-2 rounded-full ${
                        scr.status === 'online' ? 'bg-emerald-400' : scr.status === 'emergency' ? 'bg-rose-400 animate-ping' : 'bg-slate-500'
                      }`} />
                      <span className="uppercase">{t(STATUS_T_KEY[scr.status] ?? 'sm.statusOffline')}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono font-bold text-slate-300">
                      {scr.pairingCode}
                    </span>
                    {/* REQ-008: heartbeat indicator */}
                    <span className={`px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[9px] font-mono ${heartbeatInfo(scr).stale ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {heartbeatInfo(scr).label}
                    </span>
                    {/* Live Screen Preview: มี state สด → badge LIVE */}
                    {isLiveFresh(scr) && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 animate-pulse">
                        LIVE
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay - Launch Player */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                    <button
                      onClick={() => handleLaunchPlayer(scr.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      <Play className="h-4 w-4" />
                      <span>{t('sm.launchPlayer')}</span>
                    </button>
                    <button
                      onClick={() => setInspectScreen(scr)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
                    >
                      <Sliders className="h-4 w-4" />
                      <span>{t('sm.details')}</span>
                    </button>
                    <button
                      onClick={() => { setQrScreen(scr); setQrCopied(false); }}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-all"
                      title="QR ลิงก์จับคู่ (URL ถูกโหมดอัตโนมัติ)"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>{t('sm.pairingQr')}</span>
                    </button>
                    <button
                      onClick={() => setLiveScreen(scr)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-semibold text-xs transition-all"
                      title="Live Screen Preview — เห็นสิ่งที่จอแสดงอยู่แบบเรียลไทม์"
                    >
                      <Eye className="h-4 w-4" />
                      <span>{t('sm.livePreview')}</span>
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">{scr.group}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{scr.resolution}</span>
                    </div>
                    <h3 className="font-bold text-white text-sm mt-0.5 line-clamp-1">{scr.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{scr.location}</p>
                  </div>

                  {/* Active Layout & Playlist */}
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center space-x-1.5 text-slate-400">
                        <Layers className="h-3.5 w-3.5 text-cyan-400" />
                        <span>{t('sm.layout')}</span>
                      </span>
                      <span className="font-medium text-slate-200 line-clamp-1">{currentLayout?.name || 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center space-x-1.5 text-slate-400">
                        <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>{t('sm.playlist')}</span>
                      </span>
                      <span className="font-medium text-slate-200 line-clamp-1">{currentPlaylist?.name || 'Default Sequence'}</span>
                    </div>
                  </div>

                  {/* Telemetry Storage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <HardDrive className="h-3 w-3 text-slate-500" />
                        <span>{t('sm.localBuffer')}</span>
                      </span>
                      <span className="font-mono font-medium text-slate-300">{scr.storageUsageMb}MB / {scr.storageTotalMb}MB ({storagePercent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          storagePercent > 80 ? 'bg-amber-500' : 'bg-cyan-500'
                        }`}
                        style={{ width: `${storagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Quick Action Footer */}
                <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      title={t('sm.rebootEngine')}
                      onClick={() => sendCommandToScreen(scr.id, 'REBOOT')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title={t('sm.takeScreenshot')}
                      onClick={() => sendCommandToScreen(scr.id, 'TAKE_SCREENSHOT')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title={scr.isMuted ? t('sm.unmute') : t('sm.mute')}
                      onClick={() => updateScreen(scr.id, { isMuted: !scr.isMuted })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      {scr.isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      title={t('sm.unpairDevice')}
                      onClick={() => { if (confirm(t('sm.unpairConfirm', { name: scr.name }))) sendCommandToScreen(scr.id, 'UNPAIR_DEVICE'); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title={t('sm.forceDisplay')}
                      onClick={() => sendCommandToScreen(scr.id, 'FORCE_DISPLAY')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => setInspectScreen(scr)}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {t('sm.configure')}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">{t('sm.status')}</th>
                  <th className="py-3 px-4">{t('sm.displayNameGroup')}</th>
                  <th className="py-3 px-4">{t('sm.location')}</th>
                  <th className="py-3 px-4">{t('sm.ipAddress')}</th>
                  <th className="py-3 px-4">{t('sm.layoutPlaylist')}</th>
                  <th className="py-3 px-4 text-right">{t('sm.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredScreens.map((scr) => (
                  <tr key={scr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        scr.status === 'online' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${scr.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{scr.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      <div>{scr.name}</div>
                      <div className="text-[10px] text-slate-500">{scr.group} • {t('sm.code')}{scr.pairingCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{scr.location}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{scr.ipAddress || <span className="text-slate-600">—</span>}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{layouts.find((l) => l.id === scr.currentLayoutId)?.name || 'Default Layout'}</div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleLaunchPlayer(scr.id)}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[10px]"
                      >
                        {t('sm.launchTv')}
                      </button>
                      <button
                        onClick={() => setInspectScreen(scr)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[10px]"
                      >
                        {t('sm.edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Pair New Display */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">{t('sm.pairTitle')}</h3>
            <p className="text-xs text-slate-400 mb-4">{t('sm.pairSubtitle')}</p>

            <form onSubmit={handleCreateScreen} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('sm.displayName')}</label>
                <input
                  type="text"
                  placeholder="e.g. West Wing Corridor Screen"
                  value={newScreenName}
                  onChange={(e) => setNewScreenName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('sm.displayGroup')}</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Tower"
                  value={newScreenGroup}
                  onChange={(e) => setNewScreenGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('sm.physicalLocation')}</label>
                <input
                  type="text"
                  placeholder="e.g. Building B - Ground Floor"
                  value={newScreenLocation}
                  onChange={(e) => setNewScreenLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('sm.orientation')}</label>
                <select
                  value={newScreenOrientation}
                  onChange={(e) => setNewScreenOrientation(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="landscape">{t('sm.landscape')}</option>
                  <option value="portrait">{t('sm.portrait')}</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {t('sm.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg"
                >
                  {t('sm.generatePairing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Details Inspector Drawer */}
      {/* Live Screen Preview Modal — สถานะสดจาก WS (อัปเดตเรียลไทม์) */}
      {liveScreen && (
        <LiveScreenPreview screen={liveScreen} onClose={() => setLiveScreen(null)} />
      )}

      {inspectScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {inspectScreen.pairingCode}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{inspectScreen.name}</h3>
                <p className="text-xs text-slate-400">{inspectScreen.location}</p>
              </div>
              <button onClick={() => setInspectScreen(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Config Form */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{t('sm.assignedLayout')}</label>
                <select
                  value={inspectScreen.currentLayoutId || ''}
                  onChange={(e) => { updateScreen(inspectScreen.id, { currentLayoutId: e.target.value } as any); setInspectScreen({ ...inspectScreen, currentLayoutId: e.target.value }); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">{t('sm.autoFromSchedule')}</option>
                  {layouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{t('sm.assignedPlaylist')}</label>
                <select
                  value={inspectScreen.currentPlaylistId || ''}
                  onChange={(e) => { updateScreen(inspectScreen.id, { currentPlaylistId: e.target.value } as any); setInspectScreen({ ...inspectScreen, currentPlaylistId: e.target.value }); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">{t('sm.autoFromSchedule')}</option>
                  {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>

            {/* REQ-TagMatch: tags สำหรับ auto-match */}
            <div className="text-xs mt-3">
              <label className="text-slate-400 block mb-1">🎯 Tags (จับคู่เนื้อหาอัตโนมัติ)</label>
              <input
                value={(inspectScreen.tags || []).join(', ')}
                onChange={(e) => { const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean); updateScreen(inspectScreen.id, { tags } as any); setInspectScreen({ ...inspectScreen, tags }); }}
                placeholder="cafeteria, menu, lobby..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                จอจะได้เพลย์ลิสต์/layout ที่มี tag ตรงกันโดยอัตโนมัติ (จอใหม่ + ตั้ง tag → ได้เนื้อหาทันที ไม่ต้องสร้าง schedule)
              </p>
              {(() => {
                const st = (inspectScreen.tags || []).map(t => t.toLowerCase());
                const matchedPl = playlists.find(p => (p.tags || []).some(t => st.includes(t.toLowerCase())));
                return matchedPl ? (
                  <p className="text-[10px] text-cyan-400 mt-1">⚡ Auto-match: จะใช้เพลย์ลิสต์ "{matchedPl.name}" เมื่อไม่มี schedule</p>
                ) : null;
              })()}
            </div>

            {/* Priority Explanation */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-[10px] text-slate-400 space-y-1 mt-3">
              <p className="font-semibold text-slate-300 text-xs mb-1.5">📋 ลำดับ Priority การแสดงผล:</p>
              <p><span className="text-rose-400 font-bold">1.</span> 🚨 Emergency Override — สูงสุด</p>
              <p><span className="text-amber-400 font-bold">2.</span> 📅 Schedule Rule — ตรงเวลา+วัน จะ override ทุกอย่าง</p>
              <p><span className="text-cyan-400 font-bold">3.</span> 📺 Screen Default (ตั้งค่าที่นี่) — ใช้เมื่อไม่มี Schedule</p>
              <p><span className="text-slate-500 font-bold">4.</span> 🎬 Zone Playlist (ใน Layout) — fallback ต่ำสุด</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">{t('sm.audioVolume', { pct: inspectScreen.volume })}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={inspectScreen.volume}
                  onChange={(e) => updateScreen(inspectScreen.id, { volume: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{t('sm.networkInfo')}</label>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded-xl space-y-0.5">
                  <div>{t('sm.ip')}{inspectScreen.ipAddress || <span className="text-slate-600">— (รอ device รายงานตัว)</span>}</div>
                  <div>{t('sm.mac')}{inspectScreen.macAddress || <span className="text-slate-600">— (Android player จะรายงานจริง)</span>}</div>
                  <div className="text-slate-500">
                    {t('sm.lastBeat')}{inspectScreen.lastHeartbeat ? new Date(inspectScreen.lastHeartbeat).toLocaleString('th-TH') : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => {
                  deleteScreen(inspectScreen.id);
                  setInspectScreen(null);
                }}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300"
              >
                {t('sm.deleteScreen')}
              </button>
              <button
                onClick={() => setInspectScreen(null)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-xs text-white"
              >
                {t('sm.done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pairing QR Modal — ช่างสแกนได้เลย (URL ถูกโหมดอัตโนมัติ) */}
      {qrScreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 text-white shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {qrScreen.pairingCode}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{qrScreen.name}</h3>
              </div>
              <button onClick={() => setQrScreen(null)} className="p-1 rounded-lg text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-white p-3 rounded-2xl w-fit mx-auto">
              <QRCodeSVG value={pairingUrlFor(qrScreen)} size={200} level="H" includeMargin={true} />
            </div>

            <div className="text-[11px] text-slate-400 font-mono break-all bg-slate-950 rounded-xl p-3 border border-slate-800 text-left">
              {pairingUrlFor(qrScreen)}
            </div>

            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(pairingUrlFor(qrScreen));
                  setQrCopied(true);
                  setTimeout(() => setQrCopied(false), 2000);
                } catch { /* ignore */ }
              }}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center justify-center gap-2"
            >
              {qrCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              {qrCopied ? t('sm.copied') : t('sm.copyLink')}
            </button>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              สแกน QR ด้วยมือถือ → เปิดหน้า /pair พร้อมรหัสที่กรอกไว้แล้ว —
              URL ถูกโหมดอัตโนมัติ (https/http ตามที่เปิด Admin อยู่นี้) ช่างไม่ต้องพิมพ์
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
