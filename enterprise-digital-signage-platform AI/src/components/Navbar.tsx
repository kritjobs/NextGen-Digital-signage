import React, { useState } from 'react';
import { 
  Tv, 
  Monitor, 
  Layers, 
  Film, 
  ListVideo, 
  Calendar, 
  Radio, 
  Activity, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Bot
} from 'lucide-react';
import { useSignageStore } from '../store/useSignageStore';
import { AiGuideModal } from './ai/AiGuideModal';

interface NavbarProps {
  onOpenEmergencyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenEmergencyModal }) => {
  const { 
    viewMode, 
    setViewMode, 
    activeAdminTab, 
    setActiveAdminTab, 
    wsConnected, 
    screens, 
    emergencyAlerts,
    isAiEnabled,
    toggleAi
  } = useSignageStore();

  const [isAiGuideOpen, setIsAiGuideOpen] = useState(false);

  const activeEmergency = emergencyAlerts.find((a) => a.active);
  const onlineCount = screens.filter((s) => s.status === 'online').length;

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Platform Name */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
                <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Tv className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg tracking-tight text-white">SIGNAGE</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400">ENTERPRISE</span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Smart Layout & Realtime Display Engine</p>
              </div>
            </div>

            {/* Mode Switcher Pills */}
            <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                id="nav-mode-admin"
                onClick={() => setViewMode('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'admin'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Admin Console</span>
              </button>

              <button
                id="nav-mode-player"
                onClick={() => setViewMode('player')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'player'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                <span>TV Player App</span>
                <span className="ml-1 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              </button>

              <button
                id="nav-mode-simulator"
                onClick={() => setViewMode('simulator')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'simulator'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Dual Simulator</span>
              </button>
            </div>

            {/* AI Toggle, Emergency Alert & System Status */}
            <div className="flex items-center space-x-2.5">
              
              {/* AI Assistant Quick Toggle & Hub Trigger */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1">
                <button
                  onClick={toggleAi}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isAiEnabled
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}
                  title="Toggle AI Automation ON/OFF"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isAiEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
                  <span>AI {isAiEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={() => setIsAiGuideOpen(true)}
                  className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
                  title="View AI Guide: How & Where to Use AI"
                >
                  <Bot className="h-4 w-4" />
                </button>
              </div>

              {/* Live WS Status */}
              <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
                {wsConnected ? (
                  <>
                    <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-slate-300">WS Live</span>
                    <span className="text-[10px] text-slate-500">({onlineCount}/{screens.length} online)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-amber-300">WS Offline</span>
                  </>
                )}
              </div>

              {/* Emergency Broadcast Quick Trigger Button */}
              <button
                id="btn-emergency-trigger"
                onClick={onOpenEmergencyModal}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                  activeEmergency 
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/50' 
                    : 'bg-rose-950/80 hover:bg-rose-900 border border-rose-800/60 text-rose-300 hover:text-rose-100'
                }`}
              >
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                <span>{activeEmergency ? 'EMERGENCY ACTIVE' : 'EMERGENCY ALERT'}</span>
              </button>
            </div>

          </div>

          {/* Admin Navigation Tabs (Only visible in Admin view) */}
          {viewMode === 'admin' && (
            <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
              <button
                id="tab-screens"
                onClick={() => setActiveAdminTab('screens')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'screens'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Screens Matrix</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-slate-400 border border-slate-700">{screens.length}</span>
              </button>

              <button
                id="tab-layouts"
                onClick={() => setActiveAdminTab('layouts')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'layouts'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Smart Layout Studio</span>
              </button>

              <button
                id="tab-media"
                onClick={() => setActiveAdminTab('media')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'media'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Film className="h-3.5 w-3.5" />
                <span>Media Library</span>
              </button>

              <button
                id="tab-playlists"
                onClick={() => setActiveAdminTab('playlists')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'playlists'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <ListVideo className="h-3.5 w-3.5" />
                <span>Playlists</span>
              </button>

              <button
                id="tab-schedules"
                onClick={() => setActiveAdminTab('schedules')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'schedules'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Scheduler Engine</span>
              </button>

              <button
                id="tab-control"
                onClick={() => setActiveAdminTab('control')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'control'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Radio className="h-3.5 w-3.5 text-indigo-400" />
                <span>Realtime Control</span>
              </button>

              <button
                id="tab-telemetry"
                onClick={() => setActiveAdminTab('telemetry')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeAdminTab === 'telemetry'
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-emerald-400" />
                <span>Analytics & Telemetry</span>
              </button>
            </div>
          )}

        </div>
      </header>

      {/* Ai Guide & Settings Modal */}
      <AiGuideModal 
        isOpen={isAiGuideOpen} 
        onClose={() => setIsAiGuideOpen(false)} 
      />
    </>
  );
};

