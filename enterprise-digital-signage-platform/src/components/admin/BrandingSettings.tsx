import React, { useState } from 'react';
import { Palette, RotateCcw, Upload, Eye } from 'lucide-react';
import { useBrandingStore, BrandingConfig } from '../../store/useBrandingStore';

export const BrandingSettings: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const branding = useBrandingStore();
  const [form, setForm] = useState<Partial<BrandingConfig>>({
    platformName: branding.platformName,
    platformSubtitle: branding.platformSubtitle,
    logoUrl: branding.logoUrl,
    faviconUrl: branding.faviconUrl,
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
    footerText: branding.footerText,
    loginTitle: branding.loginTitle,
    loginSubtitle: branding.loginSubtitle,
  });

  if (!isOpen) return null;

  const handleSave = () => {
    branding.setBranding(form);
    onClose();
  };

  const handleReset = () => {
    branding.resetToDefault();
    setForm({
      platformName: 'SIGNAGE',
      platformSubtitle: 'Smart Layout & Realtime Display Engine',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#06b6d4',
      accentColor: '#8b5cf6',
      footerText: 'Enterprise Digital Signage Platform',
      loginTitle: 'SIGNAGE ENTERPRISE',
      loginSubtitle: 'Smart Digital Signage Management Platform',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Palette className="h-5 w-5 text-violet-400" />
              <span>White-Label Branding</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Customize logo, name, and colors</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-2">✕</button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Platform Name */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Platform Name</label>
            <input
              type="text"
              value={form.platformName || ''}
              onChange={e => setForm({ ...form, platformName: e.target.value })}
              placeholder="SIGNAGE"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Subtitle</label>
            <input
              type="text"
              value={form.platformSubtitle || ''}
              onChange={e => setForm({ ...form, platformSubtitle: e.target.value })}
              placeholder="Smart Layout & Realtime Display Engine"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Logo</label>
            
            {/* Upload / Drag-Drop area */}
            <div
              className="border-2 border-dashed border-slate-700 rounded-xl p-3 text-center cursor-pointer hover:border-violet-500 hover:bg-violet-950/10 transition-all relative"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-violet-400', 'bg-violet-950/20'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('border-violet-400', 'bg-violet-950/20'); }}
              onDrop={async (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-violet-400', 'bg-violet-950/20');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('title', 'Brand Logo');
                  formData.append('tags', 'logo,branding');
                  try {
                    const token = localStorage.getItem('signage_access_token') || '';
                    const res = await fetch('/api/media/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                    const data = await res.json();
                    if (data.success && data.file?.storedUrl) {
                      setForm({ ...form, logoUrl: data.file.storedUrl });
                    }
                  } catch {}
                }
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e: any) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  formData.append('title', 'Brand Logo');
                  formData.append('tags', 'logo,branding');
                  try {
                    const token = localStorage.getItem('signage_access_token') || '';
                    const res = await fetch('/api/media/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
                    const data = await res.json();
                    if (data.success && data.file?.storedUrl) {
                      setForm({ ...form, logoUrl: data.file.storedUrl });
                    }
                  } catch {}
                };
                input.click();
              }}
            >
              {form.logoUrl ? (
                <div className="flex items-center justify-center space-x-3">
                  <img src={form.logoUrl} alt="Logo" className="h-12 w-12 object-contain rounded-lg border border-slate-700 bg-slate-800 p-1" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-300 font-medium">Logo uploaded</p>
                    <p className="text-[9px] text-slate-500 truncate max-w-[180px]">{form.logoUrl}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">Click to upload or drag & drop logo here</p>
                  <p className="text-[9px] text-slate-600">PNG, SVG, JPG (max 2MB)</p>
                </div>
              )}
            </div>

            {/* Manual URL input */}
            <div className="mt-2">
              <input
                type="text"
                value={form.logoUrl || ''}
                onChange={e => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="Or paste URL: /uploads/logo.png"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-[10px] text-white focus:outline-none focus:border-violet-500 font-mono"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Primary Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={form.primaryColor || '#06b6d4'}
                  onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.primaryColor || ''}
                  onChange={e => setForm({ ...form, primaryColor: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Accent Color</label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={form.accentColor || '#8b5cf6'}
                  onChange={e => setForm({ ...form, accentColor: e.target.value })}
                  className="w-8 h-8 rounded border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={form.accentColor || ''}
                  onChange={e => setForm({ ...form, accentColor: e.target.value })}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Login Page */}
          <div className="border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-300 mb-3">Login Page</h4>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Title</label>
                <input
                  type="text"
                  value={form.loginTitle || ''}
                  onChange={e => setForm({ ...form, loginTitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Subtitle</label>
                <input
                  type="text"
                  value={form.loginSubtitle || ''}
                  onChange={e => setForm({ ...form, loginSubtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Footer Text</label>
            <input
              type="text"
              value={form.footerText || ''}
              onChange={e => setForm({ ...form, footerText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={handleReset} className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset to Default</span>
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm">Save Branding</button>
          </div>
        </div>
      </div>
    </div>
  );
};
