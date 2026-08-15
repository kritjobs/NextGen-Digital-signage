import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, AlertOctagon, Flame, CloudLightning, Shield, Radio } from 'lucide-react';
import { useSignageStore } from '../store/useSignageStore';
import { useTranslation } from '../hooks/useTranslation';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  const { triggerEmergency, screens } = useSignageStore();
  const { t, language } = useTranslation();

  const [title, setTitle] = useState(t('emergency.fireDefaultTitle'));
  const [message, setMessage] = useState(t('emergency.fireDefaultMsg'));
  const [type, setType] = useState<'fire' | 'weather' | 'lockdown' | 'custom'>('fire');
  const [severity, setSeverity] = useState<'critical' | 'warning' | 'info'>('critical');
  const [selectedTarget, setSelectedTarget] = useState<'all' | string>('all');

  const handleSelectPreset = (presetType: 'fire' | 'weather' | 'lockdown' | 'custom') => {
    setType(presetType);
    if (presetType === 'fire') {
      setTitle(t('emergency.presetFireTitle'));
      setMessage(t('emergency.presetFireMsg'));
      setSeverity('critical');
    } else if (presetType === 'weather') {
      setTitle(t('emergency.presetWeatherTitle'));
      setMessage(t('emergency.presetWeatherMsg'));
      setSeverity('warning');
    } else if (presetType === 'lockdown') {
      setTitle(t('emergency.presetLockdownTitle'));
      setMessage(t('emergency.presetLockdownMsg'));
      setSeverity('critical');
    } else {
      setTitle(t('emergency.presetCustomTitle'));
      setMessage(t('emergency.presetCustomMsg'));
      setSeverity('info');
    }
  };

  // Re-apply the current preset's translated text when the language changes
  // (so an already-open modal updates live instead of keeping stale strings).
  useEffect(() => {
    if (!isOpen) return;
    handleSelectPreset(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, isOpen]);

  if (!isOpen) return null;

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
              <h3 className="text-base font-bold text-white">{t('emergency.modalTitle')}</h3>
              <p className="text-xs text-rose-200">{t('emergency.modalSubtitle')}</p>
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
              {t('emergency.presetTemplate')}
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
                <span className="text-xs font-bold">{t('emergency.presetFire')}</span>
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
                <span className="text-xs font-bold">{t('emergency.presetWeather')}</span>
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
                <span className="text-xs font-bold">{t('emergency.presetLockdown')}</span>
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
                <span className="text-xs font-bold">{t('emergency.presetCustom')}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">{t('emergency.alertTitle')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">{t('emergency.alertMessage')}</label>
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('emergency.targetScope')}</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="all">{t('emergency.allDisplays', { count: screens.length })}</option>
                  {screens.map((scr) => (
                    <option key={scr.id} value={scr.id}>
                      📺 {scr.name} ({scr.group})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">{t('emergency.severity')}</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="critical">{t('emergency.severityCritical')}</option>
                  <option value="warning">{t('emergency.severityWarning')}</option>
                  <option value="info">{t('emergency.severityInfo')}</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {t('emergency.cancel')}
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
              >
                <AlertOctagon className="h-4 w-4 text-white" />
                <span>{t('emergency.broadcast')}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
