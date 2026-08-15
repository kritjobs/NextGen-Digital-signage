import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Dashboard } from './components/Dashboard';
import { Studio } from './components/Studio';
import { Marketplace } from './components/Marketplace';
import { FleetManager } from './components/FleetManager';
import { MediaLibrary } from './components/MediaLibrary';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { LivePreviewModal } from './components/LivePreviewModal';
import { INITIAL_THEMES } from './data/mockData';
import { ViewMode, SignageTheme } from './types';

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<SignageTheme>(INITIAL_THEMES[0]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-[#0B0F1A] text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div 
        className={`
          flex flex-col min-h-screen transition-all duration-300
          ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}
        `}
      >
        {/* Topbar Navigation */}
        <Topbar
          currentView={currentView}
          onSelectView={setCurrentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenLivePreview={() => setIsLivePreviewOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />

        {/* View Router */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {currentView === 'dashboard' && <Dashboard onNavigate={setCurrentView} />}
          {currentView === 'studio' && <Studio onOpenLivePreview={() => setIsLivePreviewOpen(true)} />}
          {currentView === 'marketplace' && (
            <Marketplace 
              onSelectTheme={(theme) => setSelectedTheme(theme)} 
              onNavigate={setCurrentView} 
            />
          )}
          {currentView === 'fleet' && <FleetManager />}
          {currentView === 'media' && <MediaLibrary />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* 4K Fullscreen Live Preview Modal */}
      <LivePreviewModal
        isOpen={isLivePreviewOpen}
        onClose={() => setIsLivePreviewOpen(false)}
      />
    </div>
  );
}

export default App;
