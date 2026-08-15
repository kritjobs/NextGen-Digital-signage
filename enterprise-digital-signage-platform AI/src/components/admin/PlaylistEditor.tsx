import React, { useState } from 'react';
import { 
  ListVideo, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Clock, 
  Sparkles, 
  Film, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { Playlist, PlaylistItem } from '../../types/signage';

export const PlaylistEditor: React.FC = () => {
  const { playlists, mediaItems, addPlaylist, updatePlaylist, deletePlaylist } = useSignageStore();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>(playlists[0]?.id || 'pl-corporate-main');
  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId) || playlists[0];

  // New Playlist Modal
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  // Add Item to Playlist modal
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const newPl: Playlist = {
      id: 'pl-' + Date.now(),
      name: newPlaylistName || 'New Playlist Sequence',
      description: newPlaylistDesc || 'Sequential digital media playback playlist',
      items: mediaItems[0] ? [{ id: 'pli-' + Date.now(), mediaId: mediaItems[0].id, duration: mediaItems[0].duration, order: 1, transition: 'fade' }] : [],
      totalDuration: mediaItems[0]?.duration || 30,
      tags: ['sequence'],
      updatedAt: new Date().toISOString()
    };

    addPlaylist(newPl);
    setSelectedPlaylistId(newPl.id);
    setIsCreatingNew(false);
  };

  const handleAddMediaToPlaylist = (mediaId: string) => {
    if (!activePlaylist) return;
    const targetMedia = mediaItems.find((m) => m.id === mediaId);
    if (!targetMedia) return;

    const newItem: PlaylistItem = {
      id: 'pli-' + Date.now() + Math.random(),
      mediaId,
      duration: targetMedia.duration,
      order: activePlaylist.items.length + 1,
      transition: 'fade'
    };

    const updatedItems = [...activePlaylist.items, newItem];
    const totalDuration = updatedItems.reduce((acc, curr) => acc + curr.duration, 0);

    updatePlaylist(activePlaylist.id, { items: updatedItems, totalDuration, updatedAt: new Date().toISOString() });
    setIsAddMediaModalOpen(false);
  };

  const handleRemovePlaylistItem = (itemId: string) => {
    if (!activePlaylist) return;
    const updatedItems = activePlaylist.items.filter((i) => i.id !== itemId);
    const totalDuration = updatedItems.reduce((acc, curr) => acc + curr.duration, 0);
    updatePlaylist(activePlaylist.id, { items: updatedItems, totalDuration, updatedAt: new Date().toISOString() });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (!activePlaylist) return;
    const items = [...activePlaylist.items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;

    items.forEach((item, idx) => {
      item.order = idx + 1;
    });

    updatePlaylist(activePlaylist.id, { items, updatedAt: new Date().toISOString() });
  };

  const handleUpdateItem = (itemId: string, partial: Partial<PlaylistItem>) => {
    if (!activePlaylist) return;
    const items = activePlaylist.items.map((i) => i.id === itemId ? { ...i, ...partial } : i);
    const totalDuration = items.reduce((acc, curr) => acc + curr.duration, 0);
    updatePlaylist(activePlaylist.id, { items, totalDuration, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <ListVideo className="h-5 w-5 text-cyan-400" />
            <span>Playlist Sequence Builder</span>
          </h2>
          <p className="text-xs text-slate-400">Sequence media items, configure transitions, and set frame durations</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedPlaylistId}
            onChange={(e) => setSelectedPlaylistId(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
          >
            {playlists.map((pl) => (
              <option key={pl.id} value={pl.id}>{pl.name} ({pl.items.length} items)</option>
            ))}
          </select>

          <button
            onClick={() => setIsCreatingNew(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Playlist Content Workspace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white">{activePlaylist?.name}</h3>
            <p className="text-xs text-slate-400">{activePlaylist?.description}</p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold">
              <Clock className="h-4 w-4 text-cyan-400" />
              <span>Loop Duration: {activePlaylist?.totalDuration}s</span>
            </span>

            <button
              onClick={() => setIsAddMediaModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold"
            >
              <Plus className="h-3.5 w-3.5 text-cyan-400" />
              <span>Add Asset</span>
            </button>
          </div>
        </div>

        {/* Playlist Items Sequence Table */}
        <div className="space-y-3">
          {activePlaylist?.items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
              No media items in this playlist sequence yet. Click "Add Asset" to populate.
            </div>
          ) : (
            activePlaylist?.items.map((item, idx) => {
              const media = mediaItems.find((m) => m.id === item.mediaId);
              if (!media) return null;

              return (
                <div 
                  key={item.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <span className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0">
                      #{idx + 1}
                    </span>

                    <img 
                      src={media.thumbnailUrl} 
                      alt="" 
                      className="h-12 w-20 object-cover rounded-lg border border-slate-800 shrink-0"
                    />

                    <div>
                      <h4 className="font-bold text-white text-xs line-clamp-1">{media.title}</h4>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">{media.type} • Original: {media.duration}s</span>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="flex items-center space-x-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Duration (s)</label>
                      <input
                        type="number"
                        min="3"
                        max="300"
                        value={item.duration}
                        onChange={(e) => handleUpdateItem(item.id, { duration: Number(e.target.value) })}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Transition Effect</label>
                      <select
                        value={item.transition}
                        onChange={(e) => handleUpdateItem(item.id, { transition: e.target.value as any })}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                      >
                        <option value="fade">Cross Fade</option>
                        <option value="slide">Slide Left</option>
                        <option value="zoom">Zoom Scale</option>
                        <option value="none">Instant Switch</option>
                      </select>
                    </div>

                    {/* Order buttons */}
                    <div className="flex items-center space-x-1 pt-3">
                      <button
                        disabled={idx === 0}
                        onClick={() => handleMoveItem(idx, 'up')}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        disabled={idx === activePlaylist.items.length - 1}
                        onClick={() => handleMoveItem(idx, 'down')}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemovePlaylistItem(item.id)}
                        className="p-1 rounded bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 ml-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal: Add Media to Playlist */}
      {isAddMediaModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl">
            <h3 className="text-base font-bold text-white mb-3">Select Asset from Library</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar pr-1">
              {mediaItems.map((m) => (
                <div 
                  key={m.id}
                  onClick={() => handleAddMediaToPlaylist(m.id)}
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-xl flex items-center space-x-3 cursor-pointer transition-all"
                >
                  <img src={m.thumbnailUrl} className="h-10 w-14 object-cover rounded-lg" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-white truncate">{m.title}</h4>
                    <span className="text-[10px] text-slate-400">{m.type} • {m.duration}s</span>
                  </div>
                  <Plus className="h-4 w-4 text-cyan-400 shrink-0" />
                </div>
              ))}
            </div>
            <div className="pt-3 flex justify-end">
              <button onClick={() => setIsAddMediaModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Playlist */}
      {isCreatingNew && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-white shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1">Playlist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Morning Reception Broadcast"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Short summary"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsCreatingNew(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 font-bold rounded-xl text-white">Save Playlist</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
