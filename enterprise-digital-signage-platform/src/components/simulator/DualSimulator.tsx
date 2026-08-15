import React from 'react';
import { SlidersHorizontal, Tv, Monitor } from 'lucide-react';
import { ScreensManager } from '../admin/ScreensManager';
import { SmartLayoutBuilder } from '../admin/SmartLayoutBuilder';
import { PlayerApp } from '../player/PlayerApp';
import { useSignageStore } from '../../store/useSignageStore';

export const DualSimulator: React.FC = () => {
  const { activeAdminTab } = useSignageStore();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Monitor className="h-5 w-5 text-indigo-400" />
          <div>
            <h2 className="text-base font-bold text-white">Side-by-Side Dual Simulator</h2>
            <p className="text-xs text-slate-400">Live preview of Admin Controller actions syncing immediately to Smart TV Display</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Admin Console (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-cyan-400">
            <span className="flex items-center space-x-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              <span>ADMIN CONSOLE</span>
            </span>
          </div>

          <div className="max-h-[600px] overflow-y-auto no-scrollbar pr-1">
            {activeAdminTab === 'layouts' ? <SmartLayoutBuilder /> : <ScreensManager />}
          </div>
        </div>

        {/* Right: Live TV Player (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs font-bold text-emerald-400">
            <span className="flex items-center space-x-1.5">
              <Tv className="h-4 w-4" />
              <span>LIVE SMART TV RENDERER</span>
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
            <PlayerApp />
          </div>
        </div>

      </div>
    </div>
  );
};
