import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  AlertOctagon, 
  CloudSun, 
  Clock, 
  Radio, 
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Info,
  QrCode,
  Presentation
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { LayoutZone, MediaItem, Playlist, DigitalScreen } from '../../types/signage';
import { PairingQRCode } from './PairingQRCode';
import { ZoneWidgetRenderer } from '../widgets/ZoneWidgetRenderer';

export const PlayerApp: React.FC = () => {
  const { 
    playerScreenId, 
    setPlayerScreenId, 
    screens, 
    layouts, 
    playlists, 
    mediaItems, 
    emergencyAlerts,
    isSimulatedOffline,
    setIsSimulatedOffline,
    recordProofOfPlay,
    setViewMode
  } = useSignageStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOsd, setShowOsd] = useState(true);
  const [showPairingQr, setShowPairingQr] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quickPost, setQuickPost] = useState<{ message: string; style: string } | null>(null);

  const playerRef = useRef<HTMLDivElement>(null);

  const activeScreen = screens.find((s) => s.id === playerScreenId) || screens[0];
  const activeEmergency = emergencyAlerts.find((a) => a.active);

  // Active Layout (with fallback: currentLayout → fallbackLayout → first layout)
  const baseLayout = layouts.find((l) => l.id === activeScreen?.currentLayoutId)
    || layouts.find((l) => l.id === activeScreen?.fallbackLayoutId)
    || layouts[0];

  // Campaign Rotation — auto-cycle through campaign layouts
  const [campaignLayoutId, setCampaignLayoutId] = useState<string | null>(null);
  const [campaignIndex, setCampaignIndex] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('signage_campaigns');
      if (!raw) return;
      const campaigns = JSON.parse(raw);
      const activeCampaign = campaigns.find((c: any) => c.isActive && c.layoutSequence?.length > 0);
      if (!activeCampaign) { setCampaignLayoutId(null); return; }

      const sequence = activeCampaign.layoutSequence;
      const currentItem = sequence[campaignIndex % sequence.length];
      setCampaignLayoutId(currentItem.layoutId);

      const timer = setTimeout(() => {
        if (activeCampaign.cycleMode === 'random') {
          setCampaignIndex(Math.floor(Math.random() * sequence.length));
        } else {
          setCampaignIndex((prev) => (prev + 1) % sequence.length);
        }
      }, currentItem.durationSec * 1000);

      return () => clearTimeout(timer);
    } catch { setCampaignLayoutId(null); }
  }, [campaignIndex]);

  // Final layout: Campaign layout takes priority over schedule (but not emergency)
  const activeLayout = (campaignLayoutId && !activeEmergency)
    ? (layouts.find((l) => l.id === campaignLayoutId) || baseLayout)
    : baseLayout;

  // Precision Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // OSD auto-hide after 5 seconds of inactivity
  useEffect(() => {
    const osdTimer = setTimeout(() => setShowOsd(false), 8000);
    return () => clearTimeout(osdTimer);
  }, [showOsd]);

  // WebSocket listener for Quick Post
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('signage_access_token') || '';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${token}`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'QUICK_POST' && msg.payload) {
              const post = msg.payload;
              setQuickPost({ message: post.message, style: post.style || 'info' });
              setTimeout(() => setQuickPost(null), (post.duration || 30) * 1000);
            }
          } catch {}
        };
        ws.onclose = () => { reconnectTimer = setTimeout(connect, 5000); };
      } catch {}
    };
    connect();
    return () => { clearTimeout(reconnectTimer); ws?.close(); };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!activeScreen || showPairingQr) {
    return (
      <div className="relative">
        {showPairingQr && activeScreen && (
          <button
            onClick={() => setShowPairingQr(false)}
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 shadow-xl cursor-pointer"
          >
            ✕ Return to Display Player
          </button>
        )}
        <PairingQRCode 
          initialCode={activeScreen ? activeScreen.pairingCode : 'PAIR-8899'} 
          onPairSuccess={() => setShowPairingQr(false)} 
        />
      </div>
    );
  }

  return (
    <div 
      ref={playerRef}
      onMouseMove={() => setShowOsd(true)}
      className="relative w-full min-h-[640px] bg-slate-950 text-white overflow-hidden select-none flex flex-col justify-between font-sans"
    >
      
      {/* 1. EMERGENCY BROADCAST OVERLAY */}
      {activeEmergency && (
        <div className="absolute inset-0 z-50 bg-rose-950/95 flex flex-col items-center justify-center p-8 text-center text-white animate-pulse border-8 border-rose-500">
          <AlertOctagon className="h-24 w-24 text-rose-300 animate-bounce mb-4" />
          <span className="text-sm font-black tracking-widest uppercase bg-black/60 px-4 py-1 rounded border border-rose-400 text-rose-200">
            🚨 EMERGENCY OVERRIDE BROADCAST
          </span>
          <h1 className="text-3xl sm:text-5xl font-black mt-4 text-white tracking-tight drop-shadow-lg">
            {activeEmergency.title}
          </h1>
          <p className="text-lg sm:text-2xl font-semibold mt-4 text-rose-100 max-w-3xl leading-relaxed">
            {activeEmergency.message}
          </p>
          <div className="mt-8 text-xs font-mono text-rose-300 bg-rose-900/80 px-4 py-2 rounded-xl">
            Triggered at {new Date(activeEmergency.triggeredAt).toLocaleTimeString()} • All zones overridden
          </div>
        </div>
      )}

      {/* 2. MAIN MULTI-ZONE RENDERER CANVAS */}
      <div 
        className={`relative w-full h-full min-h-[580px] bg-black overflow-hidden ${
          activeLayout.orientation === 'portrait' ? 'max-w-[480px] mx-auto aspect-[9/16]' : 'w-full aspect-video'
        }`}
      >
        {activeLayout.zones.map((zone) => (
          <ZoneContainer 
            key={zone.id} 
            zone={zone} 
            playlists={playlists} 
            mediaItems={mediaItems}
            screenId={activeScreen.id}
            screenName={activeScreen.name}
            screenPlaylistId={activeScreen.currentPlaylistId}
            isMuted={activeScreen.isMuted}
            recordProofOfPlay={recordProofOfPlay}
            currentTime={currentTime}
          />
        ))}
      </div>

      {/* 3. SMART TV ON-SCREEN DISPLAY (OSD) & OVERLAY CONTROLS */}

      {/* Quick Post Overlay */}
      {quickPost && (
        <div className={`absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-center animate-fade-in ${
          quickPost.style === 'urgent' ? 'bg-rose-600' :
          quickPost.style === 'warning' ? 'bg-amber-600' :
          quickPost.style === 'success' ? 'bg-emerald-600' :
          'bg-blue-600'
        }`}>
          <p className="text-white text-lg font-bold text-center max-w-3xl">{quickPost.message}</p>
        </div>
      )}

      <div 
        className={`absolute bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 p-3 px-6 transition-all duration-300 flex items-center justify-between text-xs ${
          showOsd ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white text-sm">{activeScreen.name}</span>
            <span className="text-xs text-slate-400 font-mono">({activeScreen.pairingCode})</span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800 text-[11px] text-slate-300">
            <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
            <span>Buffer Cache: 100% Synced</span>
          </div>
        </div>

        {/* Offline Simulator Switch & Screen Switcher */}
        <div className="flex items-center space-x-3">
          
          <button
            onClick={() => setIsSimulatedOffline(!isSimulatedOffline)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all border ${
              isSimulatedOffline 
                ? 'bg-amber-950 border-amber-600 text-amber-300' 
                : 'bg-emerald-950 border-emerald-600 text-emerald-300'
            }`}
          >
            {isSimulatedOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                <span>OFFLINE SIMULATION</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                <span>ONLINE CLOUD SYNC</span>
              </>
            )}
          </button>

          {/* Target Screen Picker */}
          <select
            value={playerScreenId}
            onChange={(e) => setPlayerScreenId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs text-white font-semibold"
          >
            {screens.map((scr) => (
              <option key={scr.id} value={scr.id}>📺 {scr.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowPairingQr(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold flex items-center space-x-1"
            title="Pairing QR Code & Mobile Auth"
          >
            <QrCode className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
            title="Toggle Fullscreen TV"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setViewMode('admin')}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-xs"
          >
            Exit Player
          </button>
        </div>
      </div>

    </div>
  );
};

// Zone Container Component
interface ZoneContainerProps {
  zone: LayoutZone;
  playlists: Playlist[];
  mediaItems: MediaItem[];
  screenId: string;
  screenName: string;
  screenPlaylistId?: string;
  isMuted: boolean;
  recordProofOfPlay: any;
  currentTime: Date;
}

const ZoneContainer: React.FC<ZoneContainerProps> = ({
  zone,
  playlists,
  mediaItems,
  screenId,
  screenName,
  screenPlaylistId,
  isMuted,
  recordProofOfPlay,
  currentTime
}) => {
  // Playlist resolution:
  // Zone-specific playlist takes priority, fall back to screen-level playlist only if zone has no assignment
  const zonePlaylistId = zone.playlistId;
  const effectivePlaylistId = zonePlaylistId || screenPlaylistId;
  const playlist = playlists.find((p) => p.id === effectivePlaylistId);
  const items = playlist?.items || [];

  const [currentIndex, setCurrentIndex] = useState(0);

  const activePlaylistItem = items[currentIndex];
  const rawMedia = mediaItems.find((m) => m.id === activePlaylistItem?.mediaId);
  // Skip expired media
  const activeMedia = rawMedia && rawMedia.expiresAt && new Date(rawMedia.expiresAt) < new Date() ? undefined : rawMedia;

  useEffect(() => {
    if (!items.length || !activePlaylistItem) return;

    const timer = setTimeout(() => {
      if (activeMedia) {
        recordProofOfPlay({
          screenId,
          screenName,
          mediaId: activeMedia.id,
          mediaTitle: activeMedia.title,
          playedAt: new Date().toISOString(),
          durationSeconds: activePlaylistItem.duration,
          status: 'completed'
        });
      }

      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, (activePlaylistItem.duration || 10) * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, items.length, activePlaylistItem]);

  return (
    <div
      className="absolute overflow-hidden flex flex-col justify-center items-center transition-all duration-500"
      style={{
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: `${zone.width}%`,
        height: `${zone.height}%`,
        zIndex: zone.zIndex,
        backgroundColor: zone.backgroundColor || '#020617'
      }}
    >
      {/* Priority: zone.mediaType widget > zone playlist media > screen playlist fallback */}
      {zone.mediaType && zone.mediaType !== 'video' && zone.mediaType !== 'image' ? (
        <ZoneWidgetRenderer zone={zone} />
      ) : activeMedia ? (
        <MediaRenderer media={activeMedia} isMuted={isMuted} currentTime={currentTime} />
      ) : zone.mediaType ? (
        <ZoneWidgetRenderer zone={zone} />
      ) : (
        <div className="text-center text-slate-500 p-2">
          <span className="text-[10px] uppercase font-bold tracking-wider">{zone.name}</span>
        </div>
      )}
    </div>
  );
};

// Media Item Specific Renderer
const MediaRenderer: React.FC<{ media: MediaItem; isMuted: boolean; currentTime: Date }> = ({ media, isMuted, currentTime }) => {
  if (media.type === 'video') {
    return (
      <video
        src={media.url}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
      />
    );
  }

  if (media.type === 'image') {
    return (
      <img
        src={media.url || media.thumbnailUrl}
        alt={media.title}
        className="w-full h-full object-cover animate-fade-in"
      />
    );
  }

  if (media.type === 'ticker') {
    return (
      <div className="w-full h-full bg-slate-900 border-t border-cyan-500/40 flex items-center overflow-hidden px-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs shrink-0 pr-4 border-r border-slate-800">
          <Radio className="h-4 w-4 animate-pulse" />
          <span>NEWS TICKER:</span>
        </div>
        <div className="whitespace-nowrap font-medium text-sm text-slate-100 tracking-wide animate-marquee py-1">
          {media.contentData?.tickerText || 'Welcome to our enterprise digital signage network.'}
        </div>
      </div>
    );
  }

  if (media.type === 'weather') {
    return (
      <div className="w-full h-full p-4 bg-gradient-to-tr from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-center text-white border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">LOCAL WEATHER & AIR QUALITY</span>
          <CloudSun className="h-6 w-6 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold mt-2">{media.contentData?.weatherCity || 'San Francisco, CA'}</h3>
        <div className="flex items-baseline space-x-2 mt-1">
          <span className="text-4xl font-black text-white">72°F</span>
          <span className="text-xs text-slate-300">Sunny • AQI 24 (Good)</span>
        </div>
      </div>
    );
  }

  if (media.type === 'clock') {
    return (
      <div className="w-full h-full p-4 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center text-white border border-slate-800">
        <Clock className="h-6 w-6 text-cyan-400 mb-1" />
        <div className="text-3xl font-black font-mono tracking-wider text-cyan-300">
          {currentTime.toLocaleTimeString()}
        </div>
        <div className="text-xs text-slate-400 mt-1 uppercase font-semibold">
          {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    );
  }

  if (media.type === 'announcement') {
    return (
      <div className="w-full h-full p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col justify-center text-white border-2 border-indigo-500/30">
        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/80 px-2.5 py-1 rounded w-fit border border-cyan-800 mb-2">
          ANNOUNCEMENT
        </span>
        <h2 className="text-xl font-black text-white tracking-tight">{media.contentData?.announcementHeader}</h2>
        <p className="text-sm text-slate-200 mt-2 leading-relaxed">{media.contentData?.announcementBody}</p>
      </div>
    );
  }

  // Slideshow type — render live slideshow with auto-rotation
  if (media.type === 'slideshow') {
    return <SlideshowPlayer mediaUrl={media.url} title={media.title} />;
  }

  return null;
};


// ─── Slideshow Player Component ──────────────────────────────
// Fetches slideshow data from API and renders auto-rotating slides
const SlideshowPlayer: React.FC<{ mediaUrl?: string; title?: string }> = ({ mediaUrl, title }) => {
  const [slides, setSlides] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const { mediaItems } = useSignageStore();

  // Fetch slideshow data
  useEffect(() => {
    if (!mediaUrl) return;
    // mediaUrl = "/api/slideshows/sld-xxx"
    const fetchSlideshow = async () => {
      try {
        const token = localStorage.getItem('signage_access_token');
        const res = await fetch(mediaUrl, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          setSlides((data.slides || []).sort((a: any, b: any) => a.order - b.order));
        }
      } catch { /* ignore */ }
    };
    fetchSlideshow();
    // Refresh every 60s to pick up changes
    const interval = setInterval(fetchSlideshow, 60000);
    return () => clearInterval(interval);
  }, [mediaUrl]);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const duration = (slides[currentIdx]?.duration || config?.slideDuration || 8) * 1000;
    const timer = setTimeout(() => {
      setCurrentIdx(prev => (prev + 1) % slides.length);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentIdx, slides, config]);

  if (!slides.length) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-center text-slate-500">
          <Presentation className="h-8 w-8 mx-auto mb-2 text-amber-400" />
          <p className="text-xs">{title || 'Loading slideshow...'}</p>
        </div>
      </div>
    );
  }

  const slide = slides[currentIdx];
  const bgUrl = slide?.media?.url || slide?.media?.thumbnailUrl || slide?.backgroundUrl ||
    (slide?.mediaId ? (mediaItems.find(m => m.id === slide.mediaId)?.url || mediaItems.find(m => m.id === slide.mediaId)?.thumbnailUrl) : '') || '';
  const accentColor = config?.accentColor || '#F2CA50';
  const fontFamily = config?.titleFont || 'Inter';

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Background Image */}
      {bgUrl && (
        <img src={bgUrl} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: slide?.kenBurns ? 'kenburns 20s ease-in-out infinite' : 'none' }} />
      )}
      {!bgUrl && <div className="absolute inset-0" style={{ backgroundColor: slide?.backgroundColor || '#000' }} />}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${(slide?.overlayOpacity || 40) / 100})` }} />

      {/* Text Content */}
      <div className={`absolute inset-0 p-6 flex flex-col ${
        slide?.textPosition === 'center' ? 'items-center justify-center text-center' :
        slide?.textPosition === 'top-left' ? 'items-start justify-start' :
        slide?.textPosition === 'bottom-center' ? 'items-center justify-end text-center' :
        'items-start justify-end'
      }`}>
        {slide?.subtitleText && (
          <span className="inline-block px-3 py-1 mb-2 border font-bold text-[10px] tracking-widest uppercase rounded-full bg-black/40"
            style={{ borderColor: accentColor, color: accentColor }}>{slide.subtitleText}</span>
        )}
        {slide?.headlineText && (
          <h1 className="font-extrabold text-white uppercase tracking-tight drop-shadow-2xl"
            style={{ fontFamily, fontSize: `${slide.headlineFontSize || 48}px` }}>{slide.headlineText}</h1>
        )}
        {slide?.bodyText && (
          <p className="text-white/80 max-w-lg mt-2 leading-relaxed" style={{ fontSize: `${slide.bodyFontSize || 14}px` }}>{slide.bodyText}</p>
        )}
        {slide?.ctaText && (
          <button className="mt-3 px-5 py-2 rounded-full font-bold text-xs uppercase"
            style={{ backgroundColor: accentColor, color: '#000' }}>{slide.ctaText}</button>
        )}
      </div>

      {/* Progress dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {slides.map((_: any, i: number) => (
            <div key={i} className={`h-1 rounded-full transition-all ${i === currentIdx ? 'bg-amber-400 w-4' : 'bg-white/30 w-1'}`} />
          ))}
        </div>
      )}
    </div>
  );
};
