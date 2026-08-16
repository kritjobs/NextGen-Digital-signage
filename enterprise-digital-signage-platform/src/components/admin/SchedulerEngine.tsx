import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar, Clock, Plus, Trash2, ShieldAlert, Layers, Zap,
  Edit3, X, AlertTriangle, Check, Save, Eye, Play, Megaphone, Power
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../i18n';
import { ScheduleItem, PRIORITY_LEVELS, priorityLevelOf } from '../../types/signage';

// REQ-006: 6-Level Priority — ระดับของเลข priority ตัวหนึ่ง (band mapping)
const levelDef = (n: number) => PRIORITY_LEVELS.find((d) => d.level === priorityLevelOf(n)) ?? PRIORITY_LEVELS[4];
const LEVEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  emergency: ShieldAlert, critical: AlertTriangle, scheduled: Clock,
  campaign: Megaphone, default: Layers, standby: Power,
};

const DAY_T_KEYS: TranslationKey[] = ['sch.day0', 'sch.day1', 'sch.day2', 'sch.day3', 'sch.day4', 'sch.day5', 'sch.day6'];
const PRIORITY_T_KEY: Record<string, TranslationKey> = {
  emergency: 'sch.priEmergency', critical: 'sch.priCritical', scheduled: 'sch.priScheduled',
  campaign: 'sch.priCampaign', default: 'sch.priDefault', standby: 'sch.priStandby',
};
const PRIORITY_DESC_KEY: Record<string, TranslationKey> = {
  emergency: 'sch.descEmergency', critical: 'sch.descCritical', scheduled: 'sch.descScheduled',
  campaign: 'sch.descCampaign', default: 'sch.descDefault', standby: 'sch.descStandby',
};
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
  const { t } = useTranslation();
  const { schedules, playlists, layouts, screens, addSchedule, updateSchedule, deleteSchedule, applyScheduleToScreens, resolveSchedules } = useSignageStore();
  const screenGroups = useScreenGroups();

  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
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

  // ═══ Week Calendar (Google Calendar style) ═══════════════
  // คอลัมน์ 7 วัน (อาทิตย์=0 ... เสาร์=6 — ตรงกับ daysOfWeek) × แกนเวลา 06:00–24:00
  const DAY_START_H = 6;
  const DAY_HOURS = 18;
  const ROW_PX = 40;            // ความสูงต่อชั่วโมง
  const GRID_H = DAY_HOURS * ROW_PX; // 720px
  const SNAP_MIN = 15;          // snap ครั้งละ 15 นาที
  const GUTTER_W = 56;          // ความกว้างแกนเวลา
  const DAY_ORDER = [0, 1, 2, 3, 4, 5, 6]; // อาทิตย์→เสาร์

  const timeToMin = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  const minToTime = (min: number) => {
    const m = Math.max(DAY_START_H * 60, Math.min(min, 24 * 60));
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  };
  const timeToY = (time: string) => ((timeToMin(time) - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H;
  const yToSnapMin = (y: number) => {
    const min = (y / GRID_H) * (DAY_HOURS * 60) + DAY_START_H * 60;
    return Math.round(min / SNAP_MIN) * SNAP_MIN;
  };

  // จัดวางอีเวนต์ที่ชนกันแบบ side-by-side (interval graph coloring)
  const collateEvents = (events: { id: string; startMin: number; endMin: number }[]) => {
    const sorted = [...events].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
    const tracks: number[] = [];
    const out: Record<string, { col: number; cols: number }> = {};
    for (const ev of sorted) {
      let placed = tracks.findIndex((end) => end <= ev.startMin);
      if (placed === -1) { placed = tracks.length; tracks.push(ev.endMin); }
      else tracks[placed] = ev.endMin;
      out[ev.id] = { col: placed, cols: tracks.length };
    }
    return out;
  };

  // ─── Drag state machine ────────────────────────────────────
  type DragState =
    | { mode: 'create'; startMin: number; day: number; curMin: number; curDay: number; moved: boolean; startY: number; startX: number }
    | { mode: 'move'; id: string; startMin: number; endMin: number; day: number; origDay: number; days: number[]; curMin: number; curDay: number; grabOffset: number; moved: boolean; startY: number; startX: number }
    | { mode: 'resize'; id: string; edge: 'top' | 'bottom'; startMin: number; endMin: number; curMin: number }
    | null;
  const [drag, setDrag] = useState<DragState>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const getPos = (e: React.PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const colW = (rect.width - GUTTER_W) / 7;
    const day = Math.max(0, Math.min(6, Math.floor((e.clientX - rect.left - GUTTER_W) / colW)));
    return { y, day };
  };

  const onGridPointerDown = (e: React.PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    if (e.clientX - rect.left <= GUTTER_W) return; // จับที่แกนเวลาไม่ทำอะไร
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    const el = (e.target as HTMLElement).closest('[data-sched-id]') as HTMLElement | null;
    const { y, day } = getPos(e);
    if (el?.dataset.schedId) {
      const sch = schedules.find((s) => s.id === el.dataset.schedId);
      if (!sch) return;
      const startMin = timeToMin(sch.startTime);
      const endMin = Math.max(timeToMin(sch.endTime), startMin + SNAP_MIN);
      const edge = el.dataset.resize as 'top' | 'bottom' | undefined;
      const grabMin = yToSnapMin(y);
      setDrag(edge
        ? { mode: 'resize', id: sch.id, edge, startMin, endMin, curMin: edge === 'bottom' ? endMin : startMin }
        : { mode: 'move', id: sch.id, startMin, endMin, day, origDay: day, days: [...sch.daysOfWeek], curMin: startMin, curDay: day, grabOffset: Math.max(0, grabMin - startMin), moved: false, startY: e.clientY, startX: e.clientX });
      e.preventDefault();
      return;
    }
    // ช่องว่าง → สร้างใหม่ (ลากค้าง)
    const startMin = yToSnapMin(y);
    setDrag({ mode: 'create', startMin, day, curMin: startMin, curDay: day, moved: false, startY: e.clientY, startX: e.clientX });
    e.preventDefault();
  };

  const onGridPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const { y, day } = getPos(e);
    const min = yToSnapMin(y);
    setDrag((prev) => {
      if (!prev) return prev;
      if (prev.mode === 'resize') return { ...prev, curMin: min };
      if (prev.mode === 'move') {
        // ลากแนวตั้ง: กัน offset จากจุดกด — ลากแนวนอนล้วนต้องไม่เพี้ยนเวลา
        const duration = prev.endMin - prev.startMin;
        const newStart = Math.max(DAY_START_H * 60, Math.min(min - prev.grabOffset, 24 * 60 - duration));
        return {
          ...prev, curMin: newStart, curDay: day,
          moved: prev.moved || Math.abs(e.clientY - prev.startY) > 4 || Math.abs(e.clientX - prev.startX) > 4,
        };
      }
      return {
        ...prev, curMin: min, curDay: day,
        moved: prev.moved || Math.abs(e.clientY - prev.startY) > 4 || Math.abs(e.clientX - prev.startX) > 4,
      };
    });
  };

  const openCreateAt = (preset: { startTime: string; endTime: string; daysOfWeek: number[] }) => {
    setEditingId(null);
    const year = new Date().getFullYear();
    setFormData({
      name: '', playlistId: playlists[0]?.id || '', layoutId: layouts[0]?.id || '',
      priority: 50, startTime: preset.startTime, endTime: preset.endTime,
      startDate: `${year}-01-01`, endDate: `${year}-12-31`,
      daysOfWeek: preset.daysOfWeek, screenGroupIds: [], isActive: true,
    });
    setIsFormOpen(true);
  };

  const onGridPointerUp = () => {
    if (!drag) return;
    const cur = drag;
    setDrag(null);
    if (cur.mode === 'create') {
      if (!cur.moved) return; // แค่คลิกเฉยๆ
      const start = Math.min(cur.startMin, cur.curMin);
      const end = Math.max(cur.startMin, cur.curMin);
      if (end - start >= SNAP_MIN) {
        openCreateAt({ startTime: minToTime(start), endTime: minToTime(end), daysOfWeek: [cur.day] });
      }
      return;
    }
    if (cur.mode === 'move') {
      if (!cur.moved) { openEdit(schedules.find((s) => s.id === cur.id)!); return; }
      const duration = cur.endMin - cur.startMin;
      const newStart = Math.max(DAY_START_H * 60, Math.min(cur.curMin, 24 * 60 - duration));
      const newEnd = newStart + duration;
      const patch: any = { startTime: minToTime(newStart), endTime: minToTime(newEnd) };
      // ย้ายข้ามวัน → เอาวันต้นออก + เพิ่มวันเป้าหมาย (เหมือน Google Calendar ย้าย instance)
      if (cur.curDay !== cur.origDay) {
        patch.daysOfWeek = [...cur.days.filter((d) => d !== cur.origDay), cur.curDay].sort();
      }
      updateSchedule(cur.id, patch);
      return;
    }
    // resize
    const sch = schedules.find((s) => s.id === cur.id);
    if (!sch) return;
    if (cur.edge === 'bottom') {
      const newEnd = Math.max(cur.startMin + SNAP_MIN, cur.curMin);
      if (newEnd !== timeToMin(sch.endTime)) updateSchedule(cur.id, { endTime: minToTime(newEnd) });
    } else {
      const newStart = Math.min(cur.endMin - SNAP_MIN, cur.curMin);
      if (newStart !== timeToMin(sch.startTime)) updateSchedule(cur.id, { startTime: minToTime(newStart) });
    }
  };

  // เส้นเวลาปัจจุบัน (คอลัมน์วันนี้)
  const nowDate = new Date();
  const nowDay = nowDate.getDay();
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

  // ═══ End Week Calendar ════════════════════════════════════


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <span>{t('sch.title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('sch.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-0.5">
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t('sch.viewList')}
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'calendar' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t('sch.viewCalendar')}
            </button>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30">
            <Plus className="h-4 w-4" /> {t('sch.createRule')}
          </button>
        </div>
      </div>

      {/* REQ-006: Priority Hierarchy — 6 Levels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRIORITY_LEVELS.map((lv) => {
          const Icon = LEVEL_ICONS[lv.level];
          return (
            <div key={lv.level} className={`${lv.card} border p-3 rounded-xl flex items-center gap-3`}>
              <div className={`p-2 rounded-lg ${lv.iconBg}`}><Icon className={`h-5 w-5 ${lv.iconText}`} /></div>
              <div>
                <div className={`text-[10px] font-bold uppercase ${lv.text}`}>{t('sch.priority')}{lv.min}-{lv.max}</div>
                <h4 className="font-bold text-white text-xs">{t(PRIORITY_T_KEY[lv.level])}</h4>
                <p className="text-[9px] text-slate-500 mt-0.5">{t(PRIORITY_DESC_KEY[lv.level])}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conflict Warning */}
      {conflicts.size > 0 && (
        <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-300">{t('sch.conflict')}</p>
            <p className="text-[11px] text-amber-400/80">{t('sch.conflictDetail', { count: conflicts.size })}</p>
          </div>
        </div>
      )}


      {/* ─── WEEK CALENDAR VIEW (Google Calendar style) ──────── */}
      {viewMode === 'calendar' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" /> {t('sch.weekCalendar')}
            </h3>
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-cyan-500/30 border border-cyan-400/60" />
              {t('sch.dragHint')}
            </p>
          </div>

          {/* Day headers */}
          <div className="flex" style={{ minWidth: 640 }}>
            <div className="shrink-0" style={{ width: GUTTER_W }} />
            {DAY_ORDER.map((d) => {
              const count = schedules.filter((s) => s.daysOfWeek.includes(d)).length;
              const isToday = d === nowDay;
              return (
                <div key={d} className="flex-1 text-center py-1.5 border-b border-slate-800">
                  <span className={`text-[10px] font-bold ${isToday ? 'text-cyan-400' : 'text-slate-400'}`}>{t(DAY_T_KEYS[d])}</span>
                  {count > 0 && <span className="ml-1 text-[9px] text-slate-600 font-mono">{count}</span>}
                </div>
              );
            })}
          </div>

          {/* Grid (gutter + 7 day columns) — ลากบนช่องว่าง = สร้าง · ลากตัวบล็อก = ย้าย · ลากขอบ = ขยาย */}
          <div
            ref={gridRef}
            className="relative select-none"
            style={{ minWidth: 640, touchAction: 'none', cursor: drag ? 'grabbing' : undefined }}
            onPointerDown={onGridPointerDown}
            onPointerMove={onGridPointerMove}
            onPointerUp={onGridPointerUp}
            onPointerCancel={onGridPointerUp}
          >
            {/* Time gutter + hour lines */}
            <div className="absolute top-0 bottom-0 left-0" style={{ width: GUTTER_W }}>
              {HOURS.map((h) => (
                <div key={h} className="absolute right-1 -translate-y-1/2 text-[9px] text-slate-500 font-mono" style={{ top: (h - DAY_START_H) * ROW_PX }}>
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
            <div className="absolute top-0 bottom-0" style={{ left: GUTTER_W, right: 0 }}>
              {HOURS.map((h) => (
                <div key={h} className="absolute left-0 right-0 border-t border-slate-800/60" style={{ top: (h - DAY_START_H) * ROW_PX }} />
              ))}
              {/* แบ่งครึ่งชั่วโมง (เส้นจาง) */}
              {HOURS.map((h) => (
                <div key={`${h}-30`} className="absolute left-0 right-0 border-t border-slate-800/30" style={{ top: (h - DAY_START_H) * ROW_PX + ROW_PX / 2 }} />
              ))}
            </div>

            {/* Day columns */}
            <div className="flex" style={{ marginLeft: GUTTER_W }}>
              {DAY_ORDER.map((dayIdx) => {
                const colEvents = schedules.filter((s) =>
                  s.daysOfWeek.includes(dayIdx) || (drag?.mode === 'move' && drag.id === s.id && drag.curDay === dayIdx));
                const layoutMap = collateEvents(colEvents.map((s) => ({
                  id: s.id,
                  startMin: timeToMin(s.startTime),
                  endMin: Math.max(timeToMin(s.endTime), timeToMin(s.startTime) + SNAP_MIN),
                })));
                return (
                  <div key={dayIdx} className="flex-1 relative" style={{ height: GRID_H }}>
                    {/* เส้นวันนี้ */}
                    {dayIdx === nowDay && nowMin >= DAY_START_H * 60 && nowMin <= 24 * 60 && (
                      <div
                        className="absolute left-0 right-0 z-20 border-t-2 border-rose-500/80 pointer-events-none"
                        style={{ top: ((nowMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H }}
                      >
                        <span className="absolute -top-1.5 left-0.5 text-[9px] font-bold text-rose-400">●</span>
                      </div>
                    )}

                    {colEvents.map((sch) => {
                      const isDragging = drag?.mode === 'move' && drag.id === sch.id;
                      const startMin = isDragging ? drag.curMin : timeToMin(sch.startTime);
                      const endMin = Math.max(isDragging ? drag.curMin + (drag.endMin - drag.startMin) : timeToMin(sch.endTime), startMin + SNAP_MIN);
                      const top = ((startMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H;
                      const height = ((endMin - startMin) / 60) * ROW_PX;
                      const pos = layoutMap[sch.id] ?? { col: 0, cols: 1 };
                      const hasConflict = conflicts.has(sch.id);
                      const barColor = levelDef(sch.priority).bar;
                      const colW = `${100 / pos.cols}%`;
                      const colLeft = `${(pos.col / pos.cols) * 100}%`;

                      // resize live preview (บล็อกเดียวกับที่กำลังลาก)
                      let topPx = top;
                      let heightPx = height;
                      if (drag?.mode === 'resize' && drag.id === sch.id) {
                        if (drag.edge === 'bottom') heightPx = ((drag.curMin - drag.startMin) / 60) * ROW_PX;
                        else {
                          topPx = ((drag.curMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H;
                          heightPx = ((drag.endMin - drag.curMin) / 60) * ROW_PX;
                        }
                      }

                      return (
                        <div
                          key={sch.id}
                          data-sched-id={sch.id}
                          className={`absolute rounded-md border ${barColor} overflow-hidden ${
                            !sch.isActive ? 'opacity-30' : ''
                          } ${hasConflict ? 'ring-1 ring-amber-400' : ''} ${
                            isDragging ? 'ring-2 ring-white/60 shadow-lg z-30' : 'z-10'
                          }`}
                          style={{ top: topPx, height: Math.max(14, heightPx), left: colLeft, width: colW, cursor: 'grab' }}
                          title={`${sch.name} (${sch.startTime}–${sch.endTime}) P:${sch.priority}`}
                        >
                          {/* body (ลากย้าย) */}
                          <div className="absolute inset-0 px-1 py-0.5 text-[9px] font-bold text-white truncate pointer-events-none">
                            {heightPx > 22 ? `${sch.name} · ${sch.startTime}–${sch.endTime}` : (heightPx > 14 ? sch.name : '')}
                          </div>
                          {/* ขอบบน/ล่าง (ลากขยาย) */}
                          <div data-sched-id={sch.id} data-resize="top" className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize z-20" />
                          <div data-sched-id={sch.id} data-resize="bottom" className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20" />
                        </div>
                      );
                    })}

                    {/* Ghost สร้างใหม่ (ลากบนช่องว่าง) */}
                    {drag?.mode === 'create' && drag.day === dayIdx && (
                      <div
                        className="absolute left-0 right-0 rounded-md bg-cyan-500/30 border border-cyan-400/70 z-20 pointer-events-none"
                        style={{
                          top: (Math.min(drag.startMin, drag.curMin) - DAY_START_H * 60) / (DAY_HOURS * 60) * GRID_H,
                          height: Math.max(SNAP_MIN, Math.abs(drag.curMin - drag.startMin)) / 60 * ROW_PX,
                        }}
                      />
                    )}

                    {/* Empty hint */}
                    {schedules.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-[11px] pointer-events-none">
                        {t('sch.noRules')} — {t('sch.dragHint')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend — REQ-006: 6 levels */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-800 text-[10px]">
            {PRIORITY_LEVELS.map((lv) => (
              <span key={lv.level} className="flex items-center gap-1">
                <span className={`w-3 h-3 rounded ${lv.dot}`} /> {t(PRIORITY_T_KEY[lv.level])} ({lv.min}-{lv.max})
              </span>
            ))}
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-amber-400 bg-transparent" /> {t('sch.conflictLabel')}</span>
          </div>
        </div>
      )}


      {/* ─── LIST VIEW ──────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            {t('sch.activeRules', { count: schedules.length })}
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
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${levelDef(sch.priority).badge}`}>
                      {t(PRIORITY_T_KEY[levelDef(sch.priority).level])} · {sch.priority}
                    </span>
                    <div className="flex items-center gap-2">
                      {hasConflict && (
                        <span className="text-[9px] text-amber-400 flex items-center gap-0.5" title={`Conflicts with: ${conflicts.get(sch.id)?.join(', ')}`}>
                          <AlertTriangle className="h-3 w-3" /> {t('sch.conflictLabel')}
                        </span>
                      )}
                      <button onClick={() => updateSchedule(sch.id, { isActive: !sch.isActive })}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sch.isActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-950 text-slate-500 border border-slate-700'
                        }`}>
                        {sch.isActive ? t('sch.on') : t('sch.off')}
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="font-bold text-white text-sm">{sch.name}</h4>

                  {/* Details */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">{t('sch.layout')}</span><span className="text-cyan-400 font-medium">{layout?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{t('sch.playlist')}</span><span className="text-indigo-400 font-medium">{playlist?.name || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{t('sch.timeWindow')}</span><span className="font-mono text-white">{sch.startTime} – {sch.endTime}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">{t('sch.screens')}</span><span className="text-slate-300">{sch.screenGroupIds.length > 0 ? sch.screenGroupIds.join(', ') : t('sch.all')}</span></div>
                  </div>

                  {/* Days */}
                  <div className="flex gap-1">
                    {DAY_T_KEYS.map((dk, i) => (
                      <span key={dk} className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        sch.daysOfWeek.includes(i) ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-600'
                      }`}>{t(dk)}</span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(sch)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-cyan-400">
                        <Edit3 className="h-3.5 w-3.5" /> {t('sch.edit')}
                      </button>
                      <button onClick={() => applyScheduleToScreens(sch.id)}
                        className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950 px-2 py-1 rounded-lg">
                        <Play className="h-3 w-3" /> {t('sch.applyNow')}
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
                  {editingId ? t('sch.editTitle') : t('sch.createTitle')}
                </h3>
                <p className="text-[9px] text-amber-400 mt-0.5">{t('sch.priorityHint')}</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              {/* Name */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">{t('sch.ruleName')}</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Daily Cafeteria Lunch Menu"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:border-cyan-500 focus:outline-none" required />
              </div>

              {/* Layout + Playlist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{t('sch.layoutField')}</label>
                  <select value={formData.layoutId} onChange={(e) => setFormData(p => ({ ...p, layoutId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                    {layouts.filter(l => l.status !== 'draft').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{t('sch.playlistField')}</label>
                  <select value={formData.playlistId} onChange={(e) => setFormData(p => ({ ...p, playlistId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white">
                    {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{t('sch.startTime')}</label>
                  <input type="time" value={formData.startTime} onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{t('sch.endTime')}</label>
                  <input type="time" value={formData.endTime} onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{t('sch.startDate')}</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">{t('sch.endDate')}</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono" />
                </div>
              </div>

              {/* Days of Week */}
              <div>
                <label className="text-slate-300 block mb-2 font-medium">{t('sch.daysOfWeek')}</label>
                <div className="flex gap-1">
                  {DAY_T_KEYS.map((dk, i) => (
                    <button key={dk} type="button" onClick={() => toggleDay(i)}
                      className={`flex-1 py-2 rounded-lg font-bold text-[11px] transition-all ${
                        formData.daysOfWeek.includes(i) ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'bg-slate-950 text-slate-500 border border-slate-700 hover:border-slate-500'
                      }`}>{t(dk)}</button>
                  ))}
                </div>
              </div>

              {/* Priority — REQ-006: slider ครอบ 5 ระดับ (1-90) ส่วน Emergency (91-100) สงวนไว้ให้ระบบฉุกเฉิน */}
              <div>
                <label className="text-slate-300 block mb-1 font-medium">
                  {t('sch.priorityWeight')}<span className={`font-mono font-bold ${levelDef(formData.priority).text}`}>{formData.priority} <span className="text-[9px] font-normal uppercase opacity-80">({t(PRIORITY_T_KEY[levelDef(formData.priority).level])})</span></span>
                </label>
                <input type="range" min="1" max="90" value={formData.priority}
                  onChange={(e) => setFormData(p => ({ ...p, priority: Number(e.target.value) }))}
                  className="w-full accent-cyan-500" />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>1 (Standby)</span><span>30 (Campaign)</span><span>50 (Scheduled)</span><span>90 (Critical)</span>
                </div>
              </div>

              {/* Screen Groups */}
              <div>
                <label className="text-slate-300 block mb-2 font-medium">{t('sch.targetGroups')}<span className="text-slate-500">{t('sch.emptyAll')}</span></label>
                <div className="flex flex-wrap gap-2">
                  {screenGroups.map(g => (
                    <button key={g} type="button" onClick={() => toggleGroup(g)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                        formData.screenGroupIds.includes(g) ? 'bg-indigo-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-700 hover:border-slate-500'
                      }`}>{g}</button>
                  ))}
                  {screenGroups.length === 0 && <span className="text-slate-500 text-[11px]">{t('sch.noGroups')}</span>}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t('sch.cancel')}</button>
                <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white flex items-center gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  {editingId ? t('sch.saveChanges') : t('sch.createRule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
