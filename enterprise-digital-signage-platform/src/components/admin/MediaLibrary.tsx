import React, { useState } from 'react';
import { 
  Film, 
  Image as ImageIcon, 
  Radio, 
  CloudSun, 
  Clock, 
  Plus, 
  Trash2, 
  Search, 
  Tag, 
  ExternalLink,
  Type,
  Maximize2,
  Upload,
  Sparkles,
  Loader2,
  Bot,
  X
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { MediaItem, MediaType } from '../../types/signage';
import { aiApi } from '../../services/api';
import { MediaUploadModal } from './MediaUploadModal';

export const MediaLibrary: React.FC = () => {
  const { t } = useTranslation();
  const { mediaItems, addMediaItem, deleteMediaItem } = useSignageStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTaskType, setAiTaskType] = useState<'text_generation' | 'image_generation'>('text_generation');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ text?: string; imageUrl?: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Add Media Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('image');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(15);
  const [tagsInput, setTagsInput] = useState('corporate, banner');
  const [expiresAt, setExpiresAt] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [fallbackImageUrl, setFallbackImageUrl] = useState('');

  // Widget custom data
  const [tickerText, setTickerText] = useState('Welcome to our Enterprise Campus! Free WiFi: Corp-Guest');
  const [weatherCity, setWeatherCity] = useState('San Francisco, CA');
  const [announcementHeader, setAnnouncementHeader] = useState('EXECUTIVE NOTICE');
  const [announcementBody, setAnnouncementBody] = useState('All staff Townhall scheduled for 3:00 PM today in Main Auditorium.');

  // New Phase 1 widget fields
  const [countdownDate, setCountdownDate] = useState('2026-12-31');
  const [countdownLabel, setCountdownLabel] = useState('Event Starts In');
  const [qrCodeData, setQrCodeData] = useState('https://');
  const [qrCodeLabel, setQrCodeLabel] = useState('Scan to Connect');
  const [promoTitle, setPromoTitle] = useState('SPECIAL OFFER');
  const [promoPrice, setPromoPrice] = useState('฿199');
  const [promoOrigPrice, setPromoOrigPrice] = useState('฿399');
  const [promoDesc, setPromoDesc] = useState('Limited time only!');
  const [webpageUrl, setWebpageUrl] = useState('https://');
  const [kpiValue, setKpiValue] = useState('1,234');
  const [kpiLabel, setKpiLabel] = useState('Total Visitors');
  const [kpiTrend, setKpiTrend] = useState('+12%');
  const [worldClockCities, setWorldClockCities] = useState('Bangkok,Tokyo,London,New York');

  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  const filteredMedia = mediaItems.filter((m) => {
    const matchesQuery = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesQuery && matchesType;
  });

  const handleCreateMedia = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

    let defaultThumb = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80';
    if (type === 'video') defaultThumb = 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80';
    if (type === 'weather') defaultThumb = 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=400&q=80';
    if (type === 'clock') defaultThumb = 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=400&q=80';
    if (type === 'countdown') defaultThumb = 'https://images.unsplash.com/photo-1501139083538-0139583c060f?auto=format&fit=crop&w=400&q=80';
    if (type === 'qrcode') defaultThumb = 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=400&q=80';
    if (type === 'promo') defaultThumb = 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=400&q=80';
    if (type === 'kpi') defaultThumb = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80';
    if (type === 'worldclock') defaultThumb = 'https://images.unsplash.com/photo-1524678714210-9917a6c619c2?auto=format&fit=crop&w=400&q=80';
    if (type === 'webpage') defaultThumb = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80';
    if (url && type === 'image') defaultThumb = url;

    const newMedia: MediaItem = {
      id: 'med-' + Date.now(),
      title: title || 'New Media Asset',
      type,
      url: url || (type === 'video' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : type === 'webpage' ? webpageUrl : ''),
      duration,
      sizeMb: Math.floor(2 + Math.random() * 25),
      tags,
      thumbnailUrl: defaultThumb,
      contentData: {
        tickerText,
        weatherCity,
        announcementHeader,
        announcementBody,
        countdownDate,
        countdownLabel,
        qrCodeData,
        qrCodeLabel,
        promoTitle,
        promoPrice,
        promoOrigPrice,
        promoDesc,
        webUrl: webpageUrl,
        kpiValue,
        kpiLabel,
        kpiTrend,
        worldClockCities,
      },
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      releaseDate: releaseDate ? new Date(releaseDate).toISOString() : undefined,
      fallbackImageUrl,
    };

    addMediaItem(newMedia);
    setIsAddModalOpen(false);
    setTitle('');
    setExpiresAt('');
    setReleaseDate('');
    setFallbackImageUrl('');
  };

  const getMediaIcon = (mediaType: MediaType) => {
    switch (mediaType) {
      case 'video': return <Film className="h-4 w-4 text-purple-400" />;
      case 'image': return <ImageIcon className="h-4 w-4 text-cyan-400" />;
      case 'ticker': return <Radio className="h-4 w-4 text-emerald-400" />;
      case 'weather': return <CloudSun className="h-4 w-4 text-amber-400" />;
      case 'clock': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'announcement': return <Type className="h-4 w-4 text-rose-400" />;
      default: return <Film className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Film className="h-5 w-5 text-cyan-400" />
            <span>{t('ml.title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('ml.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4" />
            <span>{t('ml.aiCreate')}</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>{t('ml.uploadFiles')}</span>
          </button>
          <button
            id="btn-add-media"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('ml.addMedia')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder={t('ml.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="all">{t('ml.allTypes', { count: mediaItems.length })}</option>
          <option value="video">{t('ml.typeVideos')}</option>
          <option value="image">{t('ml.typeImages')}</option>
          <option value="ticker">{t('ml.typeTickers')}</option>
          <option value="weather">{t('ml.typeWeather')}</option>
          <option value="clock">{t('ml.typeClock')}</option>
          <option value="announcement">{t('ml.typeAnnouncements')}</option>
        </select>
      </div>

      {/* Media Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMedia.map((m) => (
          <div 
            key={m.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between group"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-slate-950 overflow-hidden">
              {m.type === 'video' && m.url ? (
                <video 
                  src={m.url} 
                  muted 
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
                />
              ) : (
                <img 
                  src={m.thumbnailUrl || m.url || `https://placehold.co/400x225/0f172a/64748b?text=${encodeURIComponent(m.type.toUpperCase())}`} 
                  alt={m.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/400x225/0f172a/64748b?text=${encodeURIComponent(m.type.toUpperCase())}`; }}
                />
              )}

              <div className="absolute top-2 left-2 flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur border border-slate-700 text-[10px] font-bold text-white uppercase">
                {getMediaIcon(m.type)}
                <span className="ml-1">{m.type}</span>
              </div>

              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-400">
                {m.duration}s
              </div>

              <button
                onClick={() => setPreviewMedia(m)}
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 text-white text-xs font-bold"
              >
                <Maximize2 className="h-4 w-4 text-cyan-400" />
                <span>{t('ml.preview')}</span>
              </button>
            </div>

            {/* Info */}
            <div className="p-3.5 space-y-2">
              <h3 className="font-bold text-white text-xs line-clamp-1">{m.title}</h3>

              <div className="flex flex-wrap gap-1">
                {m.tags.map((t) => (
                  <span key={t} className="text-[9px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-3.5 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>{m.sizeMb} MB</span>
              <div className="flex items-center space-x-2">
                {m.releaseDate && new Date(m.releaseDate) > new Date() && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-cyan-500/20 text-cyan-300" title={`เปิดตัว: ${new Date(m.releaseDate).toLocaleString()}`}>
                    🔒 {t('ml.embargo')}
                  </span>
                )}
                {m.expiresAt && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                    new Date(m.expiresAt) < new Date() ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {new Date(m.expiresAt) < new Date() ? `⛔ ${t('ml.expired')}` : `⏰ ${new Date(m.expiresAt).toLocaleDateString()}`}
                  </span>
                )}
                <button
                  onClick={() => deleteMediaItem(m.id)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title={t('ml.deleteMedia')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Media Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">{t('ml.addTitle')}</h3>
            <p className="text-xs text-slate-400 mb-4">{t('ml.addSubtitle')}</p>

            <form onSubmit={handleCreateMedia} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">{t('ml.titleField')}</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Welcome Promo 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.assetType')}</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MediaType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <optgroup label={t('ml.catMedia')}>
                      <option value="image">{t('ml.optImage')}</option>
                      <option value="video">{t('ml.optVideo')}</option>
                    </optgroup>
                    <optgroup label={t('ml.catWidgetsTime')}>
                      <option value="clock">{t('ml.optClock')}</option>
                      <option value="worldclock">{t('ml.optWorldClock')}</option>
                      <option value="countdown">{t('ml.optCountdown')}</option>
                    </optgroup>
                    <optgroup label={t('ml.catWidgetsContent')}>
                      <option value="ticker">{t('ml.optTicker')}</option>
                      <option value="announcement">{t('ml.optAnnouncement')}</option>
                      <option value="kpi">{t('ml.optKpi')}</option>
                      <option value="qrcode">{t('ml.optQr')}</option>
                    </optgroup>
                    <optgroup label={t('ml.catWidgetsBusiness')}>
                      <option value="promo">{t('ml.optPromo')}</option>
                      <option value="weather">{t('ml.optWeather')}</option>
                      <option value="webpage">{t('ml.optWebpage')}</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.duration')}</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="text-slate-300 block mb-1">{t('ml.expiration')}</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">{t('ml.autoHide')}</p>
              </div>

              {/* Release Date (Embargo) */}
              <div>
                <label className="text-slate-300 block mb-1">{t('ml.releaseDate')}</label>
                <input
                  type="datetime-local"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                />
                <p className="text-[10px] text-slate-500 mt-1">{t('ml.releaseHint')}</p>
              </div>

              {/* Fallback Image */}
              {(type === 'image' || type === 'video') && (
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.fallbackUrl')}</label>
                  <input
                    type="url"
                    placeholder="https://.../backup.png"
                    value={fallbackImageUrl}
                    onChange={(e) => setFallbackImageUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">แสดงแทนเมื่อสื่อหลักโหลดไม่ได้ (กันจอดำ)</p>
                </div>
              )}

              {(type === 'image' || type === 'video') && (
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.directUrl')}</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-[11px]"
                  />
                </div>
              )}

              {type === 'ticker' && (
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.tickerText')}</label>
                  <textarea
                    rows={2}
                    value={tickerText}
                    onChange={(e) => setTickerText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              )}

              {type === 'weather' && (
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.cityName')}</label>
                  <input
                    type="text"
                    value={weatherCity}
                    onChange={(e) => setWeatherCity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                  />
                </div>
              )}

              {type === 'announcement' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-300 block mb-1">{t('ml.headline')}</label>
                    <input
                      type="text"
                      value={announcementHeader}
                      onChange={(e) => setAnnouncementHeader(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">{t('ml.bodyText')}</label>
                    <textarea
                      rows={2}
                      value={announcementBody}
                      onChange={(e) => setAnnouncementBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {type === 'countdown' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-300 block mb-1">{t('ml.targetDate')}</label>
                    <input type="datetime-local" value={countdownDate} onChange={(e) => setCountdownDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">{t('ml.labelText')}</label>
                    <input type="text" value={countdownLabel} onChange={(e) => setCountdownLabel(e.target.value)}
                      placeholder="e.g. Grand Opening In..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                  </div>
                </div>
              )}

              {type === 'qrcode' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-slate-300 block mb-1">{t('ml.qrData')}</label>
                    <input type="text" value={qrCodeData} onChange={(e) => setQrCodeData(e.target.value)}
                      placeholder="https://yoursite.com or WiFi:SSID"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]" />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">{t('ml.displayLabel')}</label>
                    <input type="text" value={qrCodeLabel} onChange={(e) => setQrCodeLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                  </div>
                </div>
              )}

              {type === 'promo' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.promoTitle')}</label>
                      <input type="text" value={promoTitle} onChange={(e) => setPromoTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.description')}</label>
                      <input type="text" value={promoDesc} onChange={(e) => setPromoDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.salePrice')}</label>
                      <input type="text" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)}
                        placeholder="฿199"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-lg font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.originalPrice')}</label>
                      <input type="text" value={promoOrigPrice} onChange={(e) => setPromoOrigPrice(e.target.value)}
                        placeholder="฿399"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white line-through opacity-60" />
                    </div>
                  </div>
                </div>
              )}

              {type === 'kpi' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.value')}</label>
                      <input type="text" value={kpiValue} onChange={(e) => setKpiValue(e.target.value)}
                        placeholder="1,234"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-lg font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.label')}</label>
                      <input type="text" value={kpiLabel} onChange={(e) => setKpiLabel(e.target.value)}
                        placeholder="Total Sales"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                    </div>
                    <div>
                      <label className="text-slate-300 block mb-1">{t('ml.trend')}</label>
                      <input type="text" value={kpiTrend} onChange={(e) => setKpiTrend(e.target.value)}
                        placeholder="+12%"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {type === 'worldclock' && (
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.cities')}</label>
                  <input type="text" value={worldClockCities} onChange={(e) => setWorldClockCities(e.target.value)}
                    placeholder="Bangkok,Tokyo,London,New York"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white" />
                  <p className="text-[10px] text-slate-500 mt-1">{t('ml.citiesHint')}</p>
                </div>
              )}

              {type === 'webpage' && (
                <div>
                  <label className="text-slate-300 block mb-1">{t('ml.webUrl')}</label>
                  <input type="url" value={webpageUrl} onChange={(e) => setWebpageUrl(e.target.value)}
                    placeholder="https://dashboard.example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-[11px]" />
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1">{t('ml.tags')}</label>
                <input
                  type="text"
                  placeholder="lobby, corporate, 2026"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  {t('ml.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white shadow-lg"
                >
                  {t('ml.addMediaSubmit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Preview Media Asset */}
      {previewMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">{previewMedia.title}</h3>
              <button onClick={() => setPreviewMedia(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center">
              {previewMedia.type === 'video' ? (
                <video src={previewMedia.url} controls autoPlay className="w-full h-full object-contain" />
              ) : previewMedia.type === 'image' ? (
                <img src={previewMedia.url || previewMedia.thumbnailUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="p-6 text-center space-y-2 bg-gradient-to-tr from-slate-900 to-indigo-950 w-full h-full flex flex-col justify-center">
                  <span className="text-cyan-400 font-bold uppercase">{t('ml.widgetPreview', { type: previewMedia.type })}</span>
                  <p className="text-sm text-slate-200 font-semibold">{previewMedia.contentData?.announcementHeader || previewMedia.contentData?.weatherCity || previewMedia.contentData?.tickerText}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setPreviewMedia(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">
                {t('ml.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Files */}
      <MediaUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {/* Modal: AI Create */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-bold">{t('ml.aiGenerator')}</h3>
              </div>
              <button onClick={() => { setIsAiModalOpen(false); setAiResult(null); setAiError(null); }} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Task Type */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t('ml.genType')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setAiTaskType('text_generation')}
                    className={`p-3 rounded-xl border text-left ${aiTaskType === 'text_generation' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                    <span className="font-bold text-white block">{t('ml.textContent')}</span>
                    <span className="text-[10px] text-slate-400">{t('ml.genText')}</span>
                  </button>
                  <button onClick={() => setAiTaskType('image_generation')}
                    className={`p-3 rounded-xl border text-left ${aiTaskType === 'image_generation' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                    <span className="font-bold text-white block">{t('ml.imagePoster')}</span>
                    <span className="text-[10px] text-slate-400">{t('ml.genVisual')}</span>
                  </button>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t('ml.genPrompt')}</label>
                <textarea rows={3} value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={aiTaskType === 'text_generation'
                    ? 'e.g. Write a school announcement about upcoming sports day event in Thai...'
                    : 'e.g. Modern minimalist digital signage poster for cafeteria lunch menu...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500" />
              </div>

              {/* Generate Button */}
              <button onClick={async () => {
                if (!aiPrompt.trim()) return;
                setIsAiGenerating(true); setAiResult(null); setAiError(null);
                try {
                  const res = await aiApi.generate(aiTaskType, aiPrompt);
                  if (res.success) setAiResult({ text: res.text, imageUrl: res.imageUrl });
                  else setAiError(res.error || 'Generation failed');
                } catch (e: any) { setAiError(e.message); }
                setIsAiGenerating(false);
              }} disabled={isAiGenerating || !aiPrompt.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {isAiGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('ml.generating')}</> : <><Sparkles className="h-4 w-4" /> {t('ml.generateWithAi')}</>}
              </button>

              {/* Error */}
              {aiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">{aiError}</div>
              )}

              {/* Result */}
              {aiResult && (
                <div className="space-y-3 p-3 bg-slate-950 border border-slate-700 rounded-xl">
                  <span className="text-[10px] text-purple-400 font-bold uppercase">{t('ml.aiResult')}</span>
                  {aiResult.text && <p className="text-sm text-white whitespace-pre-wrap">{aiResult.text}</p>}
                  {aiResult.imageUrl && <img src={aiResult.imageUrl} alt="AI Generated" className="w-full rounded-lg" />}
                  <button onClick={() => {
                    // Add to Media Library
                    const newMedia: MediaItem = {
                      id: 'med-ai-' + Date.now(),
                      title: aiPrompt.slice(0, 50) + (aiPrompt.length > 50 ? '...' : ''),
                      type: aiResult.imageUrl ? 'image' : 'announcement',
                      url: aiResult.imageUrl || '',
                      duration: 15,
                      sizeMb: 0,
                      tags: ['ai-generated'],
                      thumbnailUrl: aiResult.imageUrl || '',
                      contentData: aiResult.text ? { announcementHeader: 'AI Generated', announcementBody: aiResult.text } : undefined,
                      createdAt: new Date().toISOString(),
                    };
                    addMediaItem(newMedia);
                    setIsAiModalOpen(false); setAiResult(null); setAiPrompt('');
                  }} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs">
                    {t('ml.addToLibrary')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
