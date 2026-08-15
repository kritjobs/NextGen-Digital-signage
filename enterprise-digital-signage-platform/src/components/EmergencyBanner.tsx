import React from 'react';
import { AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useSignageStore } from '../store/useSignageStore';
import { useTranslation } from '../hooks/useTranslation';

export const EmergencyBanner: React.FC = () => {
  const { emergencyAlerts, clearEmergency } = useSignageStore();
  const { t } = useTranslation();
  const activeAlert = emergencyAlerts.find((a) => a.active);

  if (!activeAlert) return null;

  return (
    <div id="emergency-banner" className="bg-rose-600 border-b-2 border-rose-400 text-white shadow-2xl animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <AlertOctagon className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-rose-200">
                {t('emergency.bannerCritical')}
              </span>
              <span className="text-xs font-semibold text-rose-100">
                {t('emergency.triggered', { time: new Date(activeAlert.triggeredAt).toLocaleTimeString() })}
              </span>
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">{activeAlert.title}</h4>
            <p className="text-xs text-rose-100 mt-0.5">{activeAlert.message}</p>
          </div>
        </div>

        <button
          id="btn-clear-emergency"
          onClick={() => clearEmergency(activeAlert.id)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white text-rose-700 font-bold text-xs hover:bg-rose-50 shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 text-rose-700" />
          <span>{t('emergency.clear')}</span>
        </button>
      </div>
    </div>
  );
};
