import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';
import { Card } from './Card';

export const SettingsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-900 border border-white/10 p-6 md:p-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            System & API Key Configuration
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Enterprise authentication credentials and remote webhooks for display synchronization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" /> Enterprise API Token
          </h2>
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Live Fleet Secret Key</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value="signage_live_sk_90481203948102394810293"
                  readOnly
                  className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-amber-300 font-mono text-xs"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-white/10 text-white font-semibold flex items-center gap-1.5 hover:bg-slate-700"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs">
              <ShieldCheck className="w-4 h-4 inline mr-1" /> GEMINI AI Studio API key injected dynamically at runtime.
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-bold text-white mb-4">Organization Profile</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                defaultValue="Aurelian Hospitality & Luxury Group"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Default Screen Resolution</label>
              <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-semibold">
                <option>4K Ultra HD (3840x2160 @ 60fps)</option>
                <option>8K Ultra (7680x4320)</option>
                <option>1080p Full HD (1920x1080)</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
