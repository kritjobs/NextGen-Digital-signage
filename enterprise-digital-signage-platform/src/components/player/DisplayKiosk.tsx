/**
 * DisplayKiosk — Standalone Player for TV/Kiosk
 * URL: /display/:screenId?token=xxx
 * ไม่ต้อง login — ใช้ display token
 * Auto-fullscreen, auto-refresh data ทุก 30 วินาที
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { LayoutZone, MediaItem, Playlist } from '../../types/signage';
import { ZoneWidgetRenderer } from '../widgets/ZoneWidgetRenderer';

interface DisplayData {
  screen: any;
  layout: any;
  playlists: any[];
  mediaItems: any[];
}

export const DisplayKiosk: React.FC = () => {
  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [quickPost, setQuickPost] = useState<any>(null);
  const [hideInteractQr, setHideInteractQr] = useState(false);
  // REQ-003: ref ไว้ให้ WS handler เรียก fetch ใหม่ได้ทันทีเมื่อ schedule เปลี่ยน
  const fetchDataRef = useRef<() => void>(() => {});

  // REQ-004: Offline-first — เล่นต่อได้จากแคชเมื่อเน็ตหลุด
  const [offline, setOffline] = useState<boolean>(typeof navigator !== 'undefined' && !navigator.onLine);
  const [cachedAt, setCachedAt] = useState<string | null>(null);
  const dataRef = useRef<any>(null); // ข้อมูลจอล่าสุด (ใช้เล่นต่อเมื่อ fetch ล้มเหลว)
  // dev/test hook: ?simoffline=1 จำลองเน็ตหลุด (อ่านจาก SW cache ตรงๆ)
  const simOffline = new URLSearchParams(window.location.search).get('simoffline') === '1';

  // Auto-fullscreen on first user interaction
  const enterFullscreen = () => {
    const el = document.documentElement;
    try {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      } else if ((el as any).msRequestFullscreen) {
        (el as any).msRequestFullscreen();
      }
    } catch (e) {
      console.log('[Kiosk] Fullscreen request failed:', e);
    }
  };

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      // Unmute all video elements on the page
      document.querySelectorAll('video').forEach(v => {
        (v as HTMLVideoElement).muted = false;
      });
      setAudioUnlocked(true);
      // Also enter fullscreen on first click
      enterFullscreen();
    };

    const handler = () => {
      unlockAudio();
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('click', handler);
    document.addEventListener('touchstart', handler);
    document.addEventListener('keydown', handler);

    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('keydown', handler);
    };
  }, []);

  // Parse URL params
  const pathParts = window.location.pathname.split('/');
  const screenId = pathParts[pathParts.length - 1] || pathParts[pathParts.length - 2];
  const token = new URLSearchParams(window.location.search).get('token');

  // REQ-005: รายงาน Proof of Play เข้า server (ใช้ display token)
  const reportPoP = useCallback((pop: any) => {
    const displayToken = token || localStorage.getItem('signage_display_token') || '';
    if (!displayToken) return;
    fetch('/api/analytics/proof-of-play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${displayToken}` },
      body: JSON.stringify(pop),
    }).catch(() => {});
  }, [token]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // REQ-004: register Service Worker (แคชข้อมูลจอ + สื่อ — ใช้ได้บน localhost/HTTPS)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch((e) => console.warn('[Kiosk] SW register failed (ต้องการ HTTPS/localhost):', e.message));
    }
  }, []);

  // REQ-004: online/offline event + auto-resume ทันทีเมื่อกลับมา
  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
      fetchDataRef.current(); // resume: ดึงข้อมูลสดทันที
    };
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Fetch data (initial + refresh every 30s)
  useEffect(() => {
    if (!token || !screenId) {
      setError('Missing token or screenId in URL');
      return;
    }

    const fetchData = async () => {
      // dev/test hook: จำลอง offline — อ่านจาก SW cache โดยตรง
      if (simOffline) {
        setOffline(true);
        try {
          const cacheRes = await caches.match(`/api/display/${screenId}/data?token=${token}`);
          if (cacheRes) {
            const json = await cacheRes.json();
            dataRef.current = json;
            setData(json);
            setError(null);
            setCachedAt(new Date().toLocaleTimeString('th-TH'));
          }
        } catch { /* ยังไม่มี cache */ }
        return;
      }
      try {
        const res = await fetch(`/api/display/${screenId}/data?token=${token}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          // REQ-004: fetch ไม่สำเร็จแต่ยังมีข้อมูลเก่า → เล่นต่อจากแคช
          if (dataRef.current) { setOffline(true); return; }
          setError(err.error || 'Failed to load display data');
          return;
        }
        const json = await res.json();
        dataRef.current = json;
        setData(json);
        setError(null);
        // ไม่ลบ offline ถ้าเน็ตยังหลุดจริง (navigator.onLine=false) — SW อาจตอบ cache มาเอง
        if (navigator.onLine) setOffline(false);
      } catch (e: any) {
        // REQ-004: เน็ตหลุด — มี cache ให้เล่นต่อ, ไม่มี cache → แจ้ง error
        if (dataRef.current) { setOffline(true); return; }
        setError('Network error: ' + e.message + (offline ? ' (offline — ไม่มี cached data)' : ''));
      }
    };

    fetchDataRef.current = fetchData;
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [screenId, token]);

  // REQ-011: campaign rotation — refetch ให้ทันเมื่อ item เปลี่ยน (server คำนวณ layout ตามเวลา)
  useEffect(() => {
    const c: any = (data as any)?.campaign;
    if (!c || (data as any)?.contentSource !== 'campaign') return;
    const seq: any[] = Array.isArray(c.layoutSequence) ? c.layoutSequence.filter((i: any) => i?.layoutId) : [];
    if (!seq.length || c.cycleMode === 'random') return;
    const totalSec = seq.reduce((s: number, i: any) => s + (Number(i.durationSec) || 0), 0);
    if (!totalSec || !c.createdAt) return;
    const epoch = new Date(c.createdAt).getTime();
    const elapsed = ((Date.now() - epoch) % (totalSec * 1000)) / 1000;
    let acc = 0;
    let remaining = totalSec;
    for (const i of seq) {
      acc += Number(i.durationSec) || 0;
      if (elapsed < acc) { remaining = acc - elapsed; break; }
    }
    const timer = setTimeout(() => { fetchDataRef.current(); }, Math.max(1000, remaining * 1000));
    return () => clearTimeout(timer);
  }, [data]);

  // WebSocket: listen for remote commands (UNPAIR, EMERGENCY, etc.)
  useEffect(() => {
    if (!token || !screenId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${token}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'SCREEN_COMMAND' && msg.payload) {
              const { screenId: targetId, command } = msg.payload;
              // Only respond to commands for this screen (or broadcast to all)
              if (targetId === screenId || targetId === 'ALL') {
                if (command === 'UNPAIR_DEVICE') {
                  // Clear tokens and redirect to pair page
                  localStorage.removeItem('signage_display_token');
                  localStorage.removeItem('signage_display_screen_id');
                  // Notify native app (Android TV) to clear saved token
                  if ((window as any).SignageNative?.onUnpaired) {
                    (window as any).SignageNative.onUnpaired();
                  }
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  window.location.href = '/pair';
                }
              }
            }
            // REQ-003: schedule เปลี่ยน → ดึงข้อมูลใหม่ทันที (ไม่ต้องรอ poll 30 วิ)
            if (msg.type === 'SCHEDULE_CHANGED' && msg.payload?.screenId === screenId) {
              fetchDataRef.current();
            }
            // Quick Post overlay
            if (msg.type === 'QUICK_POST' && msg.payload) {
              const post = msg.payload;
              const targets = post.targetScreenIds || [];
              if (targets.length === 0 || targets.includes(screenId)) {
                setQuickPost(post);
                setTimeout(() => setQuickPost(null), (post.duration || 30) * 1000);
              }
            }
          } catch { /* ignore parse errors */ }
        };
        ws.onclose = () => {
          // Reconnect after 5s
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch { /* ignore */ }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [screenId, token]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-xl font-bold mb-2">Display Error</h1>
          <p className="text-slate-400 text-sm">{error}</p>
          <p className="text-slate-600 text-xs mt-4">Screen: {screenId}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Connecting to display...</p>
        </div>
      </div>
    );
  }

  const { screen, layout, playlists, mediaItems } = data;
  const zones = layout?.zones || [];

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden relative select-none"
      onClick={() => { if (!audioUnlocked) setAudioUnlocked(true); }}
    >
      {/* REQ-004: Offline indicator — เล่นจากแคช */}
      {offline && data && (
        <div className="absolute top-3 right-3 z-40 bg-amber-500/90 text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
          OFFLINE — เล่นจากแคช{cachedAt ? ` (${cachedAt})` : ''}
        </div>
      )}

      {/* Fullscreen + Audio unlock prompt (แสดงครั้งเดียวจนกว่าจะคลิก) */}
      {!audioUnlocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer"
             onClick={() => { setAudioUnlocked(true); enterFullscreen(); }}>
          <div className="text-center">
            <img src="/logo-thaihua.png" alt="ThaiHua Digital Signage" className="w-48 mx-auto mb-4" />
            <p className="text-white text-xl font-semibold mb-2">Display Ready</p>
            <p className="text-cyan-400 text-lg animate-pulse">Click anywhere to enter fullscreen</p>
          </div>
        </div>
      )}

      {/* Multi-Zone Renderer */}
      <div className={`relative w-full h-full ${
        layout?.orientation === 'portrait' ? 'max-w-[480px] mx-auto' : ''
      }`}>
        {zones.map((zone: any) => (
          <KioskZone
            key={zone.id}
            zone={zone}
            screenPlaylistId={data.effectivePlaylistId ?? screen.currentPlaylistId}
            playlists={playlists}
            mediaItems={mediaItems}
            currentTime={currentTime}
            screenId={screen.id}
            screenName={screen.name}
            reportPoP={reportPoP}
          />
        ))}
      </div>

      {/* Minimal status indicator (bottom-left, fades after 5s) */}
      <div className="absolute bottom-2 left-2 text-[9px] text-white/20 font-mono">
        {screen.name} • {currentTime.toLocaleTimeString()}
      </div>

      {/* QR Scan-to-Interact (bottom-right) — ผู้ชมสแกนแล้วควบคุมจอได้ */}
      {!hideInteractQr && (
        <div
          className="absolute bottom-3 right-3 z-30 flex flex-col items-center gap-1 rounded-xl bg-black/55 backdrop-blur px-2 py-1.5 border border-white/10 hover:bg-black/75 transition-colors cursor-pointer select-none"
          onClick={() => setHideInteractQr(true)}
          title="แตะเพื่อซ่อน • ผู้ชมสแกน QR เพื่อส่งข้อความ/เปลี่ยนเนื้อหา"
        >
          <QRCodeSVG value={`${window.location.origin}/interact/${screen.id}`} size={86} bgColor="#ffffff" fgColor="#0f172a" level="M" />
          <span className="text-[9px] font-semibold text-white/80 tracking-wide">📱 สแกนโต้ตอบจอ</span>
        </div>
      )}

      {/* Quick Post Overlay */}
      {quickPost && (
        <div className={`absolute top-0 left-0 right-0 z-[100] p-4 flex items-center justify-center animate-fade-in ${
          quickPost.style === 'urgent' ? 'bg-rose-600' :
          quickPost.style === 'warning' ? 'bg-amber-600' :
          quickPost.style === 'success' ? 'bg-emerald-600' :
          'bg-blue-600'
        }`}>
          <p className="text-white text-lg font-bold text-center max-w-3xl">{quickPost.message}</p>
        </div>
      )}
    </div>
  );
};


// ─── Kiosk Zone (simplified, no OSD) ─────────────────────
interface KioskZoneProps {
  zone: any;
  screenPlaylistId?: string;
  playlists: any[];
  mediaItems: any[];
  currentTime: Date;
  screenId: string;
  screenName: string;
  reportPoP: (pop: any) => void;
}

const KioskZone: React.FC<KioskZoneProps> = ({ zone, screenPlaylistId, playlists, mediaItems, currentTime, screenId, screenName, reportPoP }) => {
  // Zone-specific playlist takes priority, fall back to screen-level playlist only if zone has no assignment
  const zonePlaylistId = zone.playlistId || zone.playlist_id;
  const effectivePlaylistId = zonePlaylistId || screenPlaylistId;
  const playlist = playlists.find((p: any) => p.id === effectivePlaylistId);
  const items = playlist?.items || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const activeItem = items[currentIndex];
  const activeMedia = mediaItems.find((m: any) => m.id === (activeItem?.mediaId || activeItem?.media_id));

  // Auto-advance
  useEffect(() => {
    if (!items.length || !activeItem) return;
    const duration = (activeItem.duration || 15) * 1000;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIndex, items.length, activeItem]);

  // REQ-005: รายงาน PoP ทุกครั้งที่เริ่มเล่นสื่อ (จริง — ผ่าน display token)
  useEffect(() => {
    if (!activeItem || !activeMedia) return;
    reportPoP({
      screenId,
      screenName,
      mediaId: activeMedia.id,
      mediaTitle: activeMedia.title,
      playedAt: new Date().toISOString(),
      durationSeconds: activeItem.duration || 10,
      status: 'completed',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <div
      className="absolute overflow-hidden flex items-center justify-center"
      style={{
        left: `${zone.x}%`, top: `${zone.y}%`,
        width: `${zone.width}%`, height: `${zone.height}%`,
        zIndex: zone.zIndex || zone.z_index || 1,
        backgroundColor: zone.backgroundColor || zone.background_color || '#000',
      }}
    >
      {zone.mediaType && zone.mediaType !== 'video' && zone.mediaType !== 'image' ? (
        <ZoneWidgetRenderer zone={zone} />
      ) : activeMedia ? (
        <KioskMediaRenderer media={activeMedia} currentTime={currentTime} />
      ) : zone.mediaType ? (
        <ZoneWidgetRenderer zone={zone} />
      ) : (
        <div className="text-slate-700 text-xs">{zone.name}</div>
      )}
    </div>
  );
};

// ─── Kiosk Media Renderer ─────────────────────────────────
const KioskMediaRenderer: React.FC<{ media: any; currentTime: Date }> = ({ media, currentTime }) => {
  const type = media.type;
  let url = media.url || '';
  const [hasError, setHasError] = React.useState(false);

  // Proxy external URLs through our server (fixes Android TV WebView CORS/loading issues)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    url = `/api/media-proxy?url=${encodeURIComponent(url)}`;
  }

  // Reset error state when media changes
  React.useEffect(() => { setHasError(false); }, [media.id, url]);

  if (type === 'video') {
    if (hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <p className="text-slate-500 text-sm">{media.title || 'Video'}</p>
        </div>
      );
    }
    return (
      <video
        ref={(el) => { if (el) { el.play().catch(() => {}); } }}
        src={url}
        autoPlay
        loop
        muted
        playsInline
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  if (type === 'image') {
    if (hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <p className="text-slate-500 text-sm">{media.title || 'Image'}</p>
        </div>
      );
    }
    return (
      <img
        src={url || media.thumbnailUrl || media.thumbnail_url}
        alt={media.title || ''}
        crossOrigin="anonymous"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  if (type === 'ticker') {
    const text = media.tickerText || media.ticker_text || media.contentData?.tickerText || 'Welcome';
    return (
      <div className="w-full h-full bg-slate-900 flex items-center overflow-hidden px-4">
        <div className="whitespace-nowrap text-white text-sm font-medium animate-marquee">
          {text}
        </div>
      </div>
    );
  }

  if (type === 'weather') {
    const city = media.weatherCity || media.weather_city || media.contentData?.weatherCity || 'City';
    return (
      <div className="w-full h-full p-4 bg-gradient-to-tr from-slate-900 to-blue-950 flex flex-col justify-center text-white">
        <span className="text-xs text-cyan-400 uppercase font-bold">Weather</span>
        <h3 className="text-lg font-bold">{city}</h3>
        <span className="text-3xl font-black">72°F</span>
      </div>
    );
  }

  if (type === 'clock') {
    return (
      <div className="w-full h-full p-4 bg-gradient-to-tr from-slate-950 to-indigo-950 flex flex-col justify-center items-center text-white">
        <div className="text-3xl font-black font-mono text-cyan-300">
          {currentTime.toLocaleTimeString()}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>
    );
  }

  if (type === 'announcement') {
    const header = media.announceHeader || media.announce_header || media.contentData?.announcementHeader || '';
    const body = media.announceBody || media.announce_body || media.contentData?.announcementBody || '';
    return (
      <div className="w-full h-full p-6 bg-gradient-to-tr from-slate-900 to-slate-950 flex flex-col justify-center text-white">
        <h3 className="text-amber-300 font-bold uppercase text-sm mb-2">{header}</h3>
        <p className="text-slate-100 text-sm leading-relaxed">{body}</p>
      </div>
    );
  }

  if (type === 'countdown') {
    const targetDate = media.contentData?.countdownDate || '2026-12-31';
    const label = media.contentData?.countdownLabel || 'Event Starts In';
    const target = new Date(targetDate).getTime();
    const now = currentTime.getTime();
    const diff = Math.max(0, target - now);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-950 to-slate-950 flex flex-col items-center justify-center text-white p-4">
        <p className="text-xs uppercase tracking-widest text-purple-300 mb-3">{label}</p>
        <div className="flex gap-3 text-center">
          <div><span className="text-4xl font-black">{days}</span><p className="text-[10px] text-purple-300">DAYS</p></div>
          <span className="text-3xl font-light text-purple-400">:</span>
          <div><span className="text-4xl font-black">{hours}</span><p className="text-[10px] text-purple-300">HRS</p></div>
          <span className="text-3xl font-light text-purple-400">:</span>
          <div><span className="text-4xl font-black">{mins}</span><p className="text-[10px] text-purple-300">MIN</p></div>
          <span className="text-3xl font-light text-purple-400">:</span>
          <div><span className="text-4xl font-black">{secs}</span><p className="text-[10px] text-purple-300">SEC</p></div>
        </div>
      </div>
    );
  }

  if (type === 'qrcode') {
    const data = media.contentData?.qrCodeData || 'https://example.com';
    const label = media.contentData?.qrCodeLabel || 'Scan Me';
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-4">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`}
          alt="QR Code"
          className="w-32 h-32 mb-3"
        />
        <p className="text-slate-800 text-sm font-bold">{label}</p>
        <p className="text-slate-500 text-[10px] mt-1 max-w-[200px] truncate">{data}</p>
      </div>
    );
  }

  if (type === 'promo') {
    const title = media.contentData?.promoTitle || 'SPECIAL OFFER';
    const price = media.contentData?.promoPrice || '฿199';
    const origPrice = media.contentData?.promoOrigPrice || '';
    const desc = media.contentData?.promoDesc || '';
    return (
      <div className="w-full h-full bg-gradient-to-br from-rose-600 to-orange-500 flex flex-col items-center justify-center text-white p-6">
        <p className="text-xs uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full mb-3">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black">{price}</span>
          {origPrice && <span className="text-xl line-through opacity-60">{origPrice}</span>}
        </div>
        {desc && <p className="text-sm mt-3 opacity-90">{desc}</p>}
      </div>
    );
  }

  if (type === 'kpi') {
    const value = media.contentData?.kpiValue || '0';
    const label = media.contentData?.kpiLabel || 'Metric';
    const trend = media.contentData?.kpiTrend || '';
    const isPositive = trend.startsWith('+');
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center text-white p-4">
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">{label}</p>
        <span className="text-5xl font-black">{value}</span>
        {trend && (
          <span className={`text-sm font-bold mt-2 px-2 py-0.5 rounded ${isPositive ? 'text-emerald-400 bg-emerald-950' : 'text-rose-400 bg-rose-950'}`}>
            {trend}
          </span>
        )}
      </div>
    );
  }

  if (type === 'worldclock') {
    const cities = (media.contentData?.worldClockCities || 'Bangkok,London').split(',').map((c: string) => c.trim());
    const tzMap: Record<string, string> = {
      'Bangkok': 'Asia/Bangkok', 'Tokyo': 'Asia/Tokyo', 'London': 'Europe/London',
      'New York': 'America/New_York', 'LA': 'America/Los_Angeles', 'Sydney': 'Australia/Sydney',
      'Dubai': 'Asia/Dubai', 'Singapore': 'Asia/Singapore', 'Paris': 'Europe/Paris',
      'Berlin': 'Europe/Berlin', 'Mumbai': 'Asia/Kolkata', 'Shanghai': 'Asia/Shanghai',
    };
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-950 to-indigo-950 flex flex-wrap items-center justify-center gap-4 p-4 text-white">
        {cities.slice(0, 6).map((city: string) => {
          const tz = tzMap[city] || 'UTC';
          let time = '';
          try { time = currentTime.toLocaleTimeString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit' }); } catch { time = '--:--'; }
          return (
            <div key={city} className="text-center min-w-[80px]">
              <p className="text-[10px] text-cyan-400 uppercase">{city}</p>
              <p className="text-xl font-bold font-mono">{time}</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (type === 'webpage') {
    const pageUrl = media.contentData?.webUrl || media.url || '';
    if (!pageUrl) return null;
    return (
      <iframe
        src={pageUrl}
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title={media.title || 'Web Page'}
      />
    );
  }

  return null;
};
