import React, { useState } from 'react';
import { 
  Radio, 
  RefreshCw, 
  Camera, 
  HardDrive, 
  Volume2, 
  Terminal, 
  Send, 
  Layers, 
  Wifi, 
  CheckCircle2, 
  AlertOctagon 
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';

export const RealtimeControlConsole: React.FC = () => {
  const { screens, layouts, sendCommandToScreen, telemetryLogs } = useSignageStore();

  const [selectedScreenId, setSelectedScreenId] = useState<string>('all');
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>(layouts[0]?.id || '');
  const [volume, setVolume] = useState<number>(75);

  const handleCommand = (command: 'REBOOT' | 'TAKE_SCREENSHOT' | 'PURGE_CACHE' | 'SET_LAYOUT' | 'SET_VOLUME') => {
    const targets = selectedScreenId === 'all' ? screens.map((s) => s.id) : [selectedScreenId];
    
    targets.forEach((targetId) => {
      let payload: any = null;
      if (command === 'SET_LAYOUT') payload = { layoutId: selectedLayoutId };
      if (command === 'SET_VOLUME') payload = { volume };
      
      sendCommandToScreen(targetId, command, payload);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Radio className="h-5 w-5 text-indigo-400" />
            <span>Realtime Screen Control Console</span>
          </h2>
          <p className="text-xs text-slate-400">Direct WebSocket remote control hub for instant commands and telemetry</p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
          <Wifi className="h-4 w-4 text-emerald-400" />
          <span className="font-mono font-bold text-slate-200">WebSocket Port: 3000</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Command Dispatcher Box (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Send className="h-4 w-4 text-cyan-400" />
            <span>Send Remote WebSocket Command</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Display Selection</label>
              <select
                value={selectedScreenId}
                onChange={(e) => setSelectedScreenId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold"
              >
                <option value="all">🌐 ALL Enterprise Screens ({screens.length})</option>
                {screens.map((scr) => (
                  <option key={scr.id} value={scr.id}>📺 {scr.name} ({scr.pairingCode})</option>
                ))}
              </select>
            </div>

            {/* Quick Command Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">1-Click Actions</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCommand('REBOOT')}
                  className="flex items-center justify-center space-x-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-bold transition-all"
                >
                  <RefreshCw className="h-4 w-4 text-cyan-400" />
                  <span>Reboot Engine</span>
                </button>

                <button
                  onClick={() => handleCommand('TAKE_SCREENSHOT')}
                  className="flex items-center justify-center space-x-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-bold transition-all"
                >
                  <Camera className="h-4 w-4 text-indigo-400" />
                  <span>Take Screenshot</span>
                </button>

                <button
                  onClick={() => handleCommand('PURGE_CACHE')}
                  className="flex items-center justify-center space-x-2 p-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-bold transition-all col-span-2"
                >
                  <HardDrive className="h-4 w-4 text-amber-400" />
                  <span>Purge Local Media Cache Buffer</span>
                </button>
              </div>
            </div>

            {/* Change Layout Command */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Instant Layout Override</span>
              <div className="flex space-x-2">
                <select
                  value={selectedLayoutId}
                  onChange={(e) => setSelectedLayoutId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {layouts.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleCommand('SET_LAYOUT')}
                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold text-white rounded-xl"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Set Volume Command */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Set Audio Volume</span>
                <span className="font-mono text-cyan-400">{volume}%</span>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-cyan-500"
                />
                <button
                  onClick={() => handleCommand('SET_VOLUME')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl"
                >
                  Set
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Live Command Execution Feed Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 font-mono shadow-2xl flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
              <span className="flex items-center space-x-2 text-cyan-400 font-bold">
                <Terminal className="h-4 w-4" />
                <span>Live Realtime Telemetry Terminal Logs</span>
              </span>
              <span className="text-[10px] text-slate-500">Auto-scrolling stream</span>
            </div>

            <div className="mt-3 space-y-2 max-h-[340px] overflow-y-auto no-scrollbar pr-1 text-[11px]">
              {telemetryLogs.map((log) => (
                <div key={log.id} className="p-2 rounded bg-slate-900/80 border border-slate-800/80 text-slate-300 space-y-0.5">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className="text-cyan-400 font-bold">[{log.screenName}]</span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200">{log.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 flex justify-between">
            <span>WebSocket Status: Connected</span>
            <span>Channel: /ws</span>
          </div>
        </div>

      </div>

    </div>
  );
};
