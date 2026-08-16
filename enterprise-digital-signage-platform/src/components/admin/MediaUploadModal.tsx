import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, X, File, Film, Image as ImageIcon,
  CheckCircle2, AlertCircle, Trash2, CloudUpload,
} from 'lucide-react';
import { getAccessToken } from '../../services/api';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;       // 'video' | 'image'
  progress: number;   // 0-100
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  mediaId?: string;
  mediaUrl?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MediaUploadModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { loadAllData } = useSignageStore();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  ];
  const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

  // ─── Add files to queue ────────────────────────────────
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: UploadFile[] = [];
    for (const file of Array.from(newFiles)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        entries.push({
          id: `f-${Date.now()}-${Math.random()}`,
          file, name: file.name, size: file.size,
          type: file.type.startsWith('video') ? 'video' : 'image',
          progress: 0, status: 'error',
          error: `Unsupported type: ${file.type}`,
        });
        continue;
      }
      if (file.size > MAX_SIZE) {
        entries.push({
          id: `f-${Date.now()}-${Math.random()}`,
          file, name: file.name, size: file.size,
          type: file.type.startsWith('video') ? 'video' : 'image',
          progress: 0, status: 'error',
          error: `File too large (max 500 MB)`,
        });
        continue;
      }
      entries.push({
        id: `f-${Date.now()}-${Math.random()}`,
        file, name: file.name, size: file.size,
        type: file.type.startsWith('video') ? 'video' : 'image',
        progress: 0, status: 'pending',
      });
    }
    setFiles(prev => [...prev, ...entries]);
  }, []);


  // ─── Upload single file with XMLHttpRequest (progress tracking) ─
  const uploadFile = (uploadFile: UploadFile): Promise<void> => {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', uploadFile.file);
      formData.append('title', uploadFile.name.replace(/\.[^.]+$/, ''));
      formData.append('duration', uploadFile.type === 'video' ? '30' : '15');

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id ? { ...f, progress: percent, status: 'uploading' } : f
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id ? {
                ...f, progress: 100, status: 'success',
                mediaId: data.media?.id, mediaUrl: data.media?.url,
              } : f
            ));
          } catch {
            setFiles(prev => prev.map(f =>
              f.id === uploadFile.id ? { ...f, progress: 100, status: 'success' } : f
            ));
          }
        } else {
          let errMsg = 'Upload failed';
          try { errMsg = JSON.parse(xhr.responseText).error || errMsg; } catch {}
          setFiles(prev => prev.map(f =>
            f.id === uploadFile.id ? { ...f, status: 'error', error: errMsg } : f
          ));
        }
        resolve();
      });

      xhr.addEventListener('error', () => {
        setFiles(prev => prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'error', error: 'Network error' } : f
        ));
        resolve();
      });

      xhr.open('POST', '/api/media/upload');
      xhr.setRequestHeader('Authorization', `Bearer ${getAccessToken()}`);
      xhr.send(formData);
    });
  };

  // ─── Upload all pending files sequentially ─────────────
  const startUpload = async () => {
    setIsUploading(true);
    const pending = files.filter(f => f.status === 'pending');
    for (const file of pending) {
      setFiles(prev => prev.map(f =>
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));
      await uploadFile(file);
    }
    setIsUploading(false);
    // Reload media library
    loadAllData();
  };

  // ─── Remove file from queue ────────────────────────────
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  // ─── Drag & Drop handlers ─────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  // ─── Stats ────────────────────────────────────────────
  const pendingCount = files.filter(f => f.status === 'pending').length;
  const uploadingCount = files.filter(f => f.status === 'uploading').length;
  const successCount = files.filter(f => f.status === 'success').length;
  const errorCount = files.filter(f => f.status === 'error').length;
  const totalProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-cyan-400" />
              Upload Media Files
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag & drop or browse files. Supports video (MP4/WebM) and images (JPG/PNG/WebP). Max 500 MB each.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-5">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragOver
                ? 'border-cyan-400 bg-cyan-400/5'
                : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
              }
            `}
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-cyan-400' : 'text-slate-500'}`} />
            <p className="text-sm font-medium text-slate-300">
              {isDragOver ? 'Drop files here' : 'Click to browse or drag files here'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Video: MP4, WebM, OGG | Image: JPG, PNG, WebP, GIF
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File Queue */}
        {files.length > 0 && (
          <div className="flex-1 overflow-y-auto px-5 pb-2">
            {/* Overall Progress */}
            {(isUploading || successCount > 0) && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{t('mu.overallProgress')}</span>
                  <span>{successCount}/{files.length} completed</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300 rounded-full"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* File List */}
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  {/* Icon */}
                  <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                    f.type === 'video' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    {f.type === 'video' ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                  </div>

                  {/* Info + Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-white truncate">{f.name}</p>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">{formatSize(f.size)}</span>
                    </div>

                    {/* Progress Bar */}
                    {f.status === 'uploading' && (
                      <div className="mt-1.5">
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all duration-200"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-cyan-400 mt-0.5 block">{f.progress}%</span>
                      </div>
                    )}

                    {/* Status */}
                    {f.status === 'success' && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] text-emerald-400">{t('mu.uploaded')}</span>
                      </div>
                    )}
                    {f.status === 'error' && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        <span className="text-[10px] text-rose-400">{f.error}</span>
                      </div>
                    )}
                    {f.status === 'pending' && (
                      <span className="text-[10px] text-slate-500 mt-0.5 block">{t('mu.waiting')}</span>
                    )}
                  </div>

                  {/* Remove button */}
                  {(f.status === 'pending' || f.status === 'error') && (
                    <button onClick={() => removeFile(f.id)} className="shrink-0 text-slate-500 hover:text-rose-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {files.length > 0 && (
              <span>{pendingCount} pending • {successCount} done • {errorCount} errors</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setFiles([]); onClose(); }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white"
            >
              {successCount > 0 ? 'Done' : 'Cancel'}
            </button>
            {pendingCount > 0 && (
              <button
                onClick={startUpload}
                disabled={isUploading}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {pendingCount} file{pendingCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
