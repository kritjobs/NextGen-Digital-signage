/**
 * ZoneWidgetRenderer — Shared widget renderer for both PlayerApp and DisplayKiosk
 * Renders widgets based on zone.mediaType + zone.contentData
 * Used when a zone has a widget type configured directly (not via playlist)
 */
import React, { useState, useEffect } from 'react';
import { Clock, CloudSun, Type, Globe, AlertTriangle, Film, Image, Rss, Youtube, Calendar, Table, Timer, UtensilsCrossed, TrendingUp, Tv } from 'lucide-react';
import { LayoutZone } from '../../types/signage';
import { LiveWeatherWidget } from './LiveWeatherWidget';
import { LiveRssWidget } from './LiveRssWidget';
import { LiveCalendarWidget } from './LiveCalendarWidget';

export const ZoneWidgetRenderer: React.FC<{ zone: LayoutZone }> = ({ zone }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!zone.mediaType) {
    return <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">{zone.name}</div>;
  }

  switch (zone.mediaType) {
    case 'clock': {
      const tz = zone.contentData?.timezone || 'Asia/Bangkok';
      const fmt = zone.contentData?.clockFormat || '24h';
      const label = zone.contentData?.clockLabel || tz.split('/')[1]?.replace('_', ' ') || '';
      const timeStr = time.toLocaleTimeString('en-US', {
        timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: fmt === '12h',
      });
      const dateStr = time.toLocaleDateString('en-US', {
        timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
      });
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 to-emerald-950 p-3">
          <div className="text-emerald-400 font-mono font-bold text-2xl sm:text-4xl leading-none">{timeStr}</div>
          <div className="text-emerald-300/60 text-xs sm:text-sm mt-2">{dateStr}</div>
          {label && <div className="text-emerald-200/80 text-xs mt-1 font-semibold">{label}</div>}
        </div>
      );
    }

    case 'weather':
      return <LiveWeatherWidget zone={zone} />;

    case 'ticker': {
      const text = zone.contentData?.tickerText || 'Welcome to Enterprise Digital Signage Platform';
      const speed = zone.contentData?.tickerSpeed || 60;
      return (
        <div className="w-full h-full bg-gradient-to-r from-amber-950 to-slate-950 flex items-center overflow-hidden">
          <style>{`@keyframes zwr-marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }`}</style>
          <div
            className="whitespace-nowrap text-amber-300 text-sm sm:text-base font-semibold px-4"
            style={{ animation: `zwr-marquee ${Math.max(8, text.length * 100 / speed)}s linear infinite` }}
          >
            {text} &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; {text}
          </div>
        </div>
      );
    }

    case 'announcement': {
      const header = zone.contentData?.announcementHeader || 'NOTICE';
      const body = zone.contentData?.announcementBody || 'Important announcement will appear here.';
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-rose-950 to-slate-950 p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-rose-400 mb-2" />
          <div className="text-rose-300 font-bold text-sm sm:text-lg uppercase">{header}</div>
          <div className="text-rose-200/70 text-xs sm:text-sm mt-2 max-w-md">{body}</div>
        </div>
      );
    }

    case 'webpage': {
      const url = zone.contentData?.webUrl || '';
      if (url) {
        return <iframe src={url} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin" />;
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 to-slate-950 p-4">
          <Globe className="h-8 w-8 text-indigo-400 mb-2" />
          <div className="text-indigo-300/60 text-sm">Web Embed — No URL configured</div>
        </div>
      );
    }

    case 'rss':
      return <LiveRssWidget zone={zone} />;

    case 'youtube': {
      const videoId = zone.contentData?.youtubeVideoId || '';
      const extractedId = videoId.includes('watch?v=')
        ? videoId.split('watch?v=')[1]?.split('&')[0]
        : videoId.includes('youtu.be/')
        ? videoId.split('youtu.be/')[1]?.split('?')[0]
        : videoId;
      const autoplay = zone.contentData?.youtubeAutoplay !== false;
      const muted = zone.contentData?.youtubeMuted !== false;
      const loop = zone.contentData?.youtubeLoop !== false;

      if (extractedId) {
        const params = new URLSearchParams({
          autoplay: autoplay ? '1' : '0',
          mute: muted ? '1' : '0',
          loop: loop ? '1' : '0',
          playlist: loop ? extractedId : '',
          controls: '0',
          modestbranding: '1',
          rel: '0',
        }).toString();
        return (
          <iframe
            src={`https://www.youtube.com/embed/${extractedId}?${params}`}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        );
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-950 to-slate-950 p-4">
          <Youtube className="h-8 w-8 text-red-400 mb-2" />
          <div className="text-red-300/60 text-sm">YouTube — No video configured</div>
        </div>
      );
    }

    case 'google_calendar':
      return <LiveCalendarWidget zone={zone} />;

    case 'google_sheets': {
      const sheetUrl = zone.contentData?.googleSheetsUrl || '';
      if (sheetUrl) {
        // Convert published Google Sheets URL to embed
        const embedUrl = sheetUrl.includes('/pubhtml')
          ? sheetUrl
          : sheetUrl.replace(/\/edit.*$/, '/pubhtml?widget=true&headers=false');
        return <iframe src={embedUrl} className="w-full h-full border-0" />;
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-950 to-slate-950 p-4">
          <Table className="h-8 w-8 text-green-400 mb-2" />
          <div className="text-green-300/60 text-sm">Google Sheets — No URL configured</div>
        </div>
      );
    }

    case 'video': {
      const src = zone.contentData?.sourceUrl || '';
      if (src) {
        return <video src={src} autoPlay loop muted playsInline className="w-full h-full object-cover" />;
      }
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
          <Film className="h-8 w-8 text-cyan-400/40" />
        </div>
      );
    }

    case 'image': {
      const src = zone.contentData?.sourceUrl || '';
      if (src) {
        return <img src={src} alt={zone.name} className="w-full h-full object-cover" />;
      }
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
          <Image className="h-8 w-8 text-violet-400/40" />
        </div>
      );
    }

    case 'world_clock': {
      const cities = zone.contentData?.worldClockCities || [
        { label: 'Bangkok', timezone: 'Asia/Bangkok' },
        { label: 'Tokyo', timezone: 'Asia/Tokyo' },
        { label: 'New York', timezone: 'America/New_York' },
        { label: 'London', timezone: 'Europe/London' },
      ];
      return (
        <div className="w-full h-full bg-gradient-to-br from-slate-950 to-teal-950 p-3 flex flex-col">
          <div className="flex items-center space-x-1.5 mb-2 shrink-0">
            <Globe className="h-4 w-4 text-teal-400" />
            <span className="text-teal-300 text-xs font-bold">World Clock</span>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 overflow-hidden">
            {cities.slice(0, 6).map((city, i) => {
              const cityTime = time.toLocaleTimeString('en-US', {
                timeZone: city.timezone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
              });
              return (
                <div key={i} className="flex flex-col items-center justify-center bg-teal-900/20 rounded-lg p-1.5 border border-teal-800/30">
                  <span className="text-teal-400 font-mono font-bold text-sm">{cityTime}</span>
                  <span className="text-teal-200/60 text-[8px] mt-0.5">{city.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    case 'menu_board': {
      const title = zone.contentData?.menuBoardTitle || 'Menu';
      const categories = zone.contentData?.menuBoardCategories || [
        { name: 'Main Course', items: [{ name: 'Pad Thai', price: '120' }, { name: 'Green Curry', price: '150', highlight: true }, { name: 'Tom Yum', price: '130' }] },
        { name: 'Drinks', items: [{ name: 'Thai Tea', price: '45' }, { name: 'Fresh Coconut', price: '60' }] },
      ];
      const currency = zone.contentData?.menuBoardCurrency || '฿';
      const theme = zone.contentData?.menuBoardTheme || 'dark';
      const bgClass = theme === 'neon' ? 'bg-black' : theme === 'light' ? 'bg-amber-50' : 'bg-gradient-to-br from-slate-950 to-yellow-950';
      const textClass = theme === 'light' ? 'text-slate-900' : 'text-white';

      return (
        <div className={`w-full h-full ${bgClass} p-3 flex flex-col overflow-hidden`}>
          <div className={`text-center mb-2 shrink-0 ${theme === 'neon' ? 'text-yellow-400' : theme === 'light' ? 'text-amber-800' : 'text-yellow-300'}`}>
            <UtensilsCrossed className="h-4 w-4 inline mr-1" />
            <span className="font-bold text-sm">{title}</span>
          </div>
          <div className="flex-1 overflow-hidden space-y-2">
            {categories.map((cat, ci) => (
              <div key={ci}>
                <div className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${theme === 'neon' ? 'text-yellow-500' : theme === 'light' ? 'text-amber-700' : 'text-yellow-400/80'}`}>
                  {cat.name}
                </div>
                {cat.items.map((item, ii) => (
                  <div key={ii} className={`flex justify-between items-center py-0.5 text-[10px] ${item.highlight ? (theme === 'neon' ? 'text-lime-400 font-bold' : 'text-yellow-300 font-semibold') : textClass}`}>
                    <span className="truncate">{item.name}</span>
                    <span className="font-mono shrink-0 ml-2">{currency}{item.price}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'countdown': {
      const target = zone.contentData?.countdownTarget ? new Date(zone.contentData.countdownTarget) : new Date(Date.now() + 86400000);
      const label = zone.contentData?.countdownLabel || 'Event Starting In';
      const expiredText = zone.contentData?.countdownExpiredText || 'Event Started!';
      const diff = target.getTime() - time.getTime();

      if (diff <= 0) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-950 to-slate-950 p-3">
            <Timer className="h-6 w-6 text-pink-400 mb-2" />
            <div className="text-pink-300 font-bold text-sm text-center">{expiredText}</div>
          </div>
        );
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-pink-950 to-slate-950 p-3">
          <div className="text-pink-200/60 text-[10px] mb-2 font-semibold uppercase">{label}</div>
          <div className="flex items-center space-x-2">
            {days > 0 && (
              <div className="flex flex-col items-center">
                <span className="text-pink-300 font-mono font-bold text-xl">{days}</span>
                <span className="text-pink-400/50 text-[7px]">DAYS</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <span className="text-pink-300 font-mono font-bold text-xl">{String(hours).padStart(2, '0')}</span>
              <span className="text-pink-400/50 text-[7px]">HRS</span>
            </div>
            <span className="text-pink-400/40 text-lg font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-pink-300 font-mono font-bold text-xl">{String(minutes).padStart(2, '0')}</span>
              <span className="text-pink-400/50 text-[7px]">MIN</span>
            </div>
            <span className="text-pink-400/40 text-lg font-bold">:</span>
            <div className="flex flex-col items-center">
              <span className="text-pink-300 font-mono font-bold text-xl">{String(seconds).padStart(2, '0')}</span>
              <span className="text-pink-400/50 text-[7px]">SEC</span>
            </div>
          </div>
        </div>
      );
    }

    case 'currencies': {
      const pairs = zone.contentData?.currencyPairs || ['USD/THB', 'EUR/THB', 'GBP/THB', 'JPY/THB'];
      // Mock rates for preview (real implementation would fetch from API)
      const mockRates: Record<string, { rate: string; change: string; up: boolean }> = {
        'USD/THB': { rate: '34.52', change: '+0.12', up: true },
        'EUR/THB': { rate: '37.81', change: '-0.05', up: false },
        'GBP/THB': { rate: '43.67', change: '+0.23', up: true },
        'JPY/THB': { rate: '0.234', change: '+0.002', up: true },
        'BTC/USD': { rate: '67,432', change: '+1,205', up: true },
        'ETH/USD': { rate: '3,521', change: '-42', up: false },
      };

      return (
        <div className="w-full h-full bg-gradient-to-br from-slate-950 to-lime-950 p-3 flex flex-col overflow-hidden">
          <div className="flex items-center space-x-1.5 mb-2 shrink-0">
            <TrendingUp className="h-4 w-4 text-lime-400" />
            <span className="text-lime-300 text-xs font-bold">Exchange Rates</span>
          </div>
          <div className="flex-1 overflow-hidden space-y-1.5">
            {pairs.map((pair, i) => {
              const data = mockRates[pair] || { rate: '--', change: '0', up: true };
              return (
                <div key={i} className="flex items-center justify-between bg-lime-900/15 rounded px-2 py-1 border border-lime-800/20">
                  <span className="text-lime-200/80 text-[10px] font-semibold">{pair}</span>
                  <div className="text-right">
                    <span className="text-white text-[10px] font-mono font-bold">{data.rate}</span>
                    <span className={`text-[8px] ml-1 ${data.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {data.up ? '▲' : '▼'} {data.change}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-lime-400/30 text-[7px] mt-1 shrink-0">Updated: {time.toLocaleTimeString()}</div>
        </div>
      );
    }

    case 'hls_stream': {
      const hlsUrl = zone.contentData?.hlsUrl || '';
      if (hlsUrl) {
        return (
          <video
            src={hlsUrl}
            autoPlay={zone.contentData?.hlsAutoplay !== false}
            muted={zone.contentData?.hlsMuted !== false}
            playsInline
            className="w-full h-full object-cover"
          />
        );
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-fuchsia-950 to-slate-950 p-4">
          <Tv className="h-8 w-8 text-fuchsia-400 mb-2" />
          <div className="text-fuchsia-300/60 text-sm">Live Stream</div>
          <div className="text-fuchsia-200/40 text-[9px] mt-1">Set HLS URL (.m3u8) in settings</div>
        </div>
      );
    }

    default:
      return <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">{zone.name}</div>;
  }
};
