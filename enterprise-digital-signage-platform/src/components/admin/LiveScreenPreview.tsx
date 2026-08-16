/**
 * LiveScreenPreview — เห็นสิ่งที่จอแต่ละตัวกำลังแสดงอยู่แบบเรียลไทม์ (ผ่าน WS SCREEN_STATE)
 * แสดง: สถานะสด (source/priority/playlist/layout) + mini replica ของ layout พร้อมสื่อในแต่ละโซน
 * ข้อมูลไหลผ่าน store.screenStates — อัปเดตทันทีเมื่อ server broadcast SCREEN_STATE_UPDATED
 */
import React, { useState, useEffect } from 'react';
import { Monitor, Image as ImageIcon, Video, Clock, MapPin, TrendingUp, Globe, Layout, Layers, ListMusic, Zap, AlertTriangle } from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { DigitalScreen } from '../../types/signage';

// URL ภายนอก → ผ่าน media-proxy (เหมือน kiosk) — same-origin (/uploads/...) ตรง
const proxyUrl = (u?: string | null) => {
  if (!u) return '';
  if (u.startsWith('http://') || u.startsWith('https://')) {
    return `/api/media-proxy?url=${encodeURIComponent(u)}`;
  }
  return u;
};

// chip สีตามระดับ priority (ตรงกับ PRIORITY_LEVELS ใน types)
const PRIO_CHIP: Record<string, string> = {
  emergency: 'bg-rose-950 text-rose-300 border-rose-500/50',
  critical: 'bg-orange-950 text-orange-300 border-orange-500/50',
  scheduled: 'bg-cyan-950 text-cyan-300 border-cyan-500/50',
  campaign: 'bg-indigo-950 text-indigo-300 border-indigo-500/50',
  default: 'bg-slate-800 text-slate-300 border-slate-600/50',
  standby: 'bg-slate-900 text-slate-500 border-slate-700/50',
};
const PRIO_T_KEY: Record<string, string> = {
  emergency: 'sch.priEmergency', critical: 'sch.priCritical', scheduled: 'sch.priScheduled',
  campaign: 'sch.priCampaign', default: 'sch.priDefault', standby: 'sch.priStandby',
};

