import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, Plus, Trash2, ShieldAlert, Layers, Zap,
  Edit3, X, AlertTriangle, Check, Save, Eye, Play
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { ScheduleItem } from '../../types/signage';

const DAYS_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00–23:00

// Screen groups derived from screens
function useScreenGroups() {
  const { screens } = useSignageStore();
  const groups = [...new Set(screens.map(s => s.group).filter(Boolean))];
  return groups;
}

// Conflict detection
function detectConflicts(schedules: ScheduleItem[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const a = schedules[i], b = schedules[j];
      if (!a.isActive || !b.isActive) continue;
      // Check day overlap
      const dayOverlap = a.daysOfWeek.some(d => b.daysOfWeek.includes(d));
      if (!dayOverlap) continue;
      // Check time overlap
      const aStart = parseInt(a.startTime.replace(':', ''));
      const aEnd = parseInt(a.endTime.replace(':', ''));
      const bStart = parseInt(b.startTime.replace(':', ''));
      const bEnd = parseInt(b.endTime.replace(':', ''));
      const timeOverlap = aStart < bEnd && bStart < aEnd;
      if (!timeOverlap) continue;
      // Check screen overlap
      const aScreens = [...a.screenGroupIds, ...a.screenIds];
      const bScreens = [...b.screenGroupIds, ...b.screenIds];
      const screenOverlap = aScreens.some(s => bScreens.includes(s)) ||
        aScreens.length === 0 || bScreens.length === 0;
      if (screenOverlap) {
        if (!conflicts.has(a.id)) conflicts.set(a.id, []);
        if (!conflicts.has(b.id)) conflicts.set(b.id, []);
        conflicts.get(a.id)!.push(b.name);
        conflicts.get(b.id)!.push(a.name);
      }
    }
  }
  return conflicts;
}

