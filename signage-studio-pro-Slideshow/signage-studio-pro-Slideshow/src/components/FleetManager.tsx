import React, { useState } from 'react';
import { Tv2, RefreshCw, CheckCircle2, AlertTriangle, Wifi, MapPin, Layers, Power, Search, ShieldCheck } from 'lucide-react';
import { Card } from './Card';
import { MOCK_DEVICES } from '../data/mockData';
import { DisplayDevice } from '../types';

export const FleetManager: React.FC = () => {
  const [devices, setDevices] = useState<DisplayDevice[]>(MOCK_DEVICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const handleRemoteRefresh = (id: string) => {
    setRefreshingId(id);
    setTimeout(() => {
      setDevices(prev => prev.map(d => d.id === id ? { ...d, lastPing: 'Just now', status: 'Online' } : d));
      setRefreshingId(null);
    }, 1200);
  };

  const filteredDevices = devices.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 border border-white/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Wifi className="w-3.5 h-3.5" /> Fleet Health: 99.98%
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Connected Display Hardware Fleet
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Remote command center for 1,248 4K/8K SoC signage media players.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter displays by name or location..."
                className="bg-slate-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Screen Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.map((device) => {
          const isOnline = device.status === 'Online';
          const isSyncing = device.status === 'Syncing';

          return (
            <Card key={device.id} glowColor={isOnline ? 'emerald' : 'gold'} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv2 className="w-4 h-4 text-indigo-400" />
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      <span>{device.location}</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                    isOnline 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : isSyncing 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {isOnline && <CheckCircle2 className="w-3 h-3" />}
                    {isSyncing && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {!isOnline && !isSyncing && <AlertTriangle className="w-3 h-3" />}
                    {device.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-2 text-xs my-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Scene:</span>
                    <span className="font-bold text-amber-300 truncate max-w-[160px]">{device.currentSlide}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hardware Mode:</span>
                    <span className="font-bold text-slate-200">{device.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="font-mono text-slate-300">{device.ipAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uptime:</span>
                    <span className="font-bold text-emerald-400">{device.uptime}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                <span className="text-slate-500 text-[10px]">Ping: {device.lastPing}</span>
                <button
                  onClick={() => handleRemoteRefresh(device.id)}
                  disabled={refreshingId === device.id}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-200 hover:text-white hover:bg-slate-700 transition-all font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${refreshingId === device.id ? 'animate-spin' : ''}`} />
                  <span>{refreshingId === device.id ? 'Rebooting...' : 'Remote Refresh'}</span>
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
