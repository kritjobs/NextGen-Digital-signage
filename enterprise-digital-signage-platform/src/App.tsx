import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { EmergencyModal } from './components/EmergencyModal';
import { ScreensManager } from './components/admin/ScreensManager';
import { SmartLayoutBuilder } from './components/admin/SmartLayoutBuilder';
import { MediaLibrary } from './components/admin/MediaLibrary';
import { PlaylistEditor } from './components/admin/PlaylistEditor';
import { SchedulerEngine } from './components/admin/SchedulerEngine';
import { CampaignManager } from './components/admin/CampaignManager';
import { RealtimeControlConsole } from './components/admin/RealtimeControlConsole';
import { AnalyticsTelemetry } from './components/admin/AnalyticsTelemetry';
import { SlideshowStudio } from './components/admin/SlideshowStudio';
import { AISettings } from './components/admin/AISettings';
import { BackupManager } from './components/admin/BackupManager';
import { PlayerApp } from './components/player/PlayerApp';
import { DualSimulator } from './components/simulator/DualSimulator';
import { LoginPage } from './components/LoginPage';
import { DisplayKiosk } from './components/player/DisplayKiosk';
import { PairingPage } from './components/player/PairingPage';
import { useSignageStore } from './store/useSignageStore';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useBrandingStore } from './store/useBrandingStore';

export default function App() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const { viewMode, activeAdminTab, isLoading, loadError, loadAllData } = useSignageStore();
  const { theme } = useThemeStore();
  const { footerText } = useBrandingStore();
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Sync theme class on documentElement
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // ─── Display Kiosk Mode (standalone URL) ────────────────
  if (window.location.pathname.startsWith('/display/')) {
    return <DisplayKiosk />;
  }

  // ─── Pairing Page (TV self-register) ────────────────────
  if (window.location.pathname === '/pair') {
    return <PairingPage />;
  }

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // โหลดข้อมูลจาก API เมื่อ authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, loadAllData]);

  // ─── Not Authenticated → Show Login ────────────────────
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg font-medium">Loading Digital Signage Platform...</p>
          <p className="text-slate-500 text-sm mt-1">Welcome, {user?.displayName}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-rose-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
          <p className="text-slate-400 mb-4">{loadError}</p>
          <button
            onClick={() => loadAllData()}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-black transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      
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
            {activeAdminTab === 'campaigns' && <CampaignManager />}
            {activeAdminTab === 'control' && <RealtimeControlConsole />}
            {activeAdminTab === 'telemetry' && <AnalyticsTelemetry />}
            {activeAdminTab === 'slideshows' && <SlideshowStudio />}
            {activeAdminTab === 'ai_settings' && <AISettings />}
            {activeAdminTab === 'backups' && <BackupManager />}
          </div>
        )}

        {viewMode === 'player' && (
          <div className={`p-2 rounded-2xl border shadow-2xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
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
      <footer className={`border-t py-4 text-xs ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800/80 text-slate-500' : 'bg-white/80 border-gray-200 text-gray-500'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className={`font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>{footerText}</span>
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