export const SchedulerEngine: React.FC = () => {
  const { schedules, playlists, layouts, screens, addSchedule, updateSchedule, deleteSchedule, applyScheduleToScreens, resolveSchedules } = useSignageStore();
  const screenGroups = useScreenGroups();

  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);


  // Form state
  const [formData, setFormData] = useState({
    name: '', playlistId: playlists[0]?.id || '', layoutId: layouts[0]?.id || '',
    priority: 50, startTime: '08:00', endTime: '18:00',
    startDate: '2026-01-01', endDate: '2026-12-31',
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
    screenGroupIds: [] as string[], isActive: true,
  });

  // Conflict detection
  const conflicts = useMemo(() => detectConflicts(schedules), [schedules]);

  const openCreate = () => {
    setEditingId(null);
    setFormData({
      name: '', playlistId: playlists[0]?.id || '', layoutId: layouts[0]?.id || '',
      priority: 50, startTime: '08:00', endTime: '18:00',
      startDate: '2026-01-01', endDate: '2026-12-31',
      daysOfWeek: [1, 2, 3, 4, 5], screenGroupIds: [], isActive: true,
    });
    setIsFormOpen(true);
  };

  const openEdit = (sch: ScheduleItem) => {
    setEditingId(sch.id);
    setFormData({
      name: sch.name, playlistId: sch.playlistId || '', layoutId: sch.layoutId || '',
      priority: sch.priority, startTime: sch.startTime, endTime: sch.endTime,
      startDate: sch.startDate, endDate: sch.endDate,
      daysOfWeek: [...sch.daysOfWeek], screenGroupIds: [...sch.screenGroupIds], isActive: sch.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSchedule(editingId, { ...formData, updatedAt: new Date().toISOString() } as any);
    } else {
      addSchedule({
        id: 'sch-' + Date.now(),
        ...formData,
        screenIds: [],
      } as ScheduleItem);
    }
    setIsFormOpen(false);
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const toggleGroup = (group: string) => {
    setFormData(prev => ({
      ...prev,
      screenGroupIds: prev.screenGroupIds.includes(group)
        ? prev.screenGroupIds.filter(g => g !== group)
        : [...prev.screenGroupIds, group],
    }));
  };

  // Timeline helpers
  const timeToPercent = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h - 6) * 60 + m) / (18 * 60) * 100; // 06:00 = 0%, 24:00 = 100%
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <span>Time & Priority Scheduler Engine</span>
          </h2>
          <p className="text-xs text-slate-400">Configure time-based broadcast triggers, conflict resolution, and priority rules</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              List
            </button>
            <button onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'timeline' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              Timeline
            </button>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30">
            <Plus className="h-4 w-4" /> Create Rule
          </button>
        </div>
      </div>

      {/* Priority Hierarchy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-rose-950/30 border border-rose-800/40 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-rose-600/20 rounded-lg"><ShieldAlert className="h-5 w-5 text-rose-400" /></div>
          <div><div className="text-[10px] font-bold text-rose-400 uppercase">PRIORITY 100</div><h4 className="font-bold text-white text-xs">Emergency Override</h4></div>
        </div>
        <div className="bg-cyan-950/30 border border-cyan-800/40 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-cyan-600/20 rounded-lg"><Clock className="h-5 w-5 text-cyan-400" /></div>
          <div><div className="text-[10px] font-bold text-cyan-400 uppercase">PRIORITY 50-89</div><h4 className="font-bold text-white text-xs">Scheduled Events</h4></div>
        </div>
        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg"><Layers className="h-5 w-5 text-slate-400" /></div>
          <div><div className="text-[10px] font-bold text-slate-400 uppercase">PRIORITY 10-49</div><h4 className="font-bold text-white text-xs">Default Fallback</h4></div>
        </div>
      </div>

      {/* Conflict Warning */}
      {conflicts.size > 0 && (
        <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-300">Schedule Conflict Detected</p>
            <p className="text-[11px] text-amber-400/80">{conflicts.size} rules have overlapping time windows on the same screens. Higher priority will override.</p>
          </div>
        </div>
      )}


      {/* ─── TIMELINE VIEW ──────────────────────────────────── */}
      {viewMode === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-cyan-400" /> Daily Timeline (06:00 – 24:00)
          </h3>

          {/* Time Header */}
          <div className="flex mb-1">
            <div className="w-40 shrink-0" />
            <div className="flex-1 flex">
              {HOURS.map(h => (
                <div key={h} className="flex-1 text-center text-[9px] text-slate-500 font-mono">
                  {h.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>

          {/* Schedule Rows */}
          <div className="space-y-2">
            {schedules.map(sch => {
              const playlist = playlists.find(p => p.id === sch.playlistId);
              const hasConflict = conflicts.has(sch.id);
              const left = Math.max(0, timeToPercent(sch.startTime));
              const right = Math.min(100, timeToPercent(sch.endTime));
              const width = right - left;

              const barColor = sch.priority >= 80 ? 'bg-amber-500/60 border-amber-500'
                : sch.priority >= 50 ? 'bg-cyan-500/40 border-cyan-500'
                : 'bg-slate-600/40 border-slate-500';

              return (
                <div key={sch.id} className="flex items-center">
                  {/* Label */}
                  <div className="w-40 shrink-0 pr-3">
                    <p className="text-[11px] font-semibold text-white truncate">{sch.name}</p>
                    <p className="text-[9px] text-slate-500">{playlist?.name || '—'}</p>
                  </div>

                  {/* Timeline bar */}
                  <div className="flex-1 relative h-8 bg-slate-950 rounded border border-slate-800">
                    {/* Grid lines */}
                    {HOURS.map(h => (
                      <div key={h} className="absolute top-0 bottom-0 border-l border-slate-800/50"
                        style={{ left: `${((h - 6) / 18) * 100}%` }} />
                    ))}
                    {/* Bar */}
                    {width > 0 && (
                      <div
                        className={`absolute top-1 bottom-1 rounded border ${barColor} ${!sch.isActive ? 'opacity-30' : ''} ${hasConflict ? 'ring-1 ring-amber-400' : ''} cursor-pointer hover:brightness-125 transition-all`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        onClick={() => openEdit(sch)}
                        title={`${sch.name} (${sch.startTime}–${sch.endTime}) P:${sch.priority}`}
                      >
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white truncate px-1">
                          {width > 8 ? sch.name : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/60 border border-amber-500" /> High Priority (80+)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-500/40 border border-cyan-500" /> Scheduled (50-79)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-600/40 border border-slate-500" /> Default (10-49)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-amber-400 bg-transparent" /> Conflict</span>
          </div>
        </div>
      )}


      {/* ─── LIST VIEW ──────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Active Broadcast Rules ({schedules.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schedules.map(sch => {
              const playlist = playlists.find(p => p.id === sch.playlistId);
              const layout = layouts.find(l => l.id === sch.layoutId);
              const hasConflict = conflicts.has(sch.id);

              return (
                <div key={sch.id}
                  className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all shadow-xl ${
                    hasConflict ? 'border-amber-600/50 ring-1 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'
                  }`}>
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sch.priority >= 80 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      sch.priority >= 50 ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' :
                      'bg-slate-950 text-slate-400 border border-slate-700'
                    }`}>
                      Priority: {sch.priority}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasConflict && (
                        <span className="text-[9px] text-amber-400 flex items-center gap-0.5" title={`Conflicts with: ${conflicts.get(sch.id)?.join(', ')}`}>
                          <AlertTriangle className="h-3 w-3" /> Conflict
                        </span>
                      )}
                      <button onClick={() => updateSchedule(sch.id, { isActive: !sch.isActive })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sch.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-500 border border-slate-700'
                        }`}>
                        {sch.isActive ? '● ON' : '○ OFF'}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-white text-sm">{sch.name}</h4>

                  {/* Details */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">Layout:</span><span className="text-cyan-400 font-medium">{layout?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Playlist:</span><span className="text-indigo-400 font-medium">{playlist?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Time Window:</span><span className="font-mono text-white">{sch.startTime} – {sch.endTime}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Screens:</span><span className="text-slate-300">{sch.screenGroupIds.length > 0 ? sch.screenGroupIds.join(', ') : 'All'}</span></div>
                  </div>

                  {/* Days */}
                  <div className="flex gap-1">
                    {DAYS_LABEL.map((d, i) => (
                      <span key={d} className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        sch.daysOfWeek.includes(i) ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-600'
                      }`}>{d}</span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(sch)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400">
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => applyScheduleToScreens(sch.id)}
                        className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950 px-2 py-1 rounded-lg">
                        <Play className="h-3 w-3" /> Apply Now
                      </button>
                    </div>
                    <button onClick={() => deleteSchedule(sch.id)}
                      className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* ─── CREATE / EDIT MODAL ─────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Edit Schedule Rule' : 'Create Schedule Rule'}
                </h3>
                <p className="text-[9px] text-amber-400 mt-0.5">⚡ Schedule มี priority สูงกว่า Screen Default — จะ override layout/playlist ของจอตามเวลาที่กำหนด</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">Rule Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Daily Cafeteria Lunch Menu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none" required />
              </div>

              {/* Layout + Playlist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Layout</label>
                  <select value={formData.layoutId} onChange={(e) => setFormData(p => ({ ...p, layoutId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                    {layouts.filter(l => l.status !== 'draft').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Playlist</label>
                  <select value={formData.playlistId} onChange={(e) => setFormData(p => ({ ...p, playlistId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Start Time</label>
                  <input type="time" value={formData.startTime} onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">End Time</label>
                  <input type="time" value={formData.endTime} onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">Start Date</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="text-slate-300 block mb-2 font-medium">Days of Week</label>
                <div className="flex gap-1">
                  {DAYS_LABEL.map((d, i) => (
                    <button key={d} type="button" onClick={() => toggleDay(i)}
                      className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all ${
                        formData.daysOfWeek.includes(i) ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'bg-slate-950 text-slate-500 border border-slate-700 hover:border-slate-500'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  Priority Weight: <span className={`font-mono font-bold ${formData.priority >= 80 ? 'text-amber-400' : formData.priority >= 50 ? 'text-cyan-400' : 'text-slate-400'}`}>{formData.priority}</span>
                </label>
                <input type="range" min="10" max="95" value={formData.priority}
                  onChange={(e) => setFormData(p => ({ ...p, priority: Number(e.target.value) }))}
                  className="w-full accent-cyan-500" />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>10 (Default)</span><span>50 (Scheduled)</span><span>95 (High)</span>
                </div>
              </div>

              {/* Screen Groups */}
              <div>
                <label className="text-slate-300 block mb-2 font-medium">Target Screen Groups <span className="text-slate-500">(empty = all)</span></label>
                <div className="flex flex-wrap gap-2">
                  {screenGroups.map(g => (
                    <button key={g} type="button" onClick={() => toggleGroup(g)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        formData.screenGroupIds.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}>{g}</button>
                  ))}
                  {screenGroups.length === 0 && <span className="text-slate-500 text-[11px]">No screen groups defined</span>}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {editingId ? 'Save Changes' : 'Create Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
