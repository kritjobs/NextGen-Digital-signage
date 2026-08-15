import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  DollarSign, 
  Tv2, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { Card } from './Card';
import { AnimatedCounter } from './AnimatedCounter';
import { MOCK_DEVICES, MOCK_TRANSACTIONS, MOCK_ACTIVITY_LOGS } from '../data/mockData';
import { ViewMode } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewMode) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const filteredTransactions = filter === 'All' 
    ? MOCK_TRANSACTIONS 
    : MOCK_TRANSACTIONS.filter(t => t.status === filter);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 border border-white/10 p-6 md:p-8">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(circle_at_30%_50%,rgba(242,202,80,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Fleet Status: 99.98% Operational
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Signage Studio Executive Suite
            </h1>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Monetized digital display fleet overview. Broadcast 4K campaigns across 1,248 luxury hospitality screens globally.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleRefresh}
              className="p-3 rounded-xl bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-all flex items-center gap-2 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Fleet</span>
            </button>
            <button 
              onClick={() => onNavigate('studio')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xs hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all active:scale-95 shimmer-btn flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>Open Studio Canvas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Revenue */}
        <Card glowColor="gold" className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              <AnimatedCounter value={128450} prefix="$" decimals={2} />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight className="w-3 h-3" /> +18.4%
              </span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Active Screens */}
        <Card glowColor="indigo">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Displays</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Tv2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              <AnimatedCounter value={1248} suffix=" Screens" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> 99.98% Uptime
              </span>
              <span className="text-slate-400">12 syncing</span>
            </div>
          </div>
        </Card>

        {/* Card 3: Campaign Reach */}
        <Card glowColor="cyan">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Impressions</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              <AnimatedCounter value={4.2} suffix="M views" decimals={1} />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ArrowUpRight className="w-3 h-3" /> +24.1%
              </span>
              <span className="text-slate-400">high engagement</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Enterprise Clients */}
        <Card glowColor="purple">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Subscribers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              <AnimatedCounter value={342} suffix=" Clients" />
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                <Sparkles className="w-3 h-3" /> +14 New Tier
              </span>
              <span className="text-slate-400">this week</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Chart + Quick Fleet Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Performance Chart (2 cols) */}
        <Card className="lg:col-span-2 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Revenue & Bandwidth Growth
                <span className="text-xs font-normal text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  4K Stream Optimized
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Monthly SaaS subscription revenue paired with screen bandwidth utilization.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" /> Revenue ($)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 ml-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f2ca50]" /> Active Screens
              </span>
            </div>
          </div>

          {/* Interactive SVG Chart Graphic */}
          <div className="h-64 w-full relative pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradientIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="gradientGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F2CA50" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#F2CA50" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              {/* Area 1: Indigo Revenue */}
              <path
                d="M0,160 Q70,140 140,110 T280,70 T420,40 T500,20 L500,200 L0,200 Z"
                fill="url(#gradientIndigo)"
              />
              <path
                d="M0,160 Q70,140 140,110 T280,70 T420,40 T500,20"
                fill="none"
                stroke="#6366F1"
                strokeWidth="3"
              />

              {/* Area 2: Gold Screens */}
              <path
                d="M0,180 Q80,160 160,135 T320,95 T500,60 L500,200 L0,200 Z"
                fill="url(#gradientGold)"
              />
              <path
                d="M0,180 Q80,160 160,135 T320,95 T500,60"
                fill="none"
                stroke="#F2CA50"
                strokeWidth="2.5"
                strokeDasharray="6 3"
              />

              {/* Data points */}
              <circle cx="140" cy="110" r="5" fill="#6366F1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="280" cy="70" r="5" fill="#6366F1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="420" cy="40" r="5" fill="#6366F1" stroke="#ffffff" strokeWidth="2" />
              <circle cx="500" cy="20" r="6" fill="#F2CA50" stroke="#ffffff" strokeWidth="2" />
            </svg>

            {/* Month labels */}
            <div className="flex justify-between text-[11px] text-slate-400 mt-3 font-semibold">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span className="text-amber-400 font-bold">Aug (Current)</span>
            </div>
          </div>
        </Card>

        {/* Live Activity & Fleet Status (1 col) */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Live Fleet Sync
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h2>
              <button 
                onClick={() => onNavigate('fleet')} 
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Display list */}
            <div className="space-y-3">
              {MOCK_DEVICES.slice(0, 3).map((device) => (
                <div 
                  key={device.id} 
                  className="p-3 rounded-xl bg-slate-950/60 border border-white/5 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[160px]">
                      {device.name}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      device.status === 'Online' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-400/90 mt-1 truncate">
                    Running: {device.currentSlide}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                    <span>{device.resolution}</span>
                    <span>{device.lastPing}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => onNavigate('fleet')}
            className="w-full mt-4 py-2.5 rounded-xl bg-slate-800/80 border border-white/10 text-slate-200 hover:text-white font-semibold text-xs transition-all hover:bg-slate-700/80"
          >
            View All 1,248 Connected Screens
          </button>
        </Card>
      </div>

      {/* Recent Subscriptions & Transactions Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Recent Enterprise Subscriptions
              <span className="text-xs font-normal text-slate-400">Real-time revenue events</span>
            </h2>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
            {(['All', 'Completed', 'Pending'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filter === f
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider font-bold">
                <th className="pb-3 px-3">Customer / Organization</th>
                <th className="pb-3 px-3">License Plan</th>
                <th className="pb-3 px-3">Screens</th>
                <th className="pb-3 px-3">Amount</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={tx.avatarUrl} 
                        alt={tx.customerName} 
                        className="w-8 h-8 rounded-full object-cover border border-amber-400/30"
                      />
                      <div>
                        <div className="font-bold text-white">{tx.customerName}</div>
                        <div className="text-[10px] text-slate-400">{tx.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-indigo-300">{tx.plan}</td>
                  <td className="py-3.5 px-3 font-semibold text-slate-300">{tx.screensLicensed} Displays</td>
                  <td className="py-3.5 px-3 font-extrabold text-amber-400">${tx.amount.toLocaleString()}</td>
                  <td className="py-3.5 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      tx.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-400">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