// สื่อในโซน (mini preview แบบ static — ไม่ autoplay ในหน้า Admin)
const MiniZoneContent: React.FC<{ z: any; now: Date }> = ({ z, now }) => {
  const type = z.mediaType;
  const title = z.mediaTitle || z.zoneName || '';
  const extra = z.mediaExtra || {};

  if (type === 'image' && z.mediaUrl) {
    return <img src={proxyUrl(z.mediaUrl)} alt={title} className="w-full h-full object-cover" />;
  }
  if (type === 'video') {
    if (z.mediaThumb) return <img src={proxyUrl(z.mediaThumb)} alt={title} className="w-full h-full object-cover" />;
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
        <Video className="h-6 w-6 mb-1 opacity-60" />
        <span className="text-[9px] px-1 truncate max-w-full">{title}</span>
      </div>
    );
  }
  if (type === 'ticker') {
    const text = extra.tickerText || z.mediaTitle || 'Welcome';
    return (
      <div className="w-full h-full bg-slate-900 flex items-center overflow-hidden px-1">
        <span className="whitespace-nowrap text-[9px] text-white font-medium animate-marquee">{text}</span>
      </div>
    );
  }
  if (type === 'clock') {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-slate-950 to-indigo-950 flex flex-col items-center justify-center text-white">
        <span className="text-sm font-black font-mono text-cyan-300">{now.toLocaleTimeString()}</span>
        <span className="text-[8px] text-slate-400">{now.toLocaleDateString()}</span>
      </div>
    );
  }
  if (type === 'announcement') {
    return (
      <div className="w-full h-full p-1.5 bg-gradient-to-tr from-slate-900 to-slate-950 flex flex-col justify-center text-white">
        <span className="text-amber-300 font-bold uppercase text-[8px] mb-0.5">{extra.announcementHeader || ''}</span>
        <p className="text-slate-100 text-[9px] leading-tight line-clamp-3">{extra.announcementBody || title}</p>
      </div>
    );
  }
  if (type === 'promo') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-rose-600 to-orange-500 flex flex-col items-center justify-center text-white p-1">
        <span className="text-[8px] uppercase font-bold truncate max-w-full">{extra.promoTitle || title}</span>
        <span className="text-sm font-black">{extra.promoPrice || ''}</span>
      </div>
    );
  }
  if (type === 'countdown') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-950 to-slate-950 flex flex-col items-center justify-center text-white p-1">
        <span className="text-[8px] uppercase text-purple-300 truncate max-w-full">{extra.countdownLabel || ''}</span>
        <span className="text-[10px] font-mono text-purple-200">{extra.countdownDate || ''}</span>
      </div>
    );
  }
  if (type === 'qrcode') {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-1">
        <span className="text-[8px] font-bold text-slate-800 truncate max-w-full">{extra.qrCodeLabel || 'QR'}</span>
        <span className="text-[6px] text-slate-500 truncate max-w-full">{extra.qrCodeData || ''}</span>
      </div>
    );
  }
  if (type === 'weather') {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-blue-950 flex flex-col justify-center p-1.5 text-white">
        <span className="text-[8px] text-cyan-400 uppercase font-bold">Weather</span>
        <span className="text-[10px] font-bold truncate">{z.mediaTitle || extra.weatherCity || ''}</span>
      </div>
    );
  }
  if (type === 'kpi') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center text-white p-1">
        <span className="text-[8px] uppercase text-slate-400 truncate max-w-full">{extra.kpiLabel || ''}</span>
        <span className="text-sm font-black">{extra.kpiValue || ''}</span>
      </div>
    );
  }
  if (type === 'worldclock') {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-950 to-indigo-950 flex flex-wrap items-center justify-center gap-1 p-1 text-white">
        <span className="text-[8px] text-cyan-400 truncate max-w-full">{z.mediaTitle || ''}</span>
      </div>
    );
  }
  if (type === 'webpage') {
    return (
      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-1">
        <Globe className="h-5 w-5 mb-1 opacity-60" />
        <span className="text-[8px] truncate max-w-full">{z.mediaTitle || extra.webUrl || ''}</span>
      </div>
    );
  }
  // fallback: โซนว่าง/widget ธรรมดา
  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-600">
      <Monitor className="h-5 w-5 mb-1 opacity-40" />
      <span className="text-[8px] truncate max-w-full px-1">{title}</span>
    </div>
  );
};

