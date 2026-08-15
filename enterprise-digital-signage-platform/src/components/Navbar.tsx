import React from 'react';
import { useState } from 'react';
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
  Presentation,
  Bot,
  RotateCcw,
  DatabaseBackup
} from 'lucide-react';
import { useSignageStore } from '../store/useSignageStore';
import { useThemeStore } from '../store/useThemeStore';
import { useBrandingStore } from '../store/useBrandingStore';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandingSettings } from './admin/BrandingSettings';

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
    emergencyAlerts 
  } = useSignageStore();
  const { theme, toggleTheme } = useThemeStore();
  const { platformName, platformSubtitle, logoUrl, primaryColor } = useBrandingStore();
  const { t } = useTranslation();
  const [showBranding, setShowBranding] = useState(false);

  const activeEmergency = emergencyAlerts.find((a) => a.active);
  const onlineCount = screens.filter((s) => s.status === 'online').length;

  return (
    <>
    <header className={`border-b sticky top-0 z-40 shadow-xl transition-colors duration-300 ${
      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt={platformName} className="h-7 w-7 object-contain" />
                ) : (
                  <Tv className="h-5 w-5 text-cyan-400" />
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight">{platformName}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-400">{t('nav.enterprise')}</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">{platformSubtitle}</p>
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
              <span>{t('nav.adminConsole')}</span>
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
              <span>{t('nav.tvPlayer')}</span>
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
              <span>{t('nav.dualSimulator')}</span>
            </button>
          </div>

          {/* Emergency Alert & System Status */}
          <div className="flex items-center space-x-3">
            {/* Quick Post Button */}
            <button
              onClick={() => {
                const msg = prompt(t('nav.quickPostPrompt'));
                if (msg) {
                  fetch('/api/quick-post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('signage_access_token')}` },
                    body: JSON.stringify({ message: msg, style: 'info', duration: 30 }),
                  }).catch(() => {});
                }
              }}
              className={`p-2 rounded-lg border transition-all ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-emerald-600 hover:bg-gray-100'
              }`}
              title={t('nav.quickPost')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-5 5v-5z"/></svg>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setShowBranding(true)}
              className={`p-2 rounded-lg border transition-all ${
                theme === 'dark' ? 'bg-slate-800 border-slate-700 text-violet-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-violet-600 hover:bg-gray-100'
              }`}
              title={t('nav.branding')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a4 4 0 0 1-4 4zm0 0h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 0 1 2.828 0l2.829 2.829a2 2 0 0 1 0 2.828l-8.486 8.485M7 17h.01"/></svg>
            </button>

            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all ${
                theme === 'dark' 
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
              title={theme === 'dark' ? t('nav.lightMode') : t('nav.darkMode')}
            >
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="5" strokeWidth="2"/><path strokeWidth="2" strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Live WS Status */}
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
              {wsConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-slate-300">{t('nav.wsLive')}</span>
                  <span className="text-[10px] text-slate-500">{t('nav.onlineCount', { online: onlineCount, total: screens.length })}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-amber-300">{t('nav.wsOffline')}</span>
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
              <span>{activeEmergency ? t('nav.emergencyActive') : t('nav.emergencyAlert')}</span>
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
              <span>{t('nav.screensMatrix')}</span>
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
              <span>{t('nav.smartLayout')}</span>
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
              <span>{t('nav.mediaLibrary')}</span>
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
              <span>{t('nav.playlists')}</span>
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
              <span>{t('nav.scheduler')}</span>
            </button>

            <button
              id="tab-campaigns"
              onClick={() => setActiveAdminTab('campaigns')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeAdminTab === 'campaigns'
                  ? 'bg-slate-800 text-violet-400 border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <RotateCcw className="h-3.5 w-3.5 text-violet-400" />
              <span>{t('nav.campaigns')}</span>
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
              <span>{t('nav.realtimeControl')}</span>
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
              <span>{t('nav.analytics')}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('slideshows')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAdminTab === 'slideshows' 
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Presentation className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('nav.slideshow')}</span>
            </button>

            <button
              id="tab-backups"
              onClick={() => setActiveAdminTab('backups')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeAdminTab === 'backups'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <DatabaseBackup className="h-3.5 w-3.5 text-amber-400" />
              <span>{t('nav.backup')}</span>
            </button>

            <button
              onClick={() => setActiveAdminTab('ai_settings')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeAdminTab === 'ai_settings' 
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="h-3.5 w-3.5 text-purple-400" />
              <span>{t('nav.aiConfig')}</span>
            </button>
          </div>
        )}

      </div>
    </header>
    <BrandingSettings isOpen={showBranding} onClose={() => setShowBranding(false)} />
    </>
  );
};
