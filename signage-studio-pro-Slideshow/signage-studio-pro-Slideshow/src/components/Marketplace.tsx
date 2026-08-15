import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Crown, Check, Search, Filter, Play, Tag, ShieldCheck } from 'lucide-react';
import { Card } from './Card';
import { INITIAL_THEMES } from '../data/mockData';
import { SignageTheme, ThemeCategory, ViewMode } from '../types';

interface MarketplaceProps {
  onSelectTheme: (theme: SignageTheme) => void;
  onNavigate: (view: ViewMode) => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({ onSelectTheme, onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Luxury', 'Corporate', 'Vibrant', 'Beach'];

  const filteredThemes = INITIAL_THEMES.filter(theme => {
    const matchesCategory = selectedCategory === 'All' || theme.category === selectedCategory;
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          theme.headlineText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Marketplace Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-indigo-950/80 border border-amber-500/30 p-8">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">
            <Crown className="w-3.5 h-3.5" /> Luxury Signage Marketplace
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Curated 4K Display Theme Systems
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Architectural typography, high-contrast luxury motion design, and retail conversion layouts engineered for global display fleets.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(242,202,80,0.4)]'
                  : 'bg-slate-900/80 border border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search theme system..."
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => (
          <Card key={theme.id} glowColor="gold" className="p-0 overflow-hidden flex flex-col justify-between">
            <div>
              {/* Preview Banner */}
              <div className="h-48 w-full relative overflow-hidden group">
                <img
                  src={theme.previewImage}
                  alt={theme.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                {/* Tier Badge */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-400 text-slate-950 shadow-lg flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> {theme.tier}
                  </span>
                </div>

                {/* Overlaid Headline preview */}
                <div className="absolute bottom-3 left-4 right-4">
                  <span className="text-xs text-amber-300 font-bold uppercase tracking-widest block mb-1">
                    {theme.subtitleText}
                  </span>
                  <span className="text-xl font-extrabold text-white drop-shadow-md block truncate">
                    {theme.headlineText}
                  </span>
                </div>
              </div>

              {/* Theme details */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-bold text-white">{theme.name}</h3>
                  <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                    {theme.price}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {theme.descriptionText}
                </p>

                {/* Active Effects badges */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {theme.activeEffects?.map((eff, idx) => (
                    <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/5">
                      ✨ {eff}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 pt-0 flex items-center gap-3">
              <button
                onClick={() => {
                  onSelectTheme(theme);
                  onNavigate('studio');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:shadow-[0_0_20px_rgba(242,202,80,0.4)] transition-all active:scale-95 shimmer-btn flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Apply in Studio</span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
