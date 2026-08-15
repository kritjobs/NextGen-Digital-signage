import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { EmergencyModal } from './components/EmergencyModal';
import { ScreensManager } from './components/admin/ScreensManager';
import { SmartLayoutBuilder } from './components/admin/SmartLayoutBuilder';
import { MediaLibrary } from './components/admin/MediaLibrary';
import { PlaylistEditor } from './components/admin/PlaylistEditor';
import { SchedulerEngine } from './components/admin/SchedulerEngine';
import { RealtimeControlConsole } from './components/admin/RealtimeControlConsole';
import { AnalyticsTelemetry } from './components/admin/AnalyticsTelemetry';
import { PlayerApp } from './components/player/PlayerApp';
import { DualSimulator } from './components/simulator/DualSimulator';
import { useSignageStore } from './store/useSignageStore';

export default function App() {
  const { viewMode, activeAdminTab } = useSignageStore();
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Emergency Alert Flashing Banner */}
      <EmergencyBanner />

      {/* Global Navigation Bar */}
      <Navbar onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {viewMode === 'admin' && (
          <div className="space-y-6">
            {activeAdminTab === 'screens' && <ScreensManager />}
            {activeAdminTab === 'layouts' && <SmartLayoutBuilder />}
            {activeAdminTab === 'media' && <MediaLibrary />}
            {activeAdminTab === 'playlists' && <PlaylistEditor />}
            {activeAdminTab === 'schedules' && <SchedulerEngine />}
            {activeAdminTab === 'control' && <RealtimeControlConsole />}
            {activeAdminTab === 'telemetry' && <AnalyticsTelemetry />}
          </div>
        )}

        {viewMode === 'player' && (
          <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 shadow-2xl">
            <PlayerApp />
          </div>
        )}

        {viewMode === 'simulator' && <DualSimulator />}

      </main>

      {/* Emergency Trigger Modal */}
      <EmergencyModal 
        isOpen={isEmergencyModalOpen} 
        onClose={() => setIsEmergencyModalOpen(false)} 
      />

      {/* Platform Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">Enterprise Digital Signage Platform</span>
            <span>•</span>
            <span>WebSocket Realtime Engine v4.2</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>WebSocket Port: 3000</span>
            <span>4K Smart TV Ready</span>
            <span className="text-cyan-400 font-semibold">● System Operational</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
