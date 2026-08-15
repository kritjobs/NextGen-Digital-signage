import React, { useState } from 'react';
import { ShieldAlert, X, AlertOctagon, Flame, CloudLightning, Shield, Radio } from 'lucide-react';
import { useSignageStore } from '../store/useSignageStore';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { triggerEmergency, screens } = useSignageStore();

  const [title, setTitle] = useState('FIRE EVACUATION WARNING');
  const [message, setMessage] = useState('PLEASE EVACUATE THE BUILDING IMMEDIATELY. USE STAIRWELLS. DO NOT USE ELEVATORS.');
  const [type, setType] = useState<'fire' | 'weather' | 'lockdown' | 'custom'>('fire');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [selectedTarget, setSelectedTarget] = useState<'all' | string>('all');

  if (!isOpen) return null;

  const handleSelectPreset = (presetType: 'fire' | 'weather' | 'lockdown' | 'custom') => {
    setType(presetType);
    if (presetType === 'fire') {
      setTitle('FIRE EVACUATION EMERGENCY');
      setMessage('FIRE ALARM ACTIVATED. EVACUATE VIA NEAREST EMERGENCY EXIT IMMEDIATELY.');
      setSeverity('critical');
    } else if (presetType === 'weather') {
      setTitle('SEVERE WEATHER SHELTER NOTICE');
      setMessage('SEVERE STORM & TORNADO WARNING IN EFFECT. MOVE TO INTERIOR GROUND FLOOR SHELTERS.');
      setSeverity('warning');
    } else if (presetType === 'lockdown') {
      setTitle('SECURITY LOCKDOWN IN EFFECT');
      setMessage('SECURITY ANNOUNCEMENT: STAY IN COVERED CLASSROOMS OR OFFICES. LOCK DOORS.');
      setSeverity('critical');
    } else {
      setTitle('SPECIAL SYSTEM NOTICE');
      setMessage('PLEASE ATTEND ALL-HANDS MEETING IN MAIN AUDITORIUM.');
      setSeverity('info');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerEmergency({
      title,
      message,
      type,
      severity,
      targetScreenIds: selectedTarget === 'all' ? [] : [selectedTarget]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 to-red-950 p-4 border-b border-rose-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600/30 rounded-xl border border-rose-500/40">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Trigger Live Emergency Override</h3>
              <p className="text-xs text-rose-200">Overrides all screen playlists instantaneously via WebSocket</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Presets */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              1. Choose Preset Alert Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('fire')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  type === 'fire' 
                    ? 'bg-rose-950 border-rose-500 text-rose-200 ring-2 ring-rose-500/50' 
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Flame className="h-5 w-5 text-rose-400 mb-1" />
                <span className="text-xs font-bold">Fire Evac</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('weather')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  type === 'weather' 
                    ? 'bg-amber-950 border-amber-500 text-amber-200 ring-2 ring-amber-500/50' 
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CloudLightning className="h-5 w-5 text-amber-400 mb-1" />
                <span className="text-xs font-bold">Weather</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('lockdown')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  type === 'lockdown' 
                    ? 'bg-purple-950 border-purple-500 text-purple-200 ring-2 ring-purple-500/50' 
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Shield className="h-5 w-5 text-purple-400 mb-1" />
                <span className="text-xs font-bold">Lockdown</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('custom')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  type === 'custom' 
                    ? 'bg-blue-950 border-blue-500 text-blue-200 ring-2 ring-blue-500/50' 
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Radio className="h-5 w-5 text-blue-400 mb-1" />
                <span className="text-xs font-bold">Custom</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Alert Headline Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Broadcast Message Text</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Screen Scope</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="all">🌐 ALL Enterprise Displays ({screens.length})</option>
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>
                      📺 {scr.name} ({scr.group})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="critical">🔴 Critical (Flash Red Screen + Sound)</option>
                  <option value="warning">🟠 Warning (Amber Caution Banner)</option>
                  <option value="info">🔵 Info (Blue Notification)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
              >
                <AlertOctagon className="h-4 w-4 text-white" />
                <span>BROADCAST INSTANT OVERRIDE</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
