import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Sparkles, 
  Layers, 
  Type, 
  Image as ImageIcon, 
  Music, 
  Wand2, 
  Layout, 
  Crown, 
  Lock, 
  CheckCircle, 
  SlidersHorizontal,
  Maximize2,
  Volume2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { INITIAL_THEMES, INITIAL_TIMELINE_TRACKS } from '../data/mockData';
import { SignageTheme, ThemeCategory } from '../types';

interface StudioProps {
  onOpenLivePreview: () => void;
}

export const Studio: React.FC<StudioProps> = ({ onOpenLivePreview }) => {
  const [activeTab, setActiveTab] = useState<'Media' | 'Text' | 'Music' | 'Animation' | 'Layout'>('Animation');
  const [selectedTheme, setSelectedTheme] = useState<SignageTheme>(INITIAL_THEMES[0]);
  const [themeCategory, setThemeCategory] = useState<ThemeCategory>('Luxury');
  const [isPlaying, setIsPlaying] = useState(false);
  const [effects, setEffects] = useState({
    energetic: true,
    parallax: true,
    goldDust: true
  });

  // Filter themes by category
  const filteredThemes = INITIAL_THEMES.filter(
    t => themeCategory === 'Marketplace' || t.category === themeCategory
  );

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col justify-between -mx-4 md:-mx-6 -mt-8 -mb-12 overflow-hidden bg-slate-950">
      {/* Top Workspace Area: Left Tools + Center Stage + Right Theme Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT TOOLBAR PANEL */}
        <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-r border-white/10 flex flex-col justify-between p-4 z-20 select-none">
          <div>
            <div className="flex items-center gap-3 mb-6 px-1">
              <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-amber-300">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Studio Tools</div>
                <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">V3.0 Pro Active</div>
              </div>
            </div>

            {/* Left Nav Tool Tabs */}
            <nav className="space-y-1">
              {[
                { name: 'Media', icon: ImageIcon },
                { name: 'Text', icon: Type },
                { name: 'Music', icon: Music },
                { name: 'Animation', icon: Wand2, badge: 'FX Active' },
                { name: 'Layout', icon: Layout }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.name;

                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name as any)}
                    className={`
                      w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-semibold text-xs transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-indigo-600/30 via-indigo-600/15 to-transparent text-white border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span>{tab.name}</span>
                    </div>
                    {tab.badge && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f2ca50]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Active Effects Control Panel */}
          <div className="mt-6 p-3.5 rounded-2xl bg-slate-950/70 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                Active FX <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <span className="text-[10px] text-slate-400 font-medium">GPU Render</span>
            </div>

            <div className="space-y-2">
              <div 
                onClick={() => setEffects(prev => ({ ...prev, energetic: !prev.energetic }))}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  effects.energetic 
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200' 
                    : 'bg-slate-900/40 border-white/5 text-slate-500'
                }`}
              >
                <span className="text-xs font-semibold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Energetic Particles
                </span>
                <input type="checkbox" checked={effects.energetic} readOnly className="rounded accent-amber-400 pointer-events-none" />
              </div>

              <div 
                onClick={() => setEffects(prev => ({ ...prev, parallax: !prev.parallax }))}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  effects.parallax 
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200' 
                    : 'bg-slate-900/40 border-white/5 text-slate-500'
                }`}
              >
                <span className="text-xs font-semibold flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" /> Parallax Depth
                </span>
                <input type="checkbox" checked={effects.parallax} readOnly className="rounded accent-indigo-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </aside>

        {/* CENTER STAGE CANVAS PREVIEW */}
        <main className="flex-1 bg-slate-950 p-6 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

          {/* 16:9 Stage Viewport Container */}
          <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900 group">
            {/* Background Image / Render */}
            <motion.img
              key={selectedTheme.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              src={selectedTheme.bgUrl}
              alt={selectedTheme.name}
              className={`w-full h-full object-cover opacity-85 ${effects.energetic ? 'ken-burns-anim' : ''}`}
            />

            {/* Dark Vignette / Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-transparent pointer-events-none" />

            {/* Slide Content Overlays */}
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end text-left">
              <motion.div 
                key={`content-${selectedTheme.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="max-w-2xl"
              >
                <span 
                  className="inline-block px-3.5 py-1 mb-4 border font-bold text-xs tracking-widest uppercase rounded-full backdrop-blur-md bg-slate-950/40"
                  style={{ 
                    borderColor: selectedTheme.accentColor,
                    color: selectedTheme.accentColor
                  }}
                >
                  {selectedTheme.subtitleText}
                </span>

                <h1 
                  className="text-3xl md:text-5xl font-extrabold text-white mb-4 uppercase tracking-tight drop-shadow-2xl"
                  style={{ fontFamily: selectedTheme.titleFont }}
                >
                  {selectedTheme.headlineText}
                </h1>

                {selectedTheme.descriptionText && (
                  <p className="text-xs md:text-sm text-slate-200/90 max-w-lg mb-6 leading-relaxed line-clamp-3">
                    {selectedTheme.descriptionText}
                  </p>
                )}

                <button 
                  onClick={onOpenLivePreview}
                  className="px-6 py-2.5 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-lg"
                  style={{ 
                    backgroundColor: selectedTheme.accentColor,
                    color: '#0B0F1A'
                  }}
                >
                  <span>{selectedTheme.ctaText || 'Discover More'}</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </motion.div>
            </div>

            {/* Aspect Ratio & Resolution Badge */}
            <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>16:9 4K UHD</span>
            </div>

            {/* Center Play Overlay on Hover */}
            <div 
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer backdrop-blur-sm"
            >
              <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(242,202,80,0.6)] hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT THEME MARKETPLACE PANEL */}
        <aside className="w-80 bg-slate-900/80 backdrop-blur-xl border-l border-white/10 flex flex-col p-4 z-20 select-none overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Theme System
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h2>
            <p className="text-xs text-amber-300 font-semibold">Browse Premium Styles</p>
          </div>

          {/* Theme Categories */}
          <div className="flex gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 mb-4 overflow-x-auto">
            {(['Luxury', 'Corporate', 'Vibrant', 'Marketplace'] as ThemeCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setThemeCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  themeCategory === cat
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Theme List Grid */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {filteredThemes.map((theme) => {
              const isSelected = selectedTheme.id === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`
                    relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-300 group
                    ${isSelected 
                      ? 'border-amber-400 shadow-[0_0_20px_rgba(242,202,80,0.3)] bg-slate-900' 
                      : 'border-white/10 bg-slate-950/60 hover:border-amber-400/50'}
                  `}
                >
                  <div className="h-28 w-full relative overflow-hidden">
                    <img 
                      src={theme.previewImage} 
                      alt={theme.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                    {/* Badge */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {theme.badge && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950 shadow">
                          {theme.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                      <span 
                        className="font-extrabold text-sm text-white drop-shadow"
                        style={{ fontFamily: theme.titleFont }}
                      >
                        {theme.name}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/90 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px] font-medium">{theme.price}</span>
                    {isSelected ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" /> Applied
                      </span>
                    ) : (
                      <span className="text-indigo-400 font-semibold text-[11px] group-hover:text-amber-300">
                        Apply Style
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* BOTTOM MULTITRACK TIMELINE PANEL */}
      <footer className="h-56 bg-slate-950 border-t border-white/10 flex flex-col z-30 select-none">
        {/* Timeline Control Bar */}
        <div className="h-10 border-b border-white/10 px-4 flex items-center justify-between bg-slate-900/60 text-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors font-bold"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button className="p-1 rounded text-slate-400 hover:text-white">
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 rounded text-slate-400 hover:text-white">
              <SkipForward className="w-3.5 h-3.5" />
            </button>
            
            <div className="h-4 w-[1px] bg-white/10 mx-1" />

            <span className="font-mono text-amber-400 font-bold tracking-wider">
              00:12:45 / 00:20:00
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ZoomOut className="w-3.5 h-3.5" />
            <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-amber-400" />
            </div>
            <ZoomIn className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Tracks Area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative bg-slate-950/80 p-2 space-y-1.5">
          {/* Playhead vertical line indicator */}
          <div className="absolute top-0 bottom-0 left-1/3 w-[2px] bg-amber-400 z-30 shadow-[0_0_12px_#f2ca50]">
            <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -ml-[4px] -mt-[5px]" />
          </div>

          {/* Time Ruler */}
          <div className="h-4 flex text-[9px] text-slate-500 font-mono px-2 border-b border-white/5 opacity-60">
            <div className="w-32">00:00</div>
            <div className="w-32">00:05</div>
            <div className="w-32">00:10</div>
            <div className="w-32">00:15</div>
            <div className="w-32">00:20</div>
          </div>

          {/* Track 1: Media */}
          <div className="h-8 bg-slate-900/60 rounded-lg flex items-center px-2 relative border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 w-24">Media 1</span>
            <div className="absolute left-28 w-48 h-6 bg-indigo-600/30 border border-indigo-400/50 rounded-md flex items-center px-2 text-[10px] text-indigo-200 font-semibold truncate">
              Golden_Hour_4K.mp4
            </div>
          </div>

          {/* Track 2: Effects */}
          <div className="h-8 bg-slate-900/60 rounded-lg flex items-center px-2 relative border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 w-24">Active Effects</span>
            <div className="absolute left-36 w-40 h-6 bg-cyan-600/30 border border-cyan-400/50 rounded-md flex items-center px-2 text-[10px] text-cyan-200 font-semibold truncate">
              Energetic Particle Glow
            </div>
          </div>

          {/* Track 3: Text */}
          <div className="h-8 bg-slate-900/60 rounded-lg flex items-center px-2 relative border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 w-24">Typography</span>
            <div className="absolute left-28 w-56 h-6 bg-amber-500/20 border border-amber-400/50 rounded-md flex items-center px-2 text-[10px] text-amber-300 font-semibold truncate">
              "GOLDEN HOUR SPECIAL"
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
