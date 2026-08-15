import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  MonitorPlay, 
  Palette, 
  Tv2, 
  FolderKanban, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Crown,
  Layers,
  X
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const menuItems = [
    { id: 'dashboard' as ViewMode, label: 'Overview & Revenue', icon: LayoutDashboard },
    { id: 'studio' as ViewMode, label: 'Studio Studio', icon: MonitorPlay, badge: 'Live Canvas' },
    { id: 'marketplace' as ViewMode, label: 'Theme Systems', icon: Palette, badge: 'PRO' },
    { id: 'fleet' as ViewMode, label: 'Display Fleet', icon: Tv2, badge: '6 Live' },
    { id: 'media' as ViewMode, label: 'Media Library', icon: FolderKanban },
    { id: 'analytics' as ViewMode, label: 'Analytics', icon: BarChart3 },
    { id: 'settings' as ViewMode, label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 relative z-20 select-none">
      {/* Top Header & Logo */}
      <div>
        <div className="flex items-center justify-between mb-8 px-2">
          <div 
            onClick={() => onSelectView('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-amber-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-200 bg-clip-text text-transparent">
                  Signage Studio
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-amber-400/90 uppercase flex items-center gap-1">
                  V3.0 Enterprise <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                </span>
              </motion.div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg bg-slate-800/80 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700/80 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close toggle */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectView(item.id);
                  onCloseMobile();
                }}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-600/30 via-indigo-600/15 to-transparent text-white border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.25)]' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'}
                `}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <motion.div 
                    layoutId="activePill" 
                    className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r-full shadow-[0_0_10px_#f2ca50]" 
                  />
                )}

                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-indigo-400'}`} />

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isActive 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                      : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Enterprise Upgrade Box */}
      {!isCollapsed && (
        <div className="mt-8">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-b from-slate-900/90 to-indigo-950/80 border border-amber-500/30 shadow-xl shadow-amber-500/5">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300">
                <Crown className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Enterprise 4K
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Unlock 8K video walls, real-time sync, and luxury bespoke themes.
            </p>
            <button 
              onClick={() => onSelectView('marketplace')}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:shadow-[0_0_20px_rgba(242,202,80,0.4)] transition-all duration-300 active:scale-95 shimmer-btn"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden lg:block fixed top-0 left-0 h-screen z-40
          bg-slate-950/80 backdrop-blur-2xl border-r border-white/10
          transition-all duration-300 ease-out
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 h-screen w-72 bg-slate-950/95 backdrop-blur-2xl border-r border-white/10 z-50"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
