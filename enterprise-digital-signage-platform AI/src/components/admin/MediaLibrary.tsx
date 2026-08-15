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
  Sparkles,
  Wand2,
  Power
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { MediaItem, MediaType } from '../../types/signage';

export const MediaLibrary: React.FC = () => {
  const { mediaItems, addMediaItem, deleteMediaItem, isAiEnabled } = useSignageStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Add Media Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MediaType>('image');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState(15);
  const [tagsInput, setTagsInput] = useState('corporate, banner');

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiAssetType, setAiAssetType] = useState<'announcement' | 'ticker' | 'poster'>('announcement');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiGeneratedText, setAiGeneratedText] = useState('');
  const [aiGeneratedImg, setAiGeneratedImg] = useState('');

  // Widget custom data
  const [tickerText, setTickerText] = useState('Welcome to our Enterprise Campus! Free WiFi: Corp-Guest');
  const [weatherCity, setWeatherCity] = useState('San Francisco, CA');
  const [announcementHeader, setAnnouncementHeader] = useState('EXECUTIVE NOTICE');
  const [announcementBody, setAnnouncementBody] = useState('All staff Townhall scheduled for 3:00 PM today in Main Auditorium.');

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
    if (url && type === 'image') defaultThumb = url;

    const newMedia: MediaItem = {
      id: 'med-' + Date.now(),
      title: title || 'New Media Asset',
      type,
      url: url || (type === 'video' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : ''),
      duration,
      sizeMb: Math.floor(2 + Math.random() * 25),
      tags,
      thumbnailUrl: defaultThumb,
      contentData: {
        tickerText,
        weatherCity,
        announcementHeader,
        announcementBody
      },
      createdAt: new Date().toISOString()
    };

    addMediaItem(newMedia);
    setIsAddModalOpen(false);
    setTitle('');
  };

  const handleGenerateAiContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setIsGeneratingAi(true);
    setAiGeneratedText('');
    setAiGeneratedImg('');

    try {
      if (aiAssetType === 'poster') {
        const res = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'image', prompt: aiPrompt })
        });
        const data = await res.json();
        if (data.success && data.imageUrl) {
          setAiGeneratedImg(data.imageUrl);
        } else {
          setAiGeneratedImg('https://images.unsplash.com/photo-1542744094-3a31b272c390?auto=format&fit=crop&w=800&q=80');
        }
      } else {
        const res = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            mode: 'text', 
            prompt: `Generate ${aiAssetType === 'ticker' ? 'a single scrolling news ticker headline' : 'a catchy digital signage title and short body paragraph'} for: ${aiPrompt}`,
            systemInstruction: 'You are an expert digital signage copywriter. Output clean, engaging, concise display text.'
          })
        });
        const data = await res.json();
        if (data.success && data.text) {
          setAiGeneratedText(data.text);
        } else {
          setAiGeneratedText(`✨ AI Generated ${aiAssetType.toUpperCase()}: ${aiPrompt}`);
        }
      }
    } catch (err) {
      setAiGeneratedText(`✨ AI Generated: ${aiPrompt}`);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveAiAsset = () => {
    let newMedia: MediaItem;
    if (aiAssetType === 'poster') {
      newMedia = {
        id: 'med-ai-' + Date.now(),
        title: 'AI Poster: ' + (aiPrompt.slice(0, 24) || 'Generated Poster'),
        type: 'image',
        url: aiGeneratedImg || 'https://images.unsplash.com/photo-1542744094-3a31b272c390?auto=format&fit=crop&w=800&q=80',
        duration: 15,
        sizeMb: 4,
        tags: ['ai-generated', 'poster', 'gemini'],
        thumbnailUrl: aiGeneratedImg || 'https://images.unsplash.com/photo-1542744094-3a31b272c390?auto=format&fit=crop&w=800&q=80',
        createdAt: new Date().toISOString()
      };
    } else if (aiAssetType === 'ticker') {
      newMedia = {
        id: 'med-ai-' + Date.now(),
        title: 'AI Ticker: ' + (aiPrompt.slice(0, 24) || 'Generated Ticker'),
        type: 'ticker',
        url: '',
        duration: 10,
        sizeMb: 1,
        tags: ['ai-generated', 'ticker'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1504386106331-3e4e71712b38?auto=format&fit=crop&w=400&q=80',
        contentData: {
          tickerText: aiGeneratedText || aiPrompt
        },
        createdAt: new Date().toISOString()
      };
    } else {
      const parts = (aiGeneratedText || aiPrompt).split('\n');
      const header = parts[0] || 'AI Announcement';
      const body = parts.slice(1).join(' ') || aiPrompt;
      newMedia = {
        id: 'med-ai-' + Date.now(),
        title: 'AI Notice: ' + (aiPrompt.slice(0, 24) || 'Generated Notice'),
        type: 'announcement',
        url: '',
        duration: 15,
        sizeMb: 2,
        tags: ['ai-generated', 'announcement'],
        thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
        contentData: {
          announcementHeader: header,
          announcementBody: body
        },
        createdAt: new Date().toISOString()
      };
    }

    addMediaItem(newMedia);
    setIsAiModalOpen(false);
    setAiPrompt('');
    setAiGeneratedText('');
    setAiGeneratedImg('');
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
            <span>Digital Media Asset Library</span>
          </h2>
          <p className="text-xs text-slate-400">Manage 4K video clips, high-res posters, tickers, and interactive widgets</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* AI Content Creator Button */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
              isAiEnabled 
                ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-cyan-600/30' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Sparkles className={`h-4 w-4 ${isAiEnabled ? 'text-cyan-300 animate-pulse' : 'text-slate-500'}`} />
            <span>AI Content Creator</span>
            {!isAiEnabled && <span className="text-[10px] text-slate-500 font-normal">(OFF)</span>}
          </button>

          <button
            id="btn-add-media"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Media Asset</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search title, tag..."
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
          <option value="all">All Media Types ({mediaItems.length})</option>
          <option value="video">Videos</option>
          <option value="image">Images / Posters</option>
          <option value="ticker">RSS News Tickers</option>
          <option value="weather">Weather Widgets</option>
          <option value="clock">Clock Widgets</option>
          <option value="announcement">Announcements</option>
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
              <img 
                src={m.thumbnailUrl} 
                alt={m.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

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
                <span>Preview</span>
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
              <button
                onClick={() => deleteMediaItem(m.id)}
                className="text-slate-500 hover:text-rose-400 p-1"
                title="Delete Media"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Media Item */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add Media Asset to Library</h3>
            <p className="text-xs text-slate-400 mb-4">Add high-definition video, image, ticker, or smart widget</p>

            <form onSubmit={handleCreateMedia} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Media Asset Title</label>
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
                  <label className="text-slate-300 block mb-1">Asset Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MediaType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="image">Image / Poster</option>
                    <option value="video">HD Video MP4</option>
                    <option value="ticker">RSS News Ticker</option>
                    <option value="weather">Weather Widget</option>
                    <option value="clock">Clock Widget</option>
                    <option value="announcement">Announcement Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Duration (Seconds)</label>
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

              {(type === 'image' || type === 'video') && (
                <div>
                  <label className="text-slate-300 block mb-1">Direct Media URL</label>
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
                  <label className="text-slate-300 block mb-1">Scrolling News Ticker Text</label>
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
                  <label className="text-slate-300 block mb-1">Location City Name</label>
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
                    <label className="text-slate-300 block mb-1">Headline</label>
                    <input
                      type="text"
                      value={announcementHeader}
                      onChange={(e) => setAnnouncementHeader(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Body Text</label>
                    <textarea
                      rows={2}
                      value={announcementBody}
                      onChange={(e) => setAnnouncementBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1">Tags (Comma Separated)</label>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white shadow-lg"
                >
                  Add Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Content Creator */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">AI Signage Content Generator</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {!isAiEnabled ? (
              <div className="p-4 bg-amber-950/50 border border-amber-800/60 rounded-xl space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <Power className="h-4 w-4" />
                  <span>AI Features Are Currently Turned OFF</span>
                </div>
                <p className="text-amber-200/80">
                  You can toggle the master AI Assistant switch ON in the top navigation bar to activate AI media generation and layout tools.
                </p>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="mt-2 px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateAiContent} className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Output Asset Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAiAssetType('announcement')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        aiAssetType === 'announcement'
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      📢 Notice Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiAssetType('ticker')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        aiAssetType === 'ticker'
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      📻 Ticker Line
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiAssetType('poster')}
                      className={`py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                        aiAssetType === 'poster'
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      🖼️ AI Poster
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Prompt / Topic Description</label>
                  <textarea
                    rows={3}
                    placeholder={
                      aiAssetType === 'poster'
                        ? 'e.g. Modern high-tech 4K promo poster for Cloud Tech Summit 2026 with sleek blue geometry'
                        : 'e.g. Flash 50% discount on Mocha & Cappuccino between 2 PM and 4 PM today'
                    }
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingAi || !aiPrompt}
                  className={`w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center space-x-2 shadow-lg ${
                    isGeneratingAi 
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed' 
                      : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                  }`}
                >
                  <Wand2 className={`h-4 w-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Gemini Generating Asset...' : 'Generate Asset'}</span>
                </button>

                {aiGeneratedText && (
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold">Generated Copy text:</span>
                    <p className="text-xs text-white whitespace-pre-wrap">{aiGeneratedText}</p>
                  </div>
                )}

                {aiGeneratedImg && (
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-center">
                    <span className="text-[10px] text-cyan-400 font-mono uppercase font-bold block">Generated Poster Image:</span>
                    <img src={aiGeneratedImg} alt="AI Generated" className="w-full max-h-48 object-cover rounded-lg" />
                  </div>
                )}

                {(aiGeneratedText || aiGeneratedImg) && (
                  <button
                    type="button"
                    onClick={handleSaveAiAsset}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                  >
                    💾 Save AI Asset to Library
                  </button>
                )}
              </form>
            )}
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
                  <span className="text-cyan-400 font-bold uppercase">{previewMedia.type} WIDGET PREVIEW</span>
                  <p className="text-sm text-slate-200 font-semibold">{previewMedia.contentData?.announcementHeader || previewMedia.contentData?.weatherCity || previewMedia.contentData?.tickerText}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setPreviewMedia(null)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
