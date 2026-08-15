import React, { useState } from 'react';
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
  Play
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { DigitalScreen } from '../../types/signage';

export const ScreensManager: React.FC = () => {
  const { 
    screens, 
    layouts, 
    playlists, 
    addScreen, 
    updateScreen, 
    deleteScreen, 
    sendCommandToScreen,
    setPlayerScreenId,
    setViewMode,
    setSelectedScreenId
  } = useSignageStore();

  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  
  // Modal for adding a new screen
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [newScreenGroup, setNewScreenGroup] = useState('HQ Reception');
  const [newScreenLocation, setNewScreenLocation] = useState('Building A Lobby');
  const [newScreenOrientation, setNewScreenOrientation] = useState<'landscape' | 'portrait'>('landscape');

  // Detailed Screen Inspector Modal
  const [inspectScreen, setInspectScreen] = useState<DigitalScreen | null>(null);

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
      location: newScreenLocation,
      orientation: newScreenOrientation,
      resolution: newScreenOrientation === 'portrait' ? '1080x1920 (Portrait)' : '1920x1080 (FHD)',
      status: 'online',
      lastHeartbeat: new Date().toISOString(),
      ipAddress: '192.168.1.' + Math.floor(10 + Math.random() * 200),
      macAddress: '00:1B:44:' + Math.floor(10 + Math.random() * 80) + ':AA:BB',
      storageUsageMb: 850,
      storageTotalMb: 16000,
      bufferCachedItemsCount: 4,
      currentLayoutId: layouts[0]?.id || 'lay-split-3zone',
      currentPlaylistId: playlists[0]?.id || 'pl-corporate-main',
      volume: 80,
      isMuted: false,
      firmwareVersion: 'v4.2.1-prod',
      uptimeSeconds: 3600,
      lastScreenshotUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
    };

    addScreen(newScr);
    setIsAddModalOpen(false);
    setNewScreenName('');
  };

  const handleLaunchPlayer = (screenId: string) => {
    setPlayerScreenId(screenId);
    setViewMode('player');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-cyan-400" />
            <span>Enterprise Displays Matrix</span>
          </h2>
          <p className="text-xs text-slate-400">Manage real-time digital signage displays, pair smart TVs, and monitor live status</p>
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
            <span>Pair New Display</span>
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
            placeholder="Search screen name, location, code..."
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
          <option value="all">All Groups ({screens.length})</option>
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
          <option value="all">All Statuses</option>
          <option value="online">Online</option>
          <option value="syncing">Syncing</option>
          <option value="offline">Offline</option>
          <option value="emergency">Emergency Active</option>
        </select>
      </div>

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
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-700 shadow-xl flex flex-col justify-between ${
                  scr.status === 'emergency' 
                    ? 'border-rose-500/80 ring-2 ring-rose-500/30' 
                    : scr.status === 'online'
                    ? 'border-slate-800'
                    : 'border-slate-800/60 opacity-80'
                }`}
              >
                {/* Live Screen Preview Frame */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                  {scr.lastScreenshotUrl ? (
                    <img 
                      src={scr.lastScreenshotUrl} 
                      alt={scr.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-slate-950">
                      <Monitor className="h-10 w-10 mb-2 opacity-50" />
                      <span className="text-xs">No Signal Preview</span>
                    </div>
                  )}

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
                      <span className="uppercase">{scr.status}</span>
                    </span>

                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono font-bold text-slate-300">
                      {scr.pairingCode}
                    </span>
                  </div>

                  {/* Hover Overlay - Launch Player */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                    <button
                      onClick={() => handleLaunchPlayer(scr.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      <Play className="h-4 w-4" />
                      <span>Launch Player</span>
                    </button>
                    <button
                      onClick={() => setInspectScreen(scr)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
                    >
                      <Sliders className="h-4 w-4" />
                      <span>Details</span>
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
                        <span>Layout:</span>
                      </span>
                      <span className="font-medium text-slate-200 line-clamp-1">{currentLayout?.name || 'Standard'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center space-x-1.5 text-slate-400">
                        <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Playlist:</span>
                      </span>
                      <span className="font-medium text-slate-200 line-clamp-1">{currentPlaylist?.name || 'Default Sequence'}</span>
                    </div>
                  </div>

                  {/* Telemetry Storage Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <HardDrive className="h-3 w-3 text-slate-500" />
                        <span>Local Media Buffer:</span>
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
                      title="Reboot Engine"
                      onClick={() => sendCommandToScreen(scr.id, 'REBOOT')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Take Screenshot"
                      onClick={() => sendCommandToScreen(scr.id, 'TAKE_SCREENSHOT')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title={scr.isMuted ? 'Unmute' : 'Mute'}
                      onClick={() => updateScreen(scr.id, { isMuted: !scr.isMuted })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                    >
                      {scr.isMuted ? <VolumeX className="h-3.5 w-3.5 text-rose-400" /> : <Volume2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <button
                    onClick={() => setInspectScreen(scr)}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Configure →
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
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Display Name & Group</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Layout / Playlist</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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
                      <div className="text-[10px] text-slate-500">{scr.group} • Code: {scr.pairingCode}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{scr.location}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{scr.ipAddress}</td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{layouts.find((l) => l.id === scr.currentLayoutId)?.name || 'Default Layout'}</div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleLaunchPlayer(scr.id)}
                        className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-[10px]"
                      >
                        Launch TV
                      </button>
                      <button
                        onClick={() => setInspectScreen(scr)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg text-[10px]"
                      >
                        Edit
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
            <h3 className="text-lg font-bold text-white mb-1">Pair New Digital Display</h3>
            <p className="text-xs text-slate-400 mb-4">Registers a new Smart TV screen into your cloud matrix</p>

            <form onSubmit={handleCreateScreen} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Display Name</label>
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">Display Group</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Tower"
                  value={newScreenGroup}
                  onChange={(e) => setNewScreenGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Building B - Ground Floor"
                  value={newScreenLocation}
                  onChange={(e) => setNewScreenLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Orientation</label>
                <select
                  value={newScreenOrientation}
                  onChange={(e) => setNewScreenOrientation(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="landscape">Landscape (16:9)</option>
                  <option value="portrait">Portrait (9:16)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg"
                >
                  Generate Pairing Code & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Details Inspector Drawer */}
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
                <label className="text-slate-400 block mb-1">Assigned Smart Layout</label>
                <select
                  value={inspectScreen.currentLayoutId || ''}
                  onChange={(e) => updateScreen(inspectScreen.id, { currentLayoutId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  {layouts.map((lay) => (
                    <option key={lay.id} value={lay.id}>{lay.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Assigned Playlist Sequence</label>
                <select
                  value={inspectScreen.currentPlaylistId || ''}
                  onChange={(e) => updateScreen(inspectScreen.id, { currentPlaylistId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                >
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Audio Volume ({inspectScreen.volume}%)</label>
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
                <label className="text-slate-400 block mb-1">Network Info</label>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2 rounded-xl">
                  IP: {inspectScreen.ipAddress} | MAC: {inspectScreen.macAddress}
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
                Delete Screen
              </button>
              <button
                onClick={() => setInspectScreen(null)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-xs text-white"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
