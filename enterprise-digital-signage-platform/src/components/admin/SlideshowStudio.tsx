/**
 * Slideshow Studio Pro — 3-Panel Layout
 * Left: Tools + Slide List + Active Effects
 * Center: Canvas Preview + Timeline
 * Right: Theme Gallery
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Presentation, Plus, Trash2, Eye, Save, X, Search, Check,
  Image as ImageIcon, Type, Music, Wand2, Layers, Play, Pause,
  GripVertical, ChevronUp, ChevronDown, Sparkles, Layout,
  Clock, Palette, ZoomIn, ZoomOut
} from 'lucide-react';
import { slideshowApi } from '../../services/api';
import { aiApi } from '../../services/api';
import { useSignageStore } from '../../store/useSignageStore';

// ─── Theme Presets with Preview Images ──────────────────────
const THEME_PRESETS = [
  { id: 'luxury-gold', name: 'Obsidian & Gold', category: 'Luxury', accentColor: '#F2CA50', titleFont: 'Playfair Display', transition: 'kenburns', overlayOpacity: 50, previewImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', description: 'Elegant premium feel with golden accents' },
  { id: 'grand-atrium', name: 'Grand Atrium', category: 'Luxury', accentColor: '#E9C349', titleFont: 'Playfair Display', transition: 'fade', overlayOpacity: 45, previewImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80', description: 'Refined elegance for hospitality' },
  { id: 'corporate-blue', name: 'Executive Modern', category: 'Corporate', accentColor: '#38BDF8', titleFont: 'Inter', transition: 'fade', overlayOpacity: 40, previewImage: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=400&q=80', description: 'Clean professional look' },
  { id: 'neon-nights', name: 'Neon Nights', category: 'Vibrant', accentColor: '#EC4899', titleFont: 'Inter', transition: 'slide', overlayOpacity: 55, previewImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400&q=80', description: 'High-impact nightclub visuals' },
  { id: 'flash-sale', name: 'Flash Sale', category: 'Vibrant', accentColor: '#F59E0B', titleFont: 'Inter', transition: 'zoom', overlayOpacity: 35, previewImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=400&q=80', description: 'Urgency-driven retail layouts' },
  { id: 'nature-fresh', name: 'Nature Fresh', category: 'Corporate', accentColor: '#22C55E', titleFont: 'Inter', transition: 'kenburns', overlayOpacity: 30, previewImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80', description: 'Calm organic aesthetic' },
  { id: 'ivory-silk', name: 'Ivory Silk', category: 'Luxury', accentColor: '#F2CA50', titleFont: 'Playfair Display', transition: 'fade', overlayOpacity: 40, previewImage: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=400&q=80', description: 'Minimalist luxury elegance' },
  { id: 'sunset-warm', name: 'Sunset Warm', category: 'Vibrant', accentColor: '#F97316', titleFont: 'Inter', transition: 'zoom', overlayOpacity: 35, previewImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400&q=80', description: 'Warm inviting tones' },
];

interface SlideData {
  id: string; order: number; mediaId: string | null;
  backgroundUrl: string | null; backgroundColor: string;
  headlineText: string | null; subtitleText: string | null;
  bodyText: string | null; ctaText: string | null;
  textPosition: string; textColor: string; overlayOpacity: number;
  duration: number | null; transition: string | null;
  kenBurns: boolean; parallax: boolean;
  headlineFontSize?: number; // px
  bodyFontSize?: number;     // px
  media?: any;
}

interface SlideshowData {
  id: string; title: string; description: string;
  transition: string; slideDuration: number;
  autoPlay: boolean; loop: boolean; accentColor: string;
  titleFont: string; status: string; slides: SlideData[]; tags: string[];
}

type ToolTab = 'slides' | 'text' | 'effects' | 'layout';
type ThemeCategory = 'All' | 'Luxury' | 'Corporate' | 'Vibrant';

// ─── Dynamic Google Font Loader ─────────────────────────────
const loadedFonts = new Set<string>();
function loadGoogleFont(fontName: string) {
  if (loadedFonts.has(fontName)) return;
  loadedFonts.add(fontName);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700;800&display=swap`;
  document.head.appendChild(link);
}
// Pre-load default fonts
['Inter', 'Playfair Display', 'Noto Sans Thai', 'Kanit', 'Prompt', 'Noto Sans SC'].forEach(loadGoogleFont);


export const SlideshowStudio: React.FC = () => {
  const { mediaItems } = useSignageStore();
  const [slideshows, setSlideshows] = useState<SlideshowData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<ToolTab>('slides');
  const [themeCategory, setThemeCategory] = useState<ThemeCategory>('All');
  const [editingSlideIndex, setEditingSlideIndex] = useState<number>(0);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAiSlideOpen, setIsAiSlideOpen] = useState(false);
  const [aiSlidePrompt, setAiSlidePrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiSlideResult, setAiSlideResult] = useState<string | null>(null);
  const [isAiImagePromptOpen, setIsAiImagePromptOpen] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');

  const activeSlideshow = slideshows.find(s => s.id === selectedId) || null;
  const activeSlide = activeSlideshow?.slides[editingSlideIndex] || null;

  // Effects state
  const [effects, setEffects] = useState({ kenBurns: true, parallax: false });

  useEffect(() => { loadSlideshows(); }, []);

  const loadSlideshows = async () => {
    try {
      setIsLoading(true);
      const res = await slideshowApi.getAll();
      setSlideshows(res.data || []);
      if (res.data?.length && !selectedId) setSelectedId(res.data[0].id);
    } catch {}
    setIsLoading(false);
  };

  const handleCreate = async () => {
    const id = `sld-${Date.now()}`;
    const data = { id, title: 'New Slideshow', description: '', transition: 'kenburns', slideDuration: 8, autoPlay: true, loop: true, accentColor: '#F2CA50', titleFont: 'Playfair Display', status: 'draft', slides: [], tags: [] };
    try { await slideshowApi.create(data); setSlideshows(prev => [{ ...data, slides: [] }, ...prev]); setSelectedId(id); } catch {}
  };

  const autoSave = useCallback(async (data: SlideshowData) => {
    setIsSaving(true);
    try { await slideshowApi.update(data.id, { ...data, slideCount: data.slides.length, totalDuration: data.slides.reduce((s, sl) => s + (sl.duration || data.slideDuration), 0) }); } catch {}
    setTimeout(() => setIsSaving(false), 500);
  }, []);

  const updateSlideshow = (partial: Partial<SlideshowData>) => {
    if (!activeSlideshow) return;
    const updated = { ...activeSlideshow, ...partial };
    setSlideshows(prev => prev.map(s => s.id === updated.id ? updated : s));
    autoSave(updated);
  };

  const addSlide = (mediaId?: string) => {
    if (!activeSlideshow) return;
    const media = mediaId ? mediaItems.find(m => m.id === mediaId) : null;
    const newSlide: SlideData = { id: `sls-${Date.now()}-${Math.random().toString(36).slice(2,5)}`, order: activeSlideshow.slides.length + 1, mediaId: mediaId || null, backgroundUrl: null, backgroundColor: '#000', headlineText: null, subtitleText: null, bodyText: null, ctaText: null, textPosition: 'bottom-left', textColor: '#FFFFFF', overlayOpacity: activeSlideshow.slides.length === 0 ? 50 : 40, duration: null, transition: null, kenBurns: effects.kenBurns, parallax: effects.parallax, media };
    const slides = [...activeSlideshow.slides, newSlide];
    updateSlideshow({ slides });
    setEditingSlideIndex(slides.length - 1);
  };

  const removeSlide = (idx: number) => {
    if (!activeSlideshow) return;
    const slides = activeSlideshow.slides.filter((_, i) => i !== idx);
    slides.forEach((s, i) => { s.order = i + 1; });
    updateSlideshow({ slides });
    if (editingSlideIndex >= slides.length) setEditingSlideIndex(Math.max(0, slides.length - 1));
  };

  const moveSlide = (idx: number, dir: 'up' | 'down') => {
    if (!activeSlideshow) return;
    const slides = [...activeSlideshow.slides];
    const t = dir === 'up' ? idx - 1 : idx + 1;
    if (t < 0 || t >= slides.length) return;
    [slides[idx], slides[t]] = [slides[t], slides[idx]];
    slides.forEach((s, i) => { s.order = i + 1; });
    updateSlideshow({ slides });
    setEditingSlideIndex(t);
  };

  const updateSlide = (idx: number, partial: Partial<SlideData>) => {
    if (!activeSlideshow) return;
    const slides = activeSlideshow.slides.map((s, i) => i === idx ? { ...s, ...partial } : s);
    updateSlideshow({ slides });
  };

  const applyTheme = (theme: typeof THEME_PRESETS[0]) => {
    updateSlideshow({ accentColor: theme.accentColor, titleFont: theme.titleFont, transition: theme.transition });
    // Apply overlay to all slides
    if (activeSlideshow) {
      const slides = activeSlideshow.slides.map(s => ({ ...s, overlayOpacity: theme.overlayOpacity }));
      updateSlideshow({ slides, accentColor: theme.accentColor, titleFont: theme.titleFont, transition: theme.transition });
    }
  };

  const handlePublish = async () => {
    if (!activeSlideshow || activeSlideshow.slides.length === 0) return;
    try { await slideshowApi.publish(activeSlideshow.id); updateSlideshow({ status: 'published' }); } catch {}
  };

  const getSlideThumb = (slide: SlideData): string => {
    if (slide.media?.thumbnailUrl) return slide.media.thumbnailUrl;
    if (slide.media?.url) return slide.media.url;
    if (slide.backgroundUrl) return slide.backgroundUrl;
    if (slide.mediaId) { const m = mediaItems.find(mi => mi.id === slide.mediaId); return m?.thumbnailUrl || m?.url || ''; }
    return '';
  };

  const filteredThemes = themeCategory === 'All' ? THEME_PRESETS : THEME_PRESETS.filter(t => t.category === themeCategory);
  const filteredPickerMedia = mediaItems.filter(m => (m.type === 'image' || m.type === 'video') && m.title.toLowerCase().includes(pickerSearch.toLowerCase()));

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;


  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -mx-4 sm:-mx-6 lg:-mx-8 -my-6 overflow-hidden bg-slate-950">
      {/* ─── TOP BAR ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-white/10 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Presentation className="h-5 w-5 text-amber-400" />
          <span className="font-bold text-sm text-white">Slideshow Studio</span>
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded">Pro</span>
          {isSaving && <span className="text-[10px] text-slate-400 animate-pulse"><Save className="h-3 w-3 inline" /> Saving...</span>}
        </div>
        <div className="flex items-center gap-2">
          <select value={selectedId || ''} onChange={(e) => { setSelectedId(e.target.value); setEditingSlideIndex(0); }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white">
            {slideshows.map(s => <option key={s.id} value={s.id}>{s.title} ({s.slides?.length || 0})</option>)}
          </select>
          <button onClick={handleCreate} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg"><Plus className="h-3 w-3 inline" /> New</button>
          <button onClick={() => setIsPreviewOpen(true)} disabled={!activeSlideshow?.slides?.length}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg disabled:opacity-30"><Play className="h-3 w-3 inline" /> Preview</button>
          <button onClick={() => setIsAiSlideOpen(true)}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg"><Wand2 className="h-3 w-3 inline" /> AI Write</button>
          <button onClick={handlePublish} disabled={!activeSlideshow?.slides?.length}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg disabled:opacity-30"><Sparkles className="h-3 w-3 inline" /> Publish</button>
        </div>
      </div>

      {activeSlideshow && (
        <div className="flex-1 flex overflow-hidden">
          {/* ═══ LEFT PANEL — Tools + Slides ═══════════════════ */}
          <aside className="w-64 bg-slate-900/80 border-r border-white/10 flex flex-col shrink-0">
            {/* Tool Tabs */}
            <nav className="p-3 space-y-1">
              {([
                { id: 'slides', icon: Layers, label: 'Slides', badge: false },
                { id: 'text', icon: Type, label: 'Text', badge: false },
                { id: 'effects', icon: Wand2, label: 'Effects', badge: true },
                { id: 'layout', icon: Layout, label: 'Layout', badge: false },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab.id ? 'bg-indigo-600/20 text-white border border-indigo-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                  }`}>
                  <span className="flex items-center gap-2.5">
                    <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-400' : 'text-slate-500'}`} />
                    {tab.label}
                  </span>
                  {tab.badge && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f2ca50]" />}
                </button>
              ))}
            </nav>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeTab === 'slides' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-400 font-semibold">{activeSlideshow.slides.length} Slides</span>
                    <button onClick={() => setIsMediaPickerOpen(true)} className="text-[10px] text-amber-400 hover:text-amber-300 font-bold">+ Add</button>
                  </div>
                  {activeSlideshow.slides.map((slide, idx) => (
                    <div key={slide.id} onClick={() => setEditingSlideIndex(idx)}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer transition-all ${
                        editingSlideIndex === idx ? 'border-amber-500 bg-amber-500/5' : 'border-transparent hover:border-slate-700 hover:bg-slate-800/30'
                      }`}>
                      <span className="shrink-0 w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-[9px] font-mono text-cyan-400">{idx+1}</span>
                      <div className="shrink-0 w-12 h-7 rounded overflow-hidden bg-slate-800">
                        {getSlideThumb(slide) ? <img src={getSlideThumb(slide)} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900" />}
                      </div>
                      <span className="flex-1 text-[10px] text-white truncate">{slide.headlineText || `Slide ${idx+1}`}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeSlide(idx); }} className="text-slate-600 hover:text-rose-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {activeSlideshow.slides.length === 0 && (
                    <button onClick={() => setIsMediaPickerOpen(true)} className="w-full py-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 text-xs hover:border-amber-500/50 hover:text-amber-400">
                      <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" /> Add First Slide
                    </button>
                  )}
                </>
              )}

              {activeTab === 'text' && activeSlide && (
                <div className="space-y-3">
                  {/* Font Selector */}
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">Font Family</label>
                    <select value={activeSlideshow.titleFont} onChange={(e) => { updateSlideshow({ titleFont: e.target.value }); loadGoogleFont(e.target.value); }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white">
                      <optgroup label="── English ──">
                        <option value="Inter">Inter (Modern)</option>
                        <option value="Playfair Display">Playfair Display (Luxury)</option>
                        <option value="Montserrat">Montserrat (Clean)</option>
                        <option value="Poppins">Poppins (Friendly)</option>
                        <option value="Oswald">Oswald (Bold)</option>
                        <option value="Raleway">Raleway (Elegant)</option>
                        <option value="Bebas Neue">Bebas Neue (Impact)</option>
                        <option value="Roboto Slab">Roboto Slab (Serif)</option>
                        <option value="Lora">Lora (Classic)</option>
                        <option value="DM Sans">DM Sans (Geometric)</option>
                      </optgroup>
                      <optgroup label="── ไทย (Thai) ──">
                        <option value="Noto Sans Thai">Noto Sans Thai</option>
                        <option value="Sarabun">Sarabun (อ่านง่าย)</option>
                        <option value="Prompt">Prompt (สมัยใหม่)</option>
                        <option value="Kanit">Kanit (หนักแน่น)</option>
                        <option value="Mitr">Mitr (กลม)</option>
                        <option value="Chakra Petch">Chakra Petch (เทค)</option>
                        <option value="Itim">Itim (น่ารัก)</option>
                        <option value="Pridi">Pridi (คลาสสิก)</option>
                        <option value="IBM Plex Sans Thai">IBM Plex Sans Thai</option>
                      </optgroup>
                      <optgroup label="── 中文 (Chinese) ──">
                        <option value="Noto Sans SC">Noto Sans SC (简体)</option>
                        <option value="Noto Sans TC">Noto Sans TC (繁體)</option>
                        <option value="Noto Serif SC">Noto Serif SC (宋体)</option>
                        <option value="ZCOOL XiaoWei">ZCOOL XiaoWei (标题)</option>
                        <option value="Ma Shan Zheng">Ma Shan Zheng (毛笔)</option>
                        <option value="ZCOOL QingKe HuangYou">ZCOOL QingKe (活泼)</option>
                      </optgroup>
                      <optgroup label="── Display / Decorative ──">
                        <option value="Righteous">Righteous</option>
                        <option value="Permanent Marker">Permanent Marker</option>
                        <option value="Pacifico">Pacifico</option>
                        <option value="Abril Fatface">Abril Fatface</option>
                      </optgroup>
                    </select>
                    <p className="text-[9px] text-slate-600 mt-0.5" style={{ fontFamily: activeSlideshow.titleFont }}>
                      Preview: {activeSlideshow.titleFont}
                    </p>
                  </div>

                  {/* Font Size Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Headline Size</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateSlide(editingSlideIndex, { headlineFontSize: Math.max(16, (activeSlide as any).headlineFontSize || 48) - 4 })}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center">−</button>
                        <span className="flex-1 text-center text-[11px] font-mono text-white">{(activeSlide as any).headlineFontSize || 48}px</span>
                        <button onClick={() => updateSlide(editingSlideIndex, { headlineFontSize: Math.min(120, ((activeSlide as any).headlineFontSize || 48) + 4) })}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Body Size</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateSlide(editingSlideIndex, { bodyFontSize: Math.max(10, ((activeSlide as any).bodyFontSize || 14) - 2) })}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center">−</button>
                        <span className="flex-1 text-center text-[11px] font-mono text-white">{(activeSlide as any).bodyFontSize || 14}px</span>
                        <button onClick={() => updateSlide(editingSlideIndex, { bodyFontSize: Math.min(48, ((activeSlide as any).bodyFontSize || 14) + 2) })}
                          className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center">+</button>
                      </div>
                    </div>
                  </div>

                  <div><label className="text-[10px] text-slate-500">Headline</label>
                    <input type="text" value={activeSlide.headlineText || ''} onChange={(e) => updateSlide(editingSlideIndex, { headlineText: e.target.value || null })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5" placeholder="Main title" /></div>
                  <div><label className="text-[10px] text-slate-500">Subtitle</label>
                    <input type="text" value={activeSlide.subtitleText || ''} onChange={(e) => updateSlide(editingSlideIndex, { subtitleText: e.target.value || null })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5" placeholder="Badge text" /></div>
                  <div><label className="text-[10px] text-slate-500">Body</label>
                    <textarea rows={2} value={activeSlide.bodyText || ''} onChange={(e) => updateSlide(editingSlideIndex, { bodyText: e.target.value || null })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5" /></div>
                  <div><label className="text-[10px] text-slate-500">CTA Button</label>
                    <input type="text" value={activeSlide.ctaText || ''} onChange={(e) => updateSlide(editingSlideIndex, { ctaText: e.target.value || null })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white mt-0.5" placeholder="e.g. Discover More" /></div>
                  <div><label className="text-[10px] text-slate-500">Position</label>
                    <select value={activeSlide.textPosition} onChange={(e) => updateSlide(editingSlideIndex, { textPosition: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5">
                      <option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option><option value="center">Center</option><option value="top-left">Top Left</option>
                    </select></div>
                  {/* Text Color */}
                  <div><label className="text-[10px] text-slate-500">Text Color</label>
                    <input type="color" value={activeSlide.textColor} onChange={(e) => updateSlide(editingSlideIndex, { textColor: e.target.value })}
                      className="w-full h-7 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer mt-0.5" /></div>
                </div>
              )}

              {activeTab === 'effects' && (
                <div className="space-y-4">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active FX
                    <span className="text-[9px] text-slate-500 ml-auto">Per slide</span>
                  </div>

                  {/* Animation Effects — Capsule Toggles */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Animation</span>
                    {[
                      { key: 'kenBurns', label: 'Ken Burns Zoom', desc: 'Slow zoom motion', icon: ZoomIn, color: 'amber' },
                      { key: 'parallax', label: 'Parallax Depth', desc: '3D depth effect', icon: Layers, color: 'cyan' },
                    ].map(fx => (
                      <div key={fx.key}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          (effects as any)[fx.key] ? 'bg-indigo-950/60 border-indigo-500/40' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                        onClick={() => { setEffects(p => ({ ...p, [fx.key]: !(p as any)[fx.key] })); if (activeSlide) updateSlide(editingSlideIndex, { [fx.key]: !(effects as any)[fx.key] }); }}>
                        <div className="flex items-center gap-2.5">
                          <fx.icon className={`w-4 h-4 ${(effects as any)[fx.key] ? `text-${fx.color}-400` : 'text-slate-600'}`} />
                          <div>
                            <span className={`text-xs font-semibold block ${(effects as any)[fx.key] ? 'text-white' : 'text-slate-400'}`}>{fx.label}</span>
                            <span className="text-[9px] text-slate-600">{fx.desc}</span>
                          </div>
                        </div>
                        {/* Capsule Toggle */}
                        <div className={`w-10 h-5 rounded-full p-0.5 transition-all ${(effects as any)[fx.key] ? 'bg-amber-400' : 'bg-slate-700'}`}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all ${(effects as any)[fx.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Image Filters */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Image Filters</span>

                    {/* Vignette */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Vignette</span>
                        <div className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all ${(activeSlide as any)?.vignette ? 'bg-cyan-400' : 'bg-slate-700'}`}
                          onClick={() => activeSlide && updateSlide(editingSlideIndex, { vignette: !(activeSlide as any).vignette } as any)}>
                          <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all ${(activeSlide as any)?.vignette ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-600">Dark edges for cinematic look</p>
                    </div>

                    {/* Brightness */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Brightness</span>
                        <span className="text-[10px] font-mono text-slate-500">{(activeSlide as any)?.brightness ?? 100}%</span>
                      </div>
                      <input type="range" min="50" max="150" value={(activeSlide as any)?.brightness ?? 100}
                        onChange={(e) => updateSlide(editingSlideIndex, { brightness: Number(e.target.value) } as any)}
                        className="w-full accent-amber-500 h-1" />
                    </div>

                    {/* Contrast */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Contrast</span>
                        <span className="text-[10px] font-mono text-slate-500">{(activeSlide as any)?.contrast ?? 100}%</span>
                      </div>
                      <input type="range" min="50" max="150" value={(activeSlide as any)?.contrast ?? 100}
                        onChange={(e) => updateSlide(editingSlideIndex, { contrast: Number(e.target.value) } as any)}
                        className="w-full accent-cyan-500 h-1" />
                    </div>

                    {/* Saturation */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Saturation</span>
                        <span className="text-[10px] font-mono text-slate-500">{(activeSlide as any)?.saturation ?? 100}%</span>
                      </div>
                      <input type="range" min="0" max="200" value={(activeSlide as any)?.saturation ?? 100}
                        onChange={(e) => updateSlide(editingSlideIndex, { saturation: Number(e.target.value) } as any)}
                        className="w-full accent-purple-500 h-1" />
                    </div>

                    {/* Blur */}
                    <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300 font-medium">Blur</span>
                        <span className="text-[10px] font-mono text-slate-500">{(activeSlide as any)?.blur ?? 0}px</span>
                      </div>
                      <input type="range" min="0" max="20" value={(activeSlide as any)?.blur ?? 0}
                        onChange={(e) => updateSlide(editingSlideIndex, { blur: Number(e.target.value) } as any)}
                        className="w-full accent-indigo-500 h-1" />
                    </div>
                  </div>

                  {/* Overlay Control */}
                  {activeSlide && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Overlay</span>
                      <div className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-300 font-medium">Darkness</span>
                          <span className="text-[10px] font-mono text-slate-500">{activeSlide.overlayOpacity}%</span>
                        </div>
                        <input type="range" min="0" max="80" value={activeSlide.overlayOpacity}
                          onChange={(e) => updateSlide(editingSlideIndex, { overlayOpacity: Number(e.target.value) })}
                          className="w-full accent-amber-500 h-1" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'layout' && (
                <div className="space-y-3">
                  <div><label className="text-[10px] text-slate-500">Slide Duration (s)</label>
                    <input type="number" min="3" max="60" value={activeSlideshow.slideDuration} onChange={(e) => updateSlideshow({ slideDuration: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono mt-0.5" /></div>
                  <div><label className="text-[10px] text-slate-500">Transition</label>
                    <select value={activeSlideshow.transition} onChange={(e) => updateSlideshow({ transition: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white mt-0.5">
                      <option value="fade">Fade</option><option value="slide">Slide</option><option value="zoom">Zoom</option><option value="kenburns">Ken Burns</option><option value="none">None</option>
                    </select></div>
                  <div><label className="text-[10px] text-slate-500">Accent Color</label>
                    <input type="color" value={activeSlideshow.accentColor} onChange={(e) => updateSlideshow({ accentColor: e.target.value })}
                      className="w-full h-8 rounded-lg border border-slate-700 bg-slate-950 cursor-pointer mt-0.5" /></div>
                </div>
              )}
            </div>
          </aside>


          {/* ═══ CENTER — Canvas + Timeline ═══════════════════ */}
          <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Canvas Preview */}
            <div className="flex-1 p-4 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
              <div className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black">
                {activeSlide ? (
                  <>
                    {/* Background */}
                    <img src={getSlideThumb(activeSlide)} alt=""
                      className={`w-full h-full object-cover ${activeSlide.kenBurns ? 'animate-[kenburns_20s_ease-in-out_infinite]' : ''}`}
                      style={{
                        animationName: activeSlide.kenBurns ? undefined : 'none',
                        filter: `brightness(${(activeSlide as any).brightness ?? 100}%) contrast(${(activeSlide as any).contrast ?? 100}%) saturate(${(activeSlide as any).saturation ?? 100}%) blur(${(activeSlide as any).blur ?? 0}px)`,
                      }} />
                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${activeSlide.overlayOpacity / 100})` }} />
                    {/* Text Content */}
                    <div className={`absolute inset-0 p-6 md:p-10 flex flex-col ${
                      activeSlide.textPosition === 'center' ? 'items-center justify-center text-center' :
                      activeSlide.textPosition === 'top-left' ? 'items-start justify-start' :
                      activeSlide.textPosition === 'bottom-center' ? 'items-center justify-end text-center' :
                      'items-start justify-end'
                    }`}>
                      {activeSlide.subtitleText && (
                        <span className="inline-block px-3 py-1 mb-3 border font-bold text-[10px] tracking-widest uppercase rounded-full backdrop-blur-md bg-black/40"
                          style={{ borderColor: activeSlideshow.accentColor, color: activeSlideshow.accentColor }}>
                          {activeSlide.subtitleText}
                        </span>
                      )}
                      {activeSlide.headlineText && (
                        <h1 className="font-extrabold text-white uppercase tracking-tight drop-shadow-2xl"
                          style={{ fontFamily: activeSlideshow.titleFont, fontSize: `${(activeSlide as any).headlineFontSize || 48}px` }}>{activeSlide.headlineText}</h1>
                      )}
                      {activeSlide.bodyText && <p className="text-white/80 max-w-lg mt-2 leading-relaxed" style={{ fontSize: `${(activeSlide as any).bodyFontSize || 14}px` }}>{activeSlide.bodyText}</p>}
                      {activeSlide.ctaText && (
                        <button className="mt-4 px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg"
                          style={{ backgroundColor: activeSlideshow.accentColor, color: '#0B0F1A' }}>{activeSlide.ctaText}</button>
                      )}
                    </div>
                    {/* Resolution badge */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[10px] font-semibold text-slate-300 border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 16:9 HD
                    </div>

                    {/* Image actions — top left */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <button onClick={() => setIsMediaPickerOpen(true)}
                        className="bg-black/70 backdrop-blur px-2.5 py-1.5 rounded-lg text-[10px] text-white font-semibold border border-white/20 hover:border-cyan-400 hover:text-cyan-400 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" /> Library
                      </button>
                      <button onClick={() => setIsAiImagePromptOpen(true)}
                        className="bg-purple-600/80 backdrop-blur px-2.5 py-1.5 rounded-lg text-[10px] text-white font-semibold border border-purple-400/30 hover:bg-purple-500 flex items-center gap-1 disabled:opacity-50">
                        <Wand2 className="h-3 w-3" /> AI Image
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <Presentation className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">Add slides to see preview</p>
                  </div>
                )}
              </div>
            </div>

            {/* ─── TIMELINE BAR ────────────────────────────── */}
            <div className="h-24 bg-slate-900/90 border-t border-white/10 px-4 py-2 shrink-0">
              <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white">
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <span className="text-[10px] font-mono text-slate-400">
                  {String(Math.floor(editingSlideIndex * (activeSlideshow?.slideDuration || 8) / 60)).padStart(2,'0')}:{String((editingSlideIndex * (activeSlideshow?.slideDuration || 8)) % 60).padStart(2,'0')}
                  <span className="text-slate-600"> / {String(Math.floor((activeSlideshow?.slides.length || 0) * (activeSlideshow?.slideDuration || 8) / 60)).padStart(2,'0')}:{String(((activeSlideshow?.slides.length || 0) * (activeSlideshow?.slideDuration || 8)) % 60).padStart(2,'0')}</span>
                </span>
              </div>
              {/* Track */}
              <div className="flex items-center gap-2">
                <span className="shrink-0 w-16 text-[9px] text-slate-500 font-semibold">Media</span>
                <div className="flex-1 flex gap-0.5 h-8 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative">
                  {activeSlideshow?.slides.map((slide, idx) => {
                    const width = 100 / Math.max(activeSlideshow.slides.length, 1);
                    return (
                      <div key={slide.id} onClick={() => setEditingSlideIndex(idx)}
                        className={`h-full rounded-sm cursor-pointer transition-all flex items-center justify-center overflow-hidden ${
                          editingSlideIndex === idx ? 'ring-2 ring-amber-400 z-10' : 'hover:brightness-125'
                        }`}
                        style={{ width: `${width}%`, backgroundColor: editingSlideIndex === idx ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.2)', borderLeft: '1px solid rgba(99,102,241,0.3)' }}>
                        <span className="text-[8px] text-white/70 truncate px-1">{slide.headlineText || `Slide ${idx+1}`}</span>
                      </div>
                    );
                  })}
                  {/* Playhead */}
                  {activeSlideshow && activeSlideshow.slides.length > 0 && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none shadow-[0_0_4px_#f2ca50]"
                      style={{ left: `${((editingSlideIndex + 0.5) / Math.max(activeSlideshow.slides.length, 1)) * 100}%` }} />
                  )}
                </div>
              </div>
            </div>
          </main>


          {/* ═══ RIGHT PANEL — Theme Gallery ═══════════════════ */}
          <aside className="w-72 bg-slate-900/80 border-l border-white/10 flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">Theme System <Sparkles className="w-3.5 h-3.5 text-amber-400" /></h2>
              <p className="text-[10px] text-amber-300 font-semibold mt-0.5">Browse Premium Styles</p>
            </div>
            {/* Category Tabs */}
            <div className="flex gap-1 px-3 pt-3 pb-2">
              {(['All', 'Luxury', 'Corporate', 'Vibrant'] as ThemeCategory[]).map(cat => (
                <button key={cat} onClick={() => setThemeCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    themeCategory === cat ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white bg-slate-950'
                  }`}>{cat}</button>
              ))}
            </div>
            {/* Theme Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {filteredThemes.map(theme => {
                const isActive = activeSlideshow?.accentColor === theme.accentColor && activeSlideshow?.transition === theme.transition;
                return (
                  <div key={theme.id} onClick={() => applyTheme(theme)}
                    className={`relative rounded-xl overflow-hidden border cursor-pointer transition-all group ${
                      isActive ? 'border-amber-400 shadow-[0_0_15px_rgba(242,202,80,0.3)]' : 'border-white/10 hover:border-amber-400/50'
                    }`}>
                    <div className="h-24 w-full relative overflow-hidden">
                      <img src={theme.previewImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <span className="absolute bottom-2 left-3 font-bold text-xs text-white drop-shadow" style={{ fontFamily: theme.titleFont }}>{theme.name}</span>
                      {isActive && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center"><Check className="h-3 w-3 text-slate-950" /></div>}
                    </div>
                    <div className="p-2 bg-slate-900/90 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{theme.description}</span>
                      <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: theme.accentColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* ═══ Media Picker Modal ══════════════════════════════ */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Select Media for Slide</h3>
              <button onClick={() => setIsMediaPickerOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-3"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input type="text" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} placeholder="Search images..." autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:border-amber-500 focus:outline-none" /></div></div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2">
              {filteredPickerMedia.map(m => (
                <div key={m.id} onClick={() => {
                  if (activeSlide && activeSlideshow) {
                    // Assign to current slide
                    updateSlide(editingSlideIndex, { mediaId: m.id, backgroundUrl: null, media: m as any });
                  } else {
                    addSlide(m.id);
                  }
                  setIsMediaPickerOpen(false);
                }}
                  className="rounded-xl overflow-hidden border border-slate-700 hover:border-amber-400 cursor-pointer group">
                  <div className="aspect-video bg-slate-950">
                    <img src={m.thumbnailUrl || m.url} alt="" className="w-full h-full object-cover" onError={(e) => {(e.target as HTMLImageElement).style.display='none'}} />
                  </div>
                  <div className="p-1.5 bg-slate-900"><p className="text-[9px] text-white truncate">{m.title}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ AI Image Prompt Modal ═══════════════════════════ */}
      {isAiImagePromptOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white">AI Image Generator</h3>
              </div>
              <button onClick={() => setIsAiImagePromptOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Describe the image you want</label>
                <textarea rows={3} value={aiImagePrompt}
                  onChange={(e) => setAiImagePrompt(e.target.value)}
                  placeholder="e.g. ภาพแฮมเบอร์เกอร์สดใหม่บนจานไม้ พื้นหลังร้านอาหารอบอุ่น ไม่มีตัวอักษร"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500" />
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold">💡 Tips:</span>
                <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-3">
                  <li>ระบุ <b className="text-white">"ไม่มีตัวอักษร"</b> หรือ <b className="text-white">"no text"</b> เพื่อไม่ให้มีข้อความในรูป</li>
                  <li>ข้อความจะถูกวาง overlay ทับภายหลังโดยระบบ</li>
                  <li>ระบุสไตล์: ถ่ายภาพจริง, กราฟิก, minimal, cinematic</li>
                </ul>
              </div>

              {activeSlide?.headlineText && (
                <button onClick={() => setAiImagePrompt(`Background image for digital signage about "${activeSlide.headlineText}". No text, no letters, no typography in the image. Professional photo style, 16:9.`)}
                  className="w-full text-left p-2 bg-slate-950 border border-slate-700 rounded-lg text-[11px] text-slate-300 hover:border-purple-500">
                  🪄 Auto-fill จาก headline: "{activeSlide.headlineText?.slice(0, 40)}..."
                </button>
              )}

              <button onClick={async () => {
                if (!aiImagePrompt.trim()) return;
                setIsAiGenerating(true);
                const finalPrompt = aiImagePrompt + (aiImagePrompt.toLowerCase().includes('no text') || aiImagePrompt.includes('ไม่มีตัวอักษร') ? '' : ' Do NOT include any text or typography in the image.');
                try {
                  const res = await aiApi.generate('image_generation', finalPrompt);
                  if (res.success && res.imageUrl) {
                    // Save base64 as file via upload API (to persist)
                    let savedUrl = res.imageUrl;
                    if (res.imageUrl.startsWith('data:')) {
                      try {
                        const blob = await fetch(res.imageUrl).then(r => r.blob());
                        const file = new File([blob], `ai-gen-${Date.now()}.png`, { type: 'image/png' });
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('title', `AI: ${aiImagePrompt.slice(0, 50)}`);
                        formData.append('duration', '15');
                        const token = localStorage.getItem('signage_access_token');
                        const uploadRes = await fetch('/api/media/upload', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` },
                          body: formData,
                        });
                        if (uploadRes.ok) {
                          const uploadData = await uploadRes.json();
                          savedUrl = uploadData.media?.url || uploadData.file?.storedUrl || res.imageUrl;
                        }
                      } catch { /* fallback to base64 */ }
                    }
                    updateSlide(editingSlideIndex, { backgroundUrl: savedUrl, mediaId: null });
                    setIsAiImagePromptOpen(false); setAiImagePrompt('');
                  } else { alert(res.error || 'Image generation failed.'); }
                } catch (e: any) { alert('Error: ' + e.message); }
                setIsAiGenerating(false);
              }} disabled={isAiGenerating || !aiImagePrompt.trim()}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {isAiGenerating ? <><Clock className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Image</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ AI Slide Writer Modal ════════════════════════════ */}
      {isAiSlideOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white">AI Slide Writer</h3>
              </div>
              <button onClick={() => { setIsAiSlideOpen(false); setAiSlideResult(null); }} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Describe your slideshow content</label>
                <textarea rows={3} value={aiSlidePrompt} onChange={(e) => setAiSlidePrompt(e.target.value)}
                  placeholder="e.g. ประชาสัมพันธ์กิจกรรมกีฬาสีประจำปี 2026 สำหรับโรงเรียน มี 4 slides ภาษาไทย"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500" />
              </div>

              <button onClick={async () => {
                if (!aiSlidePrompt.trim()) return;
                setIsAiGenerating(true); setAiSlideResult(null);
                try {
                  const res = await aiApi.generate('slideshow_content', aiSlidePrompt, {
                    systemPrompt: `You are a digital signage content creator. Generate slide content in JSON array format. Each slide has: headlineText, subtitleText, bodyText, ctaText. Return ONLY valid JSON array. Example: [{"headlineText":"Title","subtitleText":"Category","bodyText":"Description","ctaText":"Learn More"}]. Generate 3-5 slides based on the user's request. Use the same language the user writes in.`
                  });
                  if (res.success && res.text) setAiSlideResult(res.text);
                  else setAiSlideResult(null);
                } catch {}
                setIsAiGenerating(false);
              }} disabled={isAiGenerating || !aiSlidePrompt.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                {isAiGenerating ? <><Clock className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Wand2 className="h-3.5 w-3.5" /> Generate Slide Content</>}
              </button>

              {aiSlideResult && (
                <div className="space-y-2">
                  <span className="text-[10px] text-purple-400 font-bold">AI Generated Slides:</span>
                  <pre className="text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap">{aiSlideResult}</pre>
                  <button onClick={() => {
                    try {
                      // Parse JSON from AI response (find the JSON array)
                      const match = aiSlideResult.match(/\[[\s\S]*\]/);
                      if (match) {
                        const slides = JSON.parse(match[0]);
                        if (Array.isArray(slides) && activeSlideshow) {
                          slides.forEach((s: any) => {
                            const newSlide: SlideData = {
                              id: `sls-${Date.now()}-${Math.random().toString(36).slice(2,5)}`,
                              order: activeSlideshow.slides.length + 1,
                              mediaId: null, backgroundUrl: null, backgroundColor: '#000',
                              headlineText: s.headlineText || s.headline || null,
                              subtitleText: s.subtitleText || s.subtitle || null,
                              bodyText: s.bodyText || s.body || null,
                              ctaText: s.ctaText || s.cta || null,
                              textPosition: 'bottom-left', textColor: '#FFFFFF',
                              overlayOpacity: 50, duration: null, transition: null,
                              kenBurns: true, parallax: false,
                            };
                            activeSlideshow.slides.push(newSlide);
                          });
                          updateSlideshow({ slides: [...activeSlideshow.slides] });
                        }
                      }
                    } catch {}
                    setIsAiSlideOpen(false); setAiSlideResult(null); setAiSlidePrompt('');
                  }} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg">
                    ✅ Apply to Slideshow ({(() => { try { const m = aiSlideResult.match(/\[[\s\S]*\]/); return m ? JSON.parse(m[0]).length : 0; } catch { return 0; } })()} slides)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Preview Modal ═══════════════════════════════════ */}
      {isPreviewOpen && activeSlideshow && <SlideshowPreviewModal slideshow={activeSlideshow} onClose={() => setIsPreviewOpen(false)} />}
    </div>
  );
};


// ─── Cinematic Preview Modal ─────────────────────────────────
const SlideshowPreviewModal: React.FC<{ slideshow: SlideshowData; onClose: () => void }> = ({ slideshow, onClose }) => {
  const { mediaItems } = useSignageStore();
  const [idx, setIdx] = useState(0);
  const [time, setTime] = useState('');
  const slide = slideshow.slides[idx];

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!slideshow.slides.length) return;
    const dur = (slide?.duration || slideshow.slideDuration) * 1000;
    const timer = setTimeout(() => setIdx(prev => (prev + 1) % slideshow.slides.length), dur);
    return () => clearTimeout(timer);
  }, [idx, slideshow]);

  const getBg = (s: SlideData): string => {
    if (s.media?.url) return s.media.url;
    if (s.media?.thumbnailUrl) return s.media.thumbnailUrl;
    if (s.backgroundUrl) return s.backgroundUrl;
    if (s.mediaId) { const m = mediaItems.find(mi => mi.id === s.mediaId); return m?.url || m?.thumbnailUrl || ''; }
    return '';
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-2xl px-4 py-2 rounded-full border border-white/10 text-xs font-bold text-white">
          <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>4K Live Preview</span>
          <span className="text-amber-400 font-mono">({idx + 1}/{slideshow.slides.length})</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full bg-black/60 backdrop-blur border border-white/10 text-white hover:bg-rose-600"><X className="w-5 h-5" /></button>
      </div>

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800 z-40">
        <div className="h-full bg-amber-400 transition-all shadow-[0_0_8px_#f2ca50]" style={{ width: `${((idx + 1) / slideshow.slides.length) * 100}%` }} />
      </div>

      {/* Slide content */}
      <div className="flex-1 relative overflow-hidden">
        {slide && (
          <>
            <img src={getBg(slide)} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ animation: slide.kenBurns ? 'kenburns 20s ease-in-out infinite' : 'none' }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${slide.overlayOpacity / 100})` }} />

            {/* Branding top */}
            <div className="absolute top-16 left-8 right-8 flex items-center justify-between z-30">
              <span className="text-xl font-bold tracking-tighter" style={{ color: slideshow.accentColor, fontFamily: slideshow.titleFont }}>SIGNAGE STUDIO</span>
              <span className="text-lg font-bold font-mono" style={{ color: slideshow.accentColor }}><Clock className="w-4 h-4 inline mr-1" />{time}</span>
            </div>

            {/* Text */}
            <div className={`absolute inset-0 px-10 md:px-20 pb-32 flex flex-col z-30 ${
              slide.textPosition === 'center' ? 'items-center justify-center text-center' : 'items-start justify-end'
            }`}>
              {slide.subtitleText && (
                <span className="inline-block px-4 py-1.5 mb-4 border font-bold text-xs tracking-widest uppercase rounded-full backdrop-blur-md bg-black/40"
                  style={{ borderColor: slideshow.accentColor, color: slideshow.accentColor }}>{slide.subtitleText}</span>
              )}
              {slide.headlineText && (
                <h1 className="text-4xl md:text-7xl font-extrabold text-white uppercase tracking-tight drop-shadow-2xl" style={{ fontFamily: slideshow.titleFont }}>{slide.headlineText}</h1>
              )}
              {slide.bodyText && <p className="text-sm md:text-lg text-slate-200 max-w-2xl mt-4 leading-relaxed">{slide.bodyText}</p>}
              {slide.ctaText && (
                <button className="mt-6 px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(242,202,80,0.4)]"
                  style={{ backgroundColor: slideshow.accentColor, color: '#0B0F1A' }}>{slide.ctaText}</button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-40">
        {slideshow.slides.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-amber-400 w-6' : 'bg-white/30 w-1.5'}`} />
        ))}
      </div>
    </div>
  );
};
