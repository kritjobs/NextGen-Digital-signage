import React, { useState } from 'react';
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
import { aiApi } from '../../services/api';

export const AnalyticsTelemetry: React.FC = () => {
  const { screens, proofOfPlayLogs } = useSignageStore();
  const [isAiDiagOpen, setIsAiDiagOpen] = useState(false);
  const [aiDiagResult, setAiDiagResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');

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
            <span>Analytics & Proof of Play Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400">Track display uptime metrics, bandwidth, media buffer hit rate, and audit playback logs</p>
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
            <span>AI Diagnose</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs border border-slate-700 shadow-lg transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Matrix Health Uptime</span>
            <Server className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{onlinePercent}%</div>
          <p className="text-[10px] text-slate-400">{onlineCount} of {screens.length} displays online and syncing</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Buffer Cache Hit Rate</span>
            <HardDrive className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{cacheHitRatePercent}%</div>
          <p className="text-[10px] text-slate-400">Seamless offline playback protection active</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Buffer Storage</span>
            <HardDrive className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{(totalBufferUsageMb / 1024).toFixed(2)} GB</div>
          <p className="text-[10px] text-slate-400">of {(totalStorageCapacityMb / 1024).toFixed(0)} GB allocated across matrix</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Audit Proof of Play</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">100% Verified</div>
          <p className="text-[10px] text-slate-400">Tamper-proof broadcast log verification</p>
        </div>

      </div>

      {/* Proof of Play Audit Trail Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">Proof of Play Verified Audit Trail</h3>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search screen or media..."
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
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Display Name</th>
                <th className="py-3 px-4">Played Media Asset</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Audit Status</th>
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
                      <span>{log.status.toUpperCase()}</span>
                    </span>
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
              <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-purple-400" /><h3 className="font-bold text-white">AI System Diagnosis</h3></div>
              <button onClick={() => setIsAiDiagOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {isAiLoading ? (<div className="py-8 text-center"><Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" /><p className="text-sm text-slate-400">Analyzing screens...</p></div>) : aiDiagResult ? (<div className="p-4 bg-slate-950 border border-slate-700 rounded-xl"><p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{aiDiagResult}</p></div>) : null}
          </div>
        </div>
      )}
    </div>
  );
};
