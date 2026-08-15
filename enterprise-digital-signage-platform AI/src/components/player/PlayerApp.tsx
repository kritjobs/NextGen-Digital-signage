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
  QrCode
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { LayoutZone, MediaItem, Playlist, DigitalScreen } from '../../types/signage';
import { PairingQRCode } from './PairingQRCode';

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

  const playerRef = useRef<HTMLDivElement>(null);

  const activeScreen = screens.find((s) => s.id === playerScreenId) || screens[0];
  const activeEmergency = emergencyAlerts.find((a) => a.active);

  // Active Layout
  const activeLayout = layouts.find((l) => l.id === activeScreen?.currentLayoutId) || layouts[0];

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
            isMuted={activeScreen.isMuted}
            recordProofOfPlay={recordProofOfPlay}
            currentTime={currentTime}
          />
        ))}
      </div>

      {/* 3. SMART TV ON-SCREEN DISPLAY (OSD) & OVERLAY CONTROLS */}
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
  isMuted,
  recordProofOfPlay,
  currentTime
}) => {
  const playlist = playlists.find((p) => p.id === zone.playlistId);
  const items = playlist?.items || [];

  const [currentIndex, setCurrentIndex] = useState(0);

  const activePlaylistItem = items[currentIndex];
  const activeMedia = mediaItems.find((m) => m.id === activePlaylistItem?.mediaId);

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
      {activeMedia ? (
        <MediaRenderer media={activeMedia} isMuted={isMuted} currentTime={currentTime} />
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

  return null;
};