export const LiveScreenPreview: React.FC<{ screen: DigitalScreen; onClose: () => void }> = ({ screen, onClose }) => {
  const { t } = useTranslation();
  const screenStates = useSignageStore((s) => s.screenStates);
  const playlists = useSignageStore((s) => s.playlists);
  const layouts = useSignageStore((s) => s.layouts);
  const state = screenStates[screen.id];

  // tick ทุก 1 วิ — นาฬิกาในโซน clock + เวลาอัปเดตล่าสุด
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const zones = (state?.zones || []) as any[];
  const orientation = state?.layout?.orientation || screen.orientation || 'landscape';
  const isLandscape = orientation !== 'portrait';
  const playlistName = playlists.find((p) => p.id === state?.effectivePlaylistId)?.name;
  const layoutName = layouts.find((l) => l.id === state?.layout?.id)?.name || state?.layout?.name;
  const prioKey = PRIO_T_KEY[state?.priorityLevel]
    ? t(PRIO_T_KEY[state?.priorityLevel] as any)
    : (state?.priorityLevel || '—');
  const isOnline = state?.online !== false; // ไม่มี state = ยังไม่รู้ / online จริง

  const updatedLabel = state?.updatedAt
    ? new Date(state.updatedAt).toLocaleTimeString()
    : '—';

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <div>
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>{screen.name}</span>
                <span className="text-[10px] font-mono text-slate-500">{screen.pairingCode}</span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{t('sm.liveUpdated')}: {updatedLabel}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">✕</button>
        </div>

        {!state ? (
          <div className="p-10 text-center text-slate-400">
            <Monitor className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-slate-300">{t('sm.liveEmpty')}</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">{screen.id}</p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Info chips */}
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <Zap className="h-3 w-3 text-cyan-400" />
                <span>{t('sm.liveSource')}:</span>
                <span className="font-bold text-white">{state.contentSource || 'default'}</span>
              </span>
              <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border ${PRIO_CHIP[state.priorityLevel] || 'bg-slate-800 text-slate-300 border-slate-700/60'}`}>
                <TrendingUp className="h-3 w-3" />
                <span>{t('sm.livePriority')}:</span>
                <span className="font-bold">{prioKey}</span>
              </span>
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <ListMusic className="h-3 w-3 text-indigo-400" />
                <span>{t('sm.livePlaylist')}:</span>
                <span className="font-bold text-white">{playlistName || state.effectivePlaylistId || '—'}</span>
              </span>
              <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <Layout className="h-3 w-3 text-emerald-400" />
                <span>{t('sm.liveLayout')}:</span>
                <span className="font-bold text-white">{layoutName || state.layout?.id || '—'}</span>
              </span>
              {!isOnline && (
                <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-rose-950 border border-rose-500/50 text-rose-300">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{t('sm.liveOffline')}</span>
                </span>
              )}
            </div>

            {/* Mini replica ของ layout */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-3">
              <div className="relative w-full bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: isLandscape ? '16 / 9' : '9 / 16', maxHeight: 380 }}>
                {zones.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs">
                    <Layers className="h-5 w-5 mr-2 opacity-40" /> {t('sm.noSignal')}
                  </div>
                )}
                {zones.map((z) => (
                  <div
                    key={z.zoneId}
                    className="absolute overflow-hidden border border-white/10"
                    style={{
                      left: `${z.x}%`, top: `${z.y}%`,
                      width: `${z.width}%`, height: `${z.height}%`,
                      zIndex: z.zIndex || 1,
                      backgroundColor: z.backgroundColor || '#0f172a',
                    }}
                  >
                    <MiniZoneContent z={z} now={now} />
                    <div className="absolute bottom-0 inset-x-0 bg-black/65 text-[9px] text-white/90 px-1 py-0.5 truncate">
                      {z.zoneName}
                    </div>
                  </div>
                ))}
              </div>
              {/* Caption */}
              <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                <span className="flex items-center space-x-1">
                  <ImageIcon className="h-3 w-3" />
                  <span>{t('sm.livePreview')} — {isLandscape ? '16:9' : '9:16'}</span>
                </span>
                {state.online === false && (
                  <span className="flex items-center space-x-1 text-rose-400">
                    <MapPin className="h-3 w-3" />
                    <span>{screen.location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* รายการโซนที่กำลังเล่น */}
            {zones.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('sm.liveZones')} ({zones.length})
                </h4>
                <div className="space-y-1.5">
                  {zones.map((z) => (
                    <div key={z.zoneId} className="flex items-center justify-between text-xs bg-slate-950/70 border border-slate-800/70 rounded-lg px-3 py-2">
                      <span className="text-slate-400 truncate max-w-[30%]">{z.zoneName}</span>
                      <span className="text-slate-200 font-medium truncate max-w-[40%]">
                        {z.mediaTitle || z.mediaType || '—'}
                      </span>
                      <span className="flex items-center space-x-2 text-slate-500 font-mono text-[10px]">
                        <span>{z.mediaType || ''}</span>
                        {z.itemDuration ? <span>{z.itemDuration}s</span> : null}
                        {z.startedAt ? <span>{new Date(z.startedAt).toLocaleTimeString()}</span> : null}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
