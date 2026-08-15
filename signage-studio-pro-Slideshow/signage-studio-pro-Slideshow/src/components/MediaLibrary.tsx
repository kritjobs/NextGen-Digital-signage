import React, { useState } from 'react';
import { FolderKanban, Upload, Film, Image as ImageIcon, Music, HardDrive, Trash2, CheckCircle } from 'lucide-react';
import { Card } from './Card';

export const MediaLibrary: React.FC = () => {
  const [uploaded, setUploaded] = useState(false);

  const mediaAssets = [
    { name: 'Golden_Hour_4K_Loop.mp4', type: 'video', size: '142 MB', res: '3840x2160', date: 'Today' },
    { name: 'Lobby_Pan_Master.mp4', type: 'video', size: '210 MB', res: '3840x2160', date: 'Yesterday' },
    { name: 'Grand_Atrium_Hero.jpg', type: 'image', size: '14.2 MB', res: '4096x2304', date: '3 days ago' },
    { name: 'Executive_Suite_Night.png', type: 'image', size: '18.5 MB', res: '3840x2160', date: '4 days ago' },
    { name: 'Luxe_Twilight_Soundscape.wav', type: 'audio', size: '32 MB', res: '96kHz / 24-bit', date: '1 week ago' }
  ];

  const handleUploadSim = () => {
    setUploaded(true);
    setTimeout(() => setUploaded(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 border border-white/10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Storage Used: 64.2 GB / 100 GB
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              4K Ultra HD Media Asset Vault
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              High-bitrate video loops, uncompressed hotel imagery, and ambient audio tracks.
            </p>
          </div>

          <button
            onClick={handleUploadSim}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-bold text-xs hover:shadow-[0_0_20px_rgba(242,202,80,0.4)] transition-all active:scale-95 shimmer-btn flex items-center gap-2"
          >
            {uploaded ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            <span>{uploaded ? 'Uploaded to Fleet CDN!' : 'Upload 4K Media'}</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Box */}
      <div 
        onClick={handleUploadSim}
        className="p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-amber-400/60 bg-slate-900/40 backdrop-blur-xl transition-all cursor-pointer text-center group"
      >
        <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-white">Drag & drop 4K MP4 or ProRes files here</div>
        <div className="text-xs text-slate-400 mt-1">Supports HDR10+, 60fps, WAV audio up to 500MB per file.</div>
      </div>

      {/* Media Assets List */}
      <Card className="p-6">
        <h2 className="text-base font-bold text-white mb-4">Cached CDN Assets</h2>

        <div className="space-y-3">
          {mediaAssets.map((asset, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-indigo-500/30 transition-all flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  {asset.type === 'video' && <Film className="w-4 h-4" />}
                  {asset.type === 'image' && <ImageIcon className="w-4 h-4" />}
                  {asset.type === 'audio' && <Music className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{asset.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{asset.res} • {asset.size}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-500 text-[11px]">{asset.date}</span>
                <button className="text-slate-500 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
