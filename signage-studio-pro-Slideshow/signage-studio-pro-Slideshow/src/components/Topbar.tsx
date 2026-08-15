import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  Play, 
  UploadCloud, 
  Menu, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Sparkles,
  Command,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { ViewMode } from '../types';

interface TopbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenMobileSidebar: () => void;
  onOpenLivePreview: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  onSelectView,
  onOpenMobileSidebar,
  onOpenLivePreview,
  isDarkMode,
  onToggleDarkMode
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [published, setPublished] = useState(false);

  const handlePublish = () => {
    setPublished(true);
    setTimeout(() => setPublished(false), 3000);
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-slate-950/70 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between">
      {/* Left side: Mobile menu toggle + Title & Quick Nav */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col">
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Digital Signage Pro
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                12 Screens Syncing
              </span>
            </h1>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectView('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'studio'
                  ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => onSelectView('marketplace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'marketplace'
                  ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => onSelectView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'analytics'
                  ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Middle: Search Input */}
      <div className="hidden lg:flex items-center relative max-w-xs w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search screens, themes, assets..."
          className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        <div className="absolute right-2.5 flex items-center gap-0.5 text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
          <Command className="w-2.5 h-2.5" /> K
        </div>
      </div>

      {/* Right side: Actions, Dark toggle, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Live Preview Button */}
        <button
          onClick={onOpenLivePreview}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-400/30 text-indigo-300 font-semibold text-xs hover:border-indigo-400/60 hover:text-white hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400" />
          <span className="hidden sm:inline">Live Preview</span>
        </button>

        {/* Publish Button */}
        <button
          onClick={handlePublish}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all duration-300 active:scale-95 shimmer-btn
            ${published 
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
              : 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 hover:shadow-[0_0_20px_rgba(242,202,80,0.4)]'}
          `}
        >
          {published ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Published!</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Publish Fleet</span>
            </>
          )}
        </button>

        <div className="h-5 w-[1px] bg-white/10 mx-0.5 hidden sm:block" />

        {/* Dark/Light Theme Switcher */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-amber-300 transition-colors"
          title="Toggle Theme Mode"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  Notifications <Sparkles className="w-3 h-3 text-amber-400" />
                </span>
                <span className="text-[10px] text-amber-400 font-semibold cursor-pointer">Mark all as read</span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 text-xs">
                  <div className="font-semibold text-emerald-400">Display #104 Reconnected</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">Grand Horizon Lobby Display synced 4K playlist.</div>
                  <div className="text-[9px] text-slate-500 mt-1">2 mins ago</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 text-xs">
                  <div className="font-semibold text-indigo-300">Campaign Schedule Active</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">"Golden Hour Special" started on 12 luxury displays.</div>
                  <div className="text-[9px] text-slate-500 mt-1">15 mins ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => onSelectView('settings')}
          className="p-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-white/10 hover:border-indigo-500/40 transition-all"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-amber-400/40">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Sarah Jenkins"
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-3 z-50">
              <div className="px-2 py-1.5 border-b border-white/10 mb-2">
                <div className="font-bold text-xs text-white">Sarah Jenkins</div>
                <div className="text-[10px] text-amber-400 font-semibold">Chief Creative Officer</div>
                <div className="text-[10px] text-slate-400 truncate">aurelian.hotels@enterprise.com</div>
              </div>
              <div className="space-y-1">
                <button 
                  onClick={() => { onSelectView('settings'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <User className="w-3.5 h-3.5" /> Profile & Accounts
                </button>
                <button 
                  onClick={() => { onSelectView('settings'); setShowProfileMenu(false); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Enterprise Permissions
                </button>
                <div className="pt-1 border-t border-white/10">
                  <button 
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
