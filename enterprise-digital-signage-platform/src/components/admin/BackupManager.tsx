import React, { useState, useEffect, useCallback } from 'react';
import {
  DatabaseBackup,
  Download,
  Trash2,
  RefreshCcw,
  Loader2,
  Clock,
  HardDrive,
  FileJson,
  FileArchive,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { backupApi } from '../../services/api';

interface BackupItem {
  name: string;
  type: 'db' | 'uploads';
  sizeBytes: number;
  sizeMB: string;
  createdAt: string;
}

interface BackupConfig {
  dir: string;
  retentionDays: number;
  scheduleHour: number;
}

export const BackupManager: React.FC = () => {
  const [items, setItems] = useState<BackupItem[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await backupApi.list();
      setItems(res.data || []);
      setConfig(res.config);
      setLastRun(res.lastRun);
    } catch {
      if (!silent) setMsg({ ok: false, text: 'โหลดรายการ backup ไม่สำเร็จ (สิทธิ์หรือ server ไม่พร้อม)' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runNow = async () => {
    setRunning(true);
    setMsg(null);
    try {
      const res = await backupApi.run();
      setItems(res.data || []);
      setLastRun(res.lastRun);
      setMsg({ ok: true, text: '✅ Backup เสร็จสิ้น — DB (JSON) + Uploads (ZIP)' });
    } catch (e: any) {
      setMsg({ ok: false, text: `Backup ล้มเหลว: ${e.message}` });
    } finally {
      setRunning(false);
    }
  };

  const remove = async (name: string) => {
    if (!window.confirm(`ลบไฟล์ backup "${name}" ทิ้ง?`)) return;
    try {
      await backupApi.remove(name);
      setItems((prev) => prev.filter((i) => i.name !== name));
      setMsg({ ok: true, text: `ลบ ${name} แล้ว` });
    } catch (e: any) {
      setMsg({ ok: false, text: `ลบไม่สำเร็จ: ${e.message}` });
    }
  };

  const fmtTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });
    } catch {
      return iso;
    }
  };

  const dbCount = items.filter((i) => i.type === 'db').length;
  const uploadsCount = items.filter((i) => i.type === 'uploads').length;
  const totalBytes = items.reduce((a, b) => a + b.sizeBytes, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DatabaseBackup className="h-5 w-5 text-amber-400" />
            Backup & Restore
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            สำรองข้อมูลฐานข้อมูล (JSON) + ไฟล์มีเดีย (ZIP) — ดาวน์โหลดเก็บไว้ที่อื่นได้ (REQ-007)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800/60 transition-colors"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> รีเฟรช
          </button>
          <button
            id="btn-run-backup"
            onClick={() => void runNow()}
            disabled={running}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white transition-colors"
          >
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseBackup className="h-3.5 w-3.5" />}
            {running ? 'กำลัง backup...' : 'Run backup now'}
          </button>
        </div>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
          msg.ok ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-red-500/10 border-red-500/40 text-red-300'
        }`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {msg.text}
        </div>
      )}

      {/* Config / stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><CalendarClock className="h-3.5 w-3.5" /> อัตโนมัติ</div>
          <div className="text-lg font-bold text-white">{config ? `ทุกวัน ${String(config.scheduleHour).padStart(2, '0')}:00` : '—'}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><Clock className="h-3.5 w-3.5" /> เก็บไฟล์</div>
          <div className="text-lg font-bold text-white">{config ? `${config.retentionDays} วัน` : '—'}</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><FileJson className="h-3.5 w-3.5" /> ล่าสุด (DB)</div>
          <div className="text-lg font-bold text-white">{dbCount} ไฟล์</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1"><FileArchive className="h-3.5 w-3.5" /> ล่าสุด (Uploads)</div>
          <div className="text-lg font-bold text-white">{uploadsCount} ไฟล์</div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5" /> ขนาดรวม: <b className="text-slate-200">{(totalBytes / (1024 * 1024)).toFixed(2)} MB</b></span>
        {lastRun && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Backup ล่าสุด: <b className="text-slate-200">{fmtTime(lastRun)}</b></span>}
        {config && <span className="truncate">โฟลเดอร์: <code className="text-cyan-300">{config.dir}</code></span>}
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wide">
          รายการ Backup
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">กำลังโหลด...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            ยังไม่มีไฟล์ backup — กด <b className="text-amber-400">Run backup now</b> เพื่อสร้างไฟล์แรก
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                <th className="px-4 py-2.5 font-medium">ไฟล์</th>
                <th className="px-4 py-2.5 font-medium">ประเภท</th>
                <th className="px-4 py-2.5 font-medium">ขนาด</th>
                <th className="px-4 py-2.5 font-medium">สร้างเมื่อ</th>
                <th className="px-4 py-2.5 font-medium text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.name} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-300 truncate max-w-[280px]">{it.name}</td>
                  <td className="px-4 py-2.5">
                    {it.type === 'db' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        <FileJson className="h-3 w-3" /> DB
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30">
                        <FileArchive className="h-3 w-3" /> Uploads
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400">{it.sizeMB} MB</td>
                  <td className="px-4 py-2.5 text-slate-400">{fmtTime(it.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex gap-1.5">
                      <a
                        href={backupApi.downloadUrl(it.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors"
                        title="ดาวน์โหลด"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => void remove(it.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-300 hover:bg-slate-800 transition-colors"
                        title="ลบ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
