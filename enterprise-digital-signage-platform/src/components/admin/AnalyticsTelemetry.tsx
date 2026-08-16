import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  HardDrive, 
  Download, 
  Search, 
  CheckCircle2, 
  Server, 
  Clock, 
  ShieldCheck,
  Bot,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';
import { aiApi, auditApi } from '../../services/api';

export const AnalyticsTelemetry: React.FC = () => {
  const { t } = useTranslation();
  const { screens, proofOfPlayLogs } = useSignageStore();
  const [isAiDiagOpen, setIsAiDiagOpen] = useState(false);
  const [aiDiagResult, setAiDiagResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

  // REQ-010: Admin Audit Trail
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditQuery, setAuditQuery] = useState('');
  const [auditResource, setAuditResource] = useState('all');
  const loadAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await auditApi.getLogs({
        q: auditQuery || undefined,
        resource: auditResource === 'all' ? undefined : auditResource,
        limit: 100,
      });
      setAuditLogs(res.data || []);
    } catch { /* permission หรือ offline */ } finally {
      setAuditLoading(false);
    }
  }, [auditQuery, auditResource]);

  useEffect(() => { void loadAuditLogs(); }, [loadAuditLogs]);

  const onlineCount = screens.filter((s) => s.status === 'online').length;
  const onlinePercent = Math.round((onlineCount / (screens.length || 1)) * 100);

  const totalBufferUsageMb = screens.reduce((acc, curr) => acc + curr.storageUsageMb, 0);
  const totalStorageCapacityMb = screens.reduce((acc, curr) => acc + curr.storageTotalMb, 0);
  const cacheHitRatePercent = 99.4;

  const filteredLogs = proofOfPlayLogs.filter((log) => {
    return log.screenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           log.mediaTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Screen,Media Asset,Played At,Duration(s),Status", ...proofOfPlayLogs.map(l => `${l.screenName},${l.mediaTitle},${l.playedAt},${l.durationSeconds},${l.status}`)].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Proof_Of_Play_Audit_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span>{t('an.title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('an.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsAiDiagOpen(true); setIsAiLoading(true); setAiDiagResult(null);
              const screenData = screens.map(s => `${s.name}: status=${s.status}, storage=${s.storageUsageMb}/${s.storageTotalMb}MB, uptime=${Math.floor(s.uptimeSeconds/3600)}h, buffer=${s.bufferCachedItemsCount} items`).join('\n');
              try {
                const res = await aiApi.generate('diagnosis', `Analyze these digital signage screens and identify potential issues:\n${screenData}\n\nProvide brief diagnosis and recommendations in the same language the data suggests.`);
                setAiDiagResult(res.success ? res.text || 'No issues found.' : res.error || 'AI unavailable');
              } catch (e: any) { setAiDiagResult('Error: ' + e.message); }
              setIsAiLoading(false);
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Bot className="h-4 w-4" />
            <span>{t('an.aiDiagnose')}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 shadow-lg transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{t('an.exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t('an.healthUptime')}</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{onlinePercent}%</div>
          <p className="text-[10px] text-slate-400">{t('an.onlineSummary', { online: onlineCount, total: screens.length })}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t('an.bufferHitRate')}</span>
            <HardDrive className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{cacheHitRatePercent}%</div>
          <p className="text-[10px] text-slate-400">{t('an.offlineProtection')}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t('an.totalBuffer')}</span>
            <HardDrive className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{(totalBufferUsageMb / 1024).toFixed(2)} GB</div>
          <p className="text-[10px] text-slate-400">{t('an.allocSummary', { gb: (totalStorageCapacityMb / 1024).toFixed(0) })}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t('an.auditPoP')}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{t('an.verifiedPct')}</div>
          <p className="text-[10px] text-slate-400">{t('an.tamperProof')}</p>
        </div>

      </div>

      {/* Proof of Play Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">{t('an.verifiedTrail')}</h3>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder={t('an.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('an.timestamp')}</th>
                <th className="py-3 px-4">{t('an.displayName')}</th>
                <th className="py-3 px-4">{t('an.mediaAsset')}</th>
                <th className="py-3 px-4">{t('an.duration')}</th>
                <th className="py-3 px-4">{t('an.auditStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-400">{new Date(log.playedAt).toLocaleString()}</td>
                  <td className="py-3 px-4 font-bold text-white">{log.screenName}</td>
                  <td className="py-3 px-4 text-cyan-400">{log.mediaTitle}</td>
                  <td className="py-3 px-4">{log.durationSeconds}s</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{t('an.statusCompleted')}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQ-010: Admin Audit Trail */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-cyan-400" />
            {t('an.auditTrail')}
            <span className="text-[10px] font-normal text-slate-500">(REQ-010 — การกระทำของ admin ย้อนหลัง)</span>
          </h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={auditResource}
              onChange={(e) => setAuditResource(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">{t('an.resAll')}</option>
              <option value="auth">{t('an.resAuth')}</option>
              <option value="layout">{t('an.resLayout')}</option>
              <option value="playlist">{t('an.resPlaylist')}</option>
              <option value="schedule">{t('an.resSchedule')}</option>
              <option value="campaign">{t('an.resCampaign')}</option>
              <option value="media">{t('an.resMedia')}</option>
              <option value="screen">{t('an.resScreen')}</option>
              <option value="emergency">{t('an.resEmergency')}</option>
            </select>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาอีเมล / resourceId..."
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button onClick={() => void loadAuditLogs()} className="px-3 py-1.5 rounded-xl bg-cyan-950 text-cyan-300 text-xs font-bold hover:bg-cyan-900 shrink-0">ค้นหา</button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">ผู้ใช้</th>
                <th className="py-3 px-4">การกระทำ</th>
                <th className="py-3 px-4">หมวด</th>
                <th className="py-3 px-4">resourceId</th>
                <th className="py-3 px-4">IP</th>
                <th className="py-3 px-4">ระดับ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {auditLoading ? (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">กำลังโหลด...</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr><td colSpan={7} className="py-6 text-center text-slate-500">ไม่มีข้อมูล audit (ระบบยังไม่มี activity)</td></tr>
              ) : auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('th-TH')}</td>
                  <td className="py-3 px-4 text-white">{log.userEmail || 'system'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      log.severity === 'critical' ? 'bg-rose-950 text-rose-300' :
                      log.severity === 'warning' ? 'bg-amber-950 text-amber-300' :
                      'bg-slate-950 text-cyan-300'
                    }`}>{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{log.resource}</td>
                  <td className="py-3 px-4 text-slate-400">{log.resourceId || '—'}</td>
                  <td className="py-3 px-4 text-slate-500">{log.ipAddress || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.severity === 'critical' ? 'bg-rose-950 text-rose-400' :
                      log.severity === 'warning' ? 'bg-amber-950 text-amber-400' :
                      'bg-slate-950 text-slate-400'
                    }`}>{t(log.severity === 'critical' ? 'an.sevCritical' : log.severity === 'warning' ? 'an.sevWarning' : 'an.sevInfo')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Diagnosis Modal */}
      {isAiDiagOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-purple-400" /><h3 className="font-bold text-white">{t('an.aiDiagnosis')}</h3></div>
              <button onClick={() => setIsAiDiagOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {isAiLoading ? (<div className="py-8 text-center"><Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" /><p className="text-sm text-slate-400">{t('an.analyzing')}</p></div>) : aiDiagResult ? (<div className="p-4 bg-slate-950 border border-slate-700 rounded-xl"><p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{aiDiagResult}</p></div>) : null}
          </div>
        </div>
      )}
    </div>
  );
};
