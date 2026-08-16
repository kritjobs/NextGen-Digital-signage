import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ListVideo, Plus, Trash2, ArrowUp, ArrowDown, Clock, 
  Film, Image as ImageIcon, Radio, CloudSun, Type,
  GripVertical, Save, Check, Search, X, LayoutGrid, List
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { playlistApi } from '../../services/api';
import { Playlist, PlaylistItem, MediaType } from '../../types/signage';

export const PlaylistEditor: React.FC = () => {
  const { t } = useTranslation();
  const { playlists, mediaItems, screens, addPlaylist, updatePlaylist, deletePlaylist } = useSignageStore();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || '');
  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerView, setPickerView] = useState<'grid' | 'list'>('grid');
  const [pickerSelected, setPickerSelected] = useState<string[]>([]);
  const [pickerTypeFilter, setPickerTypeFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // ─── Content Approval: อนุมัติ/ปฏิเสธเพลย์ลิสต์ (admin) ─────
  const handleApprove = async (status: 'approved' | 'rejected') => {
    if (!activePlaylist) return;
    try {
      await playlistApi.approve(activePlaylist.id, status);
      updatePlaylist(activePlaylist.id, { approvalStatus: status });
    } catch (err: any) {
      console.error('[Playlist] approve failed:', err.message);
    }
  };

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Auto-select first playlist
  useEffect(() => {
    if (!selectedPlaylistId && playlists.length > 0) {
      setSelectedPlaylistId(playlists[0].id);
    }
  }, [playlists, selectedPlaylistId]);

  // ─── Auto-save debounce ────────────────────────────────
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const autoSave = useCallback((playlistId: string, data: Partial<Playlist>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      setIsSaving(true);
      updatePlaylist(playlistId, { ...data, updatedAt: new Date().toISOString() });
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date().toLocaleTimeString());
      }, 300);
    }, 800);
  }, [updatePlaylist]);

  // ─── Drag & Drop Handlers ─────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || !activePlaylist) return;
    if (dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...activePlaylist.items];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(dropIndex, 0, moved);
    items.forEach((item, idx) => { item.order = idx + 1; });

    const totalDuration = items.reduce((acc, i) => acc + i.duration, 0);
    autoSave(activePlaylist.id, { items, totalDuration });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };


  // ─── Item Actions ──────────────────────────────────────
  const handleAddMedia = (mediaId: string) => {
    if (!activePlaylist) return;
    const media = mediaItems.find(m => m.id === mediaId);
    if (!media) return;

    const newItem: PlaylistItem = {
      id: 'pli-' + Date.now() + Math.random(),
      mediaId,
      duration: media.duration,
      order: activePlaylist.items.length + 1,
      transition: 'fade',
    };
    const items = [...activePlaylist.items, newItem];
    const totalDuration = items.reduce((acc, i) => acc + i.duration, 0);
    autoSave(activePlaylist.id, { items, totalDuration });
    setIsMediaPickerOpen(false);
  };

  // Add multiple media at once (bulk)
  const handleAddMultipleMedia = (mediaIds: string[]) => {
    if (!activePlaylist || mediaIds.length === 0) return;
    let currentItems = [...activePlaylist.items];

    mediaIds.forEach((mediaId, idx) => {
      const media = mediaItems.find(m => m.id === mediaId);
      if (!media) return;
      // Skip if already in playlist
      if (currentItems.some(i => i.mediaId === mediaId)) return;

      currentItems.push({
        id: 'pli-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 6),
        mediaId,
        duration: media.duration,
        order: currentItems.length + 1,
        transition: 'fade',
      });
    });

    const totalDuration = currentItems.reduce((acc, i) => acc + i.duration, 0);
    autoSave(activePlaylist.id, { items: currentItems, totalDuration });
    setPickerSelected([]);
    setIsMediaPickerOpen(false);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!activePlaylist) return;
    const items = activePlaylist.items.filter(i => i.id !== itemId);
    items.forEach((item, idx) => { item.order = idx + 1; });
    const totalDuration = items.reduce((acc, i) => acc + i.duration, 0);
    autoSave(activePlaylist.id, { items, totalDuration });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const items = [...activePlaylist.items];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    items.forEach((item, idx) => { item.order = idx + 1; });
    const totalDuration = items.reduce((acc, i) => acc + i.duration, 0);
    autoSave(activePlaylist.id, { items, totalDuration });
  };

  const handleUpdateItem = (itemId: string, partial: Partial<PlaylistItem>) => {
    if (!activePlaylist) return;
    const items = activePlaylist.items.map(i => i.id === itemId ? { ...i, ...partial } : i);
    const totalDuration = items.reduce((acc, i) => acc + i.duration, 0);
    autoSave(activePlaylist.id, { items, totalDuration });
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const newPl: Playlist = {
      id: 'pl-' + Date.now(),
      name: newPlaylistName || 'New Playlist',
      description: newPlaylistDesc || '',
      items: [],
      totalDuration: 0,
      tags: [],
      updatedAt: new Date().toISOString(),
    };
    addPlaylist(newPl);
    setSelectedPlaylistId(newPl.id);
    setIsCreatingNew(false);
    setNewPlaylistName('');
    setNewPlaylistDesc('');
  };

  const getMediaIcon = (type: MediaType) => {
    switch (type) {
      case 'video': return <Film className="h-4 w-4 text-purple-400" />;
      case 'image': return <ImageIcon className="h-4 w-4 text-cyan-400" />;
      case 'ticker': return <Radio className="h-4 w-4 text-emerald-400" />;
      case 'weather': return <CloudSun className="h-4 w-4 text-amber-400" />;
      case 'clock': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'announcement': return <Type className="h-4 w-4 text-rose-400" />;
      default: return <Film className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredPickerMedia = mediaItems.filter(m =>
    (pickerTypeFilter === 'all' || m.type === pickerTypeFilter) &&
    (m.title.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    m.type.includes(pickerSearch.toLowerCase()))
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-cyan-400" />
            <span>{t('pl.title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('pl.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedPlaylistId}
            onChange={(e) => setSelectedPlaylistId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
          >
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>{pl.name} ({pl.items.length} items)</option>
            ))}
          </select>
          {playlists.length > 1 && (
            <button
              onClick={() => {
                const usedBy = screens.filter(s => s.currentPlaylistId === selectedPlaylistId).map(s => s.name);
                const warning = usedBy.length > 0
                  ? `\n\n⚠️ This playlist is used by ${usedBy.length} screen(s): ${usedBy.join(', ')}`
                  : '';
                if (confirm(`Delete "${activePlaylist?.name}"?${warning}\n\nThis cannot be undone.`)) {
                  const nextPlaylist = playlists.find(p => p.id !== selectedPlaylistId);
                  deletePlaylist(selectedPlaylistId);
                  if (nextPlaylist) setSelectedPlaylistId(nextPlaylist.id);
                }
              }}
              title={t('pl.deletePlaylist')}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => setIsCreatingNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30">
            <Plus className="h-4 w-4" />
            <span>{t('pl.newPlaylist')}</span>
          </button>
        </div>
      </div>

      {/* Playlist Content */}
      {activePlaylist && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          {/* Playlist Info Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white">{activePlaylist.name}</h3>
              <p className="text-xs text-slate-400">{activePlaylist.description || t('pl.noDescription')}</p>
              {/* REQ-TagMatch: tags สำหรับ auto-match กับจอ */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={(activePlaylist.tags || []).join(', ')}
                  onChange={(e) => autoSave(activePlaylist.id, { tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="tags: cafeteria, menu, lobby... (จับคู่กับจออัตโนมัติ)"
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-cyan-300 w-72 focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500">🎯 จอที่มี tag ตรงจะได้เพลย์ลิสต์นี้อัตโนมัติ</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {/* Content Approval badge + actions */}
              {(() => {
                const st = activePlaylist.approvalStatus;
                const badge = st === 'approved'
                  ? { cls: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400', label: t('pl.approved') }
                  : st === 'rejected'
                    ? { cls: 'border-rose-500/30 bg-rose-500/5 text-rose-400', label: t('pl.rejected') }
                    : { cls: 'border-amber-500/30 bg-amber-500/5 text-amber-400', label: t('pl.pending') };
                return (
                  <>
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${badge.cls}`} title="ต้องผ่าน approval ก่อนขึ้นจอ">
                      {badge.label}
                    </span>
                    {st !== 'approved' && (
                      <button
                        onClick={() => handleApprove('approved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                        title="อนุมัติให้ขึ้นจอได้"
                      >
                        {t('lb.approve')}
                      </button>
                    )}
                    {st !== 'rejected' && (
                      <button
                        onClick={() => handleApprove('rejected')}
                        className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-[11px] font-bold"
                        title="ปฏิเสธ — ไม่ขึ้นจอ"
                      >
                        {t('lb.reject')}
                      </button>
                    )}
                  </>
                );
              })()}
              {/* Save indicator */}
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                isSaving ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
                lastSaved ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' :
                'border-slate-700 bg-slate-950 text-slate-500'
              }`}>
                {isSaving ? <><Save className="h-3 w-3 animate-pulse" /> {t('pl.saving')}</> :
                 lastSaved ? <><Check className="h-3 w-3" /> {t('pl.saved')}{lastSaved}</> :
                 <><Save className="h-3 w-3" /> {t('pl.autoSave')}</>}
              </span>

              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold">
                <Clock className="h-3.5 w-3.5" />
                {activePlaylist.totalDuration}s total
              </span>

              <button onClick={() => setIsMediaPickerOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
                <Plus className="h-3.5 w-3.5" />
                {t('pl.addMedia')}
              </button>
            </div>
          </div>

          {/* Media Items List (Drag & Drop) */}
          <div className="space-y-2">
            {activePlaylist.items.length === 0 ? (
              <div className="py-16 text-center bg-slate-950/50 rounded-xl border-2 border-dashed border-slate-800">
                <ListVideo className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">{t('pl.empty')}</p>
                <button onClick={() => setIsMediaPickerOpen(true)} className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">
                  {t('pl.addFirstMedia')}
                </button>
              </div>
            ) : (
              activePlaylist.items.map((item, idx) => {
                const media = mediaItems.find(m => m.id === item.mediaId);
                if (!media) return null;
                const isDragging = dragIndex === idx;
                const isDragOver = dragOverIndex === idx;

                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing
                      ${isDragging ? 'opacity-40 scale-95 border-cyan-500 bg-cyan-500/5' :
                        isDragOver ? 'border-indigo-400 bg-indigo-500/5 ring-2 ring-indigo-500/20' :
                        'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'}
                    `}
                  >
                    {/* Drag Handle */}
                    <div className="shrink-0 text-slate-600 hover:text-slate-400 cursor-grab">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {/* Order Number */}
                    <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400">
                      {idx + 1}
                    </span>

                    {/* Thumbnail */}
                    <div className="shrink-0 w-20 h-12 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                      {media.type === 'video' && media.url ? (
                        <video src={media.url} muted preload="metadata" className="w-full h-full object-cover"
                          onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
                      ) : (
                        <img src={media.thumbnailUrl || media.url || ''} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                    </div>

                    {/* Media Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getMediaIcon(media.type)}
                        <h4 className="font-semibold text-white text-xs truncate">{media.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase">{media.type} • {media.sizeMb || 0} MB</span>
                    </div>

                    {/* Duration */}
                    <div className="shrink-0">
                      <label className="text-[9px] text-slate-500 block mb-0.5 text-center">{t('pl.duration')}</label>
                      <input
                        type="number" min="3" max="300"
                        value={item.duration}
                        onChange={(e) => handleUpdateItem(item.id, { duration: Number(e.target.value) })}
                        className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white font-mono text-xs text-center focus:border-cyan-500 focus:outline-none"
                      />
                    </div>

                    {/* Transition */}
                    <div className="shrink-0">
                      <label className="text-[9px] text-slate-500 block mb-0.5 text-center">{t('pl.transition')}</label>
                      <select
                        value={item.transition}
                        onChange={(e) => handleUpdateItem(item.id, { transition: e.target.value as any })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1 text-white text-[11px] focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="fade">{t('pl.transitionFade')}</option>
                        <option value="slide">{t('pl.transitionSlide')}</option>
                        <option value="zoom">{t('pl.transitionZoom')}</option>
                        <option value="none">{t('pl.transitionCut')}</option>
                      </select>
                    </div>

                    {/* Move + Delete */}
                    <div className="shrink-0 flex items-center gap-0.5">
                      <button disabled={idx === 0} onClick={() => handleMoveItem(idx, 'up')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-20">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button disabled={idx === activePlaylist.items.length - 1} onClick={() => handleMoveItem(idx, 'down')}
                        className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-white disabled:opacity-20">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400 ml-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}


      {/* Modal: Media Picker */}
      {isMediaPickerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Picker Header */}
            <div className="p-5 border-b border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-white">{t('pl.addMedia')}</h3>
                <button onClick={() => setIsMediaPickerOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder={t('pl.searchMedia')}
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    autoFocus
                  />
                </div>
                {/* View Toggle */}
                <div className="flex items-center bg-slate-950 rounded-lg border border-slate-700 p-0.5">
                  <button onClick={() => setPickerView('grid')} className={`p-1.5 rounded ${pickerView === 'grid' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`}>
                    <LayoutGrid className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setPickerView('list')} className={`p-1.5 rounded ${pickerView === 'list' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500'}`}>
                    <List className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {/* Type Filter Tabs */}
              <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                {['all', 'image', 'video', 'slideshow'].map(pt => (
                  <button key={pt} onClick={() => setPickerTypeFilter(pt)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors ${pickerTypeFilter === pt ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                    {pt === 'all' ? t('pl.allCount', { count: mediaItems.length }) : `${pt.charAt(0).toUpperCase() + pt.slice(1)} (${mediaItems.filter(m => m.type === pt).length})`}
                  </button>
                ))}
              </div>
              {/* Bulk Actions */}
              {pickerSelected.length > 0 && (
                <div className="flex items-center justify-between mt-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-cyan-300">{t('pl.selectedCount', { count: pickerSelected.length })}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPickerSelected(filteredPickerMedia.filter(m => !activePlaylist?.items.some(i => i.mediaId === m.id)).map(m => m.id))} className="text-[10px] text-cyan-400 hover:text-cyan-300 underline">{t('pl.selectAll')}</button>
                    <button onClick={() => setPickerSelected([])} className="text-[10px] text-slate-400 hover:text-white underline">{t('pl.clear')}</button>
                    <button onClick={() => { handleAddMultipleMedia(pickerSelected); }} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold rounded-lg">{t('pl.addSelected')}</button>
                  </div>
                </div>
              )}
            </div>

            {/* Picker Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {pickerView === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredPickerMedia.map((m) => {
                    const alreadyInPlaylist = activePlaylist?.items.some(i => i.mediaId === m.id);
                    const isSelected = pickerSelected.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (alreadyInPlaylist) return;
                          setPickerSelected(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]);
                        }}
                        className={`relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                          alreadyInPlaylist ? 'opacity-40 cursor-not-allowed border-slate-800' :
                          isSelected ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {/* Checkbox */}
                        {!alreadyInPlaylist && (
                          <div className={`absolute top-1.5 left-1.5 z-10 w-5 h-5 rounded border-2 flex items-center justify-center text-[9px] font-bold ${
                            isSelected ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-slate-900/80 border-slate-600 text-transparent'
                          }`}>✓</div>
                        )}
                        {alreadyInPlaylist && (
                          <div className="absolute top-1.5 right-1.5 z-10 bg-slate-800 text-[8px] text-slate-400 px-1.5 py-0.5 rounded">{t('pl.added')}</div>
                        )}
                        {/* Thumbnail */}
                        <div className="aspect-video bg-slate-950">
                          {m.type === 'video' && m.url ? (
                            <video src={m.url} muted preload="metadata" className="w-full h-full object-cover"
                              onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }} />
                          ) : (
                            <img src={m.thumbnailUrl || m.url || ''} alt="" className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/200x112/1e293b/475569?text=' + encodeURIComponent(m.type); }} />
                          )}
                        </div>
                        {/* Title */}
                        <div className="p-1.5 bg-slate-900">
                          <p className="text-[9px] font-medium text-white truncate">{m.title}</p>
                          <p className="text-[8px] text-slate-500">{m.type} • {m.duration}s</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View */
                <div className="space-y-1.5">
                  {filteredPickerMedia.map((m) => {
                    const alreadyInPlaylist = activePlaylist?.items.some(i => i.mediaId === m.id);
                    const isSelected = pickerSelected.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => {
                          if (alreadyInPlaylist) return;
                          setPickerSelected(prev => prev.includes(m.id) ? prev.filter(x => x !== m.id) : [...prev, m.id]);
                        }}
                        className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                          alreadyInPlaylist ? 'border-slate-800 opacity-40 cursor-not-allowed' :
                          isSelected ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-600 cursor-pointer'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center text-[9px] font-bold ${
                          alreadyInPlaylist ? 'bg-slate-800 border-slate-700 text-slate-600' :
                          isSelected ? 'bg-cyan-500 border-cyan-400 text-white' : 'bg-slate-900 border-slate-600 text-transparent'
                        }`}>✓</div>
                        {/* Thumbnail */}
                        <div className="shrink-0 w-14 h-9 rounded-lg overflow-hidden bg-slate-900 border border-slate-800">
                          <img src={m.thumbnailUrl || m.url || ''} alt="" className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-xs truncate">{m.title}</h4>
                          <span className="text-[10px] text-slate-500">{m.type} • {m.duration}s • {m.sizeMb || 0} MB</span>
                        </div>
                        {alreadyInPlaylist && <span className="text-[9px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{t('pl.added')}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredPickerMedia.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  {t('pl.noMatch', { query: pickerSearch })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Playlist */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-base font-bold mb-4">{t('pl.createTitle')}</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">{t('pl.name')}</label>
                <input type="text" placeholder="e.g. Morning Reception" value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" required />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">{t('pl.description')}</label>
                <input type="text" placeholder="Short summary" value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsCreatingNew(false)} className="px-4 py-2 text-slate-400">{t('pl.cancel')}</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 font-bold rounded-xl text-white">{t('pl.create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
