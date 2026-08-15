import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  Trash2, 
  Maximize2, 
  LayoutGrid, 
  Check, 
  Sparkles, 
  Settings, 
  Film, 
  Radio, 
  Clock, 
  CloudSun, 
  Type,
  Power,
  Wand2
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { LayoutTemplate, LayoutZone, Orientation, MediaType } from '../../types/signage';

export const SmartLayoutBuilder: React.FC = () => {
  const { layouts, playlists, addLayout, updateLayout, deleteLayout, isAiEnabled } = useSignageStore();

  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(layouts[0]?.id || 'lay-split-3zone');
  const activeLayout = layouts.find((l) => l.id === selectedLayoutId) || layouts[0];

  const [activeZoneId, setActiveZoneId] = useState<string | null>(activeLayout?.zones[0]?.id || null);
  
  // New Layout Modal State
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutOrientation, setNewLayoutOrientation] = useState<Orientation>('landscape');
  const [newLayoutAspectRatio, setNewLayoutAspectRatio] = useState('16:9');

  // AI Layout Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiVenuePrompt, setAiVenuePrompt] = useState('Corporate Office Lobby Display');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const selectedZone = activeLayout?.zones.find((z) => z.id === activeZoneId);

  const handleCreateNewLayout = (e: React.FormEvent) => {
    e.preventDefault();
    const id = 'lay-' + Date.now();
    const isPortrait = newLayoutOrientation === 'portrait';
    const newTemplate: LayoutTemplate = {
      id,
      name: newLayoutName || 'Custom Multi-Zone Layout',
      description: 'Custom canvas template with multi-zone support.',
      orientation: newLayoutOrientation,
      aspectRatio: newLayoutAspectRatio,
      widthPx: isPortrait ? 1080 : 1920,
      heightPx: isPortrait ? 1920 : 1080,
      zones: [
        {
          id: 'z-main-' + Date.now(),
          name: 'Main Zone',
          x: 0,
          y: 0,
          width: 100,
          height: 80,
          zIndex: 1,
          playlistId: playlists[0]?.id
        },
        {
          id: 'z-ticker-' + Date.now(),
          name: 'Bottom Ticker',
          x: 0,
          y: 80,
          width: 100,
          height: 20,
          zIndex: 2,
          playlistId: playlists[3]?.id
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addLayout(newTemplate);
    setSelectedLayoutId(id);
    setActiveZoneId(newTemplate.zones[0].id);
    setIsCreatingNew(false);
  };

  const handleGenerateAiLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAi(true);

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text',
          prompt: `Create a zone structure recommendation for a digital signage layout tailored for: ${aiVenuePrompt}.`,
          systemInstruction: 'You are an enterprise Digital Signage Layout Architect.'
        })
      });

      const data = await res.json();
      const id = 'lay-ai-' + Date.now();
      const newTemplate: LayoutTemplate = {
        id,
        name: `AI Preset: ${aiVenuePrompt.slice(0, 20)}`,
        description: data.text || 'AI Optimized Multi-Zone Layout',
        orientation: 'landscape',
        aspectRatio: '16:9',
        widthPx: 1920,
        heightPx: 1080,
        zones: [
          { id: 'z-ai-main-' + Date.now(), name: 'Main Video Stream', x: 0, y: 0, width: 70, height: 80, zIndex: 1, playlistId: playlists[0]?.id },
          { id: 'z-ai-side-' + Date.now(), name: 'Live Widget / Weather', x: 70, y: 0, width: 30, height: 80, zIndex: 1, playlistId: playlists[1]?.id },
          { id: 'z-ai-bottom-' + Date.now(), name: 'Emergency & News Ticker', x: 0, y: 80, width: 100, height: 20, zIndex: 2, playlistId: playlists[3]?.id }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      addLayout(newTemplate);
      setSelectedLayoutId(id);
      setActiveZoneId(newTemplate.zones[0].id);
      setIsAiModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddZone = () => {
    if (!activeLayout) return;
    const newZone: LayoutZone = {
      id: 'zone-' + Date.now(),
      name: `New Zone ${activeLayout.zones.length + 1}`,
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      zIndex: activeLayout.zones.length + 1,
      backgroundColor: '#1e293b'
    };

    const updatedZones = [...activeLayout.zones, newZone];
    updateLayout(activeLayout.id, { zones: updatedZones });
    setActiveZoneId(newZone.id);
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!activeLayout || activeLayout.zones.length <= 1) return;
    const updatedZones = activeLayout.zones.filter((z) => z.id !== zoneId);
    updateLayout(activeLayout.id, { zones: updatedZones });
    setActiveZoneId(updatedZones[0]?.id || null);
  };

  const handleUpdateZoneProps = (zoneId: string, partial: Partial<LayoutZone>) => {
    if (!activeLayout) return;
    const updatedZones = activeLayout.zones.map((z) => z.id === zoneId ? { ...z, ...partial } : z);
    updateLayout(activeLayout.id, { zones: updatedZones });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <span>Smart Layout Builder Engine</span>
          </h2>
          <p className="text-xs text-slate-400">Design multi-zone coordinate templates for 16:9 landscape & 9:16 portrait digital signage</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* AI Preset Generator Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
              isAiEnabled 
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white shadow-indigo-600/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Sparkles className={`h-4 w-4 ${isAiEnabled ? 'text-indigo-300 animate-pulse' : 'text-slate-500'}`} />
            <span>AI Layout Architect</span>
            {!isAiEnabled && <span className="text-[10px] text-slate-500 font-normal">(OFF)</span>}
          </button>

          {/* Template Selector */}
          <select
            value={selectedLayoutId}
            onChange={(e) => {
              setSelectedLayoutId(e.target.value);
              const target = layouts.find((l) => l.id === e.target.value);
              if (target?.zones[0]) setActiveZoneId(target.zones[0].id);
            }}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
          >
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.aspectRatio})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Layout Template</span>
          </button>
        </div>
      </div>

      {/* Main Studio Editor Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Multi-Zone Canvas Studio (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950 px-2.5 py-1 rounded border border-cyan-800">
                CANVAS: {activeLayout.orientation.toUpperCase()} ({activeLayout.aspectRatio})
              </span>
              <span className="text-xs text-slate-400">{activeLayout.widthPx} x {activeLayout.heightPx} px</span>
            </div>

            <button
              onClick={handleAddZone}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
            >
              <Plus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Add Zone</span>
            </button>
          </div>

          {/* Interactive Responsive Canvas Frame */}
          <div className="w-full flex items-center justify-center p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 min-h-[420px]">
            <div 
              className={`relative bg-slate-900 border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl transition-all ${
                activeLayout.orientation === 'portrait' ? 'w-[280px] h-[480px]' : 'w-full max-w-[640px] aspect-video'
              }`}
            >
              {activeLayout.zones.map((zone) => {
                const isSelected = zone.id === activeZoneId;
                const assignedPlaylist = playlists.find((p) => p.id === zone.playlistId);

                return (
                  <div
                    key={zone.id}
                    onClick={() => setActiveZoneId(zone.id)}
                    className={`absolute p-2 flex flex-col justify-between cursor-pointer border-2 transition-all group overflow-hidden ${
                      isSelected 
                        ? 'border-cyan-400 bg-cyan-950/60 ring-2 ring-cyan-400/40 z-20' 
                        : 'border-slate-600/80 bg-slate-800/70 hover:border-slate-400'
                    }`}
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      width: `${zone.width}%`,
                      height: `${zone.height}%`,
                      zIndex: zone.zIndex,
                      backgroundColor: zone.backgroundColor || undefined
                    }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-white bg-slate-950/80 px-2 py-0.5 rounded border border-slate-700">
                      <span className="truncate">{zone.name}</span>
                      <span className="text-cyan-400 font-mono">z:{zone.zIndex}</span>
                    </div>

                    <div className="text-center py-1">
                      <p className="text-[10px] text-slate-300 font-medium truncate">
                        {assignedPlaylist ? assignedPlaylist.name : 'No Playlist Assigned'}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono">
                        {zone.width}% x {zone.height}%
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span>({zone.x}%, {zone.y}%)</span>
                      {activeLayout.zones.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteZone(zone.id);
                          }}
                          className="text-rose-400 hover:text-rose-300 p-0.5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <span>💡 Click any zone on the canvas or sidebar to inspect and configure coordinates.</span>
            <span className="font-semibold text-cyan-400">{activeLayout.zones.length} Active Zones</span>
          </div>
        </div>

        {/* Right: Selected Zone Inspector & Props Panel (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Settings className="h-4 w-4 text-cyan-400" />
            <span>Zone Inspector & Coordinates</span>
          </h3>

          {selectedZone ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Zone Name</label>
                <input
                  type="text"
                  value={selectedZone.name}
                  onChange={(e) => handleUpdateZoneProps(selectedZone.id, { name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Target Playlist Assignment</label>
                <select
                  value={selectedZone.playlistId || ''}
                  onChange={(e) => handleUpdateZoneProps(selectedZone.id, { playlistId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- No Playlist (Blank) --</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name} ({pl.items.length} items)</option>
                  ))}
                </select>
              </div>

              {/* Coordinates Sliders */}
              <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-cyan-400 block uppercase">Coordinate Offsets (%)</span>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>X Position (Left)</span>
                    <span className="font-mono text-cyan-400">{selectedZone.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedZone.x}
                    onChange={(e) => handleUpdateZoneProps(selectedZone.id, { x: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Y Position (Top)</span>
                    <span className="font-mono text-cyan-400">{selectedZone.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedZone.y}
                    onChange={(e) => handleUpdateZoneProps(selectedZone.id, { y: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Width</span>
                    <span className="font-mono text-cyan-400">{selectedZone.width}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={selectedZone.width}
                    onChange={(e) => handleUpdateZoneProps(selectedZone.id, { width: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Height</span>
                    <span className="font-mono text-cyan-400">{selectedZone.height}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={selectedZone.height}
                    onChange={(e) => handleUpdateZoneProps(selectedZone.id, { height: Number(e.target.value) })}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Z-Index Layer</span>
                    <span className="font-mono text-cyan-400">{selectedZone.zIndex}</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={selectedZone.zIndex}
                    onChange={(e) => handleUpdateZoneProps(selectedZone.id, { zIndex: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-500">Select a zone on the canvas to inspect props.</p>
          )}
        </div>

      </div>

      {/* Modal: Create Template */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Create Smart Layout Template</h3>

            <form onSubmit={handleCreateNewLayout} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Executive Lobby Multi-Screen"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Orientation</label>
                <select
                  value={newLayoutOrientation}
                  onChange={(e) => {
                    const orient = e.target.value as Orientation;
                    setNewLayoutOrientation(orient);
                    setNewLayoutAspectRatio(orient === 'portrait' ? '9:16' : '16:9');
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="landscape">Landscape Horizontal (16:9)</option>
                  <option value="portrait">Portrait Vertical (9:16)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white"
                >
                  Create Canvas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Layout Architect */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">AI Venue Layout Architect</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {!isAiEnabled ? (
              <div className="p-4 bg-amber-950/50 border border-amber-800/60 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Power className="h-4 w-4" />
                  <span>AI Features Are Currently Turned OFF</span>
                </div>
                <p className="text-amber-200/80">
                  Toggle the master AI switch ON in the top navbar to automatically generate multi-zone layout templates tailored to any business environment.
                </p>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="mt-2 px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateAiLayout} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Venue / Industry Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Airport Departure Lounge, Hospital Waiting Room, Retail Fashion Boutique"
                    value={aiVenuePrompt}
                    onChange={(e) => setAiVenuePrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                    required
                  />
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 text-[11px] text-slate-400">
                  <p className="font-semibold text-slate-200">✨ AI Layout Engine will auto-calculate:</p>
                  <p>• Optimal multi-zone screen coordinate proportions</p>
                  <p>• Main spotlight zone vs news ticker & live weather widget zones</p>
                </div>

                <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingAi}
                    className={`px-5 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl text-white shadow-lg shadow-indigo-600/30 flex items-center space-x-2 ${
                      isGeneratingAi ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Wand2 className={`h-4 w-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingAi ? 'Generating Preset...' : 'Generate & Load Preset'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
