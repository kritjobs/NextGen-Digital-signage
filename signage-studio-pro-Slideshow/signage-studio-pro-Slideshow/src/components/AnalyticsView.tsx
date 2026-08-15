import React from 'react';
import { BarChart3, TrendingUp, Eye, Tv2, Clock, Sparkles } from 'lucide-react';
import { Card } from './Card';
import { AnimatedCounter } from './AnimatedCounter';

export const AnalyticsView: React.FC = () => {
  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 border border-white/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Real-time Analytics Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Display Impressions & Audience Metrics
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              AI camera heatmaps and screen gaze-duration telemetry across luxury venues.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card glowColor="gold">
          <div className="text-xs font-bold text-slate-400 uppercase">Total Gaze Views</div>
          <div className="text-2xl md:text-3xl font-extrabold text-white mt-3">
            <AnimatedCounter value={4218900} suffix=" Views" />
          </div>
          <div className="text-xs text-emerald-400 font-bold mt-2">+28.4% this week</div>
        </Card>

        <Card glowColor="indigo">
          <div className="text-xs font-bold text-slate-400 uppercase">Avg Dwell Time</div>
          <div className="text-2xl md:text-3xl font-extrabold text-white mt-3">
            <AnimatedCounter value={14.8} suffix=" sec" decimals={1} />
          </div>
          <div className="text-xs text-amber-300 font-bold mt-2">Optimal for 4K slide</div>
        </Card>

        <Card glowColor="emerald">
          <div className="text-xs font-bold text-slate-400 uppercase">Overall Uptime</div>
          <div className="text-2xl md:text-3xl font-extrabold text-white mt-3">99.98%</div>
          <div className="text-xs text-emerald-400 font-bold mt-2">1,248 Displays active</div>
        </Card>

        <Card glowColor="cyan">
          <div className="text-xs font-bold text-slate-400 uppercase">Ad Conversion Lift</div>
          <div className="text-2xl md:text-3xl font-extrabold text-white mt-3">+34.2%</div>
          <div className="text-xs text-indigo-300 font-bold mt-2">Verified QR scans</div>
        </Card>
      </div>

      {/* Analytics Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-4">Top Performing Screen Locations</h2>
          <div className="space-y-4 text-xs">
            {[
              { location: 'Grand Horizon Lobby Display', views: '1,420,000 views', dwell: '18.2s', score: '98%' },
              { location: 'Aurelian VIP Entrance Kiosk', views: '980,000 views', dwell: '16.5s', score: '94%' },
              { location: 'Retail Flagship Main Video Wall', views: '840,000 views', dwell: '12.1s', score: '89%' },
              { location: 'Culinary Pavilion Menu Signage', views: '650,000 views', dwell: '22.4s', score: '96%' }
            ].map((loc, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{loc.location}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{loc.views} • Avg Dwell {loc.dwell}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {loc.score} Score
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-4">Campaign Engagement Share</h2>
          <div className="space-y-4 text-xs">
            {[
              { theme: 'Obsidian & Gold (Golden Hour)', share: '42%', color: 'bg-amber-400' },
              { theme: 'The Grand Atrium', share: '28%', color: 'bg-indigo-500' },
              { theme: 'Neon Nights VIP Promo', share: '18%', color: 'bg-cyan-400' },
              { theme: 'Executive Residences', share: '12%', color: 'bg-purple-500' }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between font-bold text-white mb-1">
                  <span>{item.theme}</span>
                  <span className="text-amber-400">{item.share}</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color}`} style={{ width: item.share }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
