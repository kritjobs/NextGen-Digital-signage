import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar, Clock, Plus, Trash2, ShieldAlert, Layers, Zap,
  Edit3, X, AlertTriangle, Check, Save, Eye, EyeOff, Play, Megaphone, Power,
  ChevronLeft, ChevronRight, Palette, Move, Undo2, Redo2, History, Copy, Download, Upload, ChevronUp, ChevronDown, Bookmark, FlaskConical, SkipBack, SkipForward
} from 'lucide-react';
import { useSignageStore, broadcastDragSync } from '../../store/useSignageStore';
import { schedulerSnapshotApi } from '../../services/api';
import { useTranslation } from '../../hooks/useTranslation';
import type { TranslationKey } from '../../i18n';
import { ScheduleItem, Playlist, HistoryEntry, PRIORITY_LEVELS, priorityLevelOf } from '../../types/signage';

// REQ-006: 6-Level Priority — ระดับของเลข priority ตัวหนึ่ง (band mapping)
const levelDef = (n: number) => PRIORITY_LEVELS.find((d) => d.level === priorityLevelOf(n)) ?? PRIORITY_LEVELS[4];
const LEVEL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  emergency: ShieldAlert, critical: AlertTriangle, scheduled: Clock,
  campaign: Megaphone, default: Layers, standby: Power,
};

const DAY_T_KEYS: TranslationKey[] = ['sch.day0', 'sch.day1', 'sch.day2', 'sch.day3', 'sch.day4', 'sch.day5', 'sch.day6'];
const MONTH_T_KEYS: TranslationKey[] = ['sch.month0', 'sch.month1', 'sch.month2', 'sch.month3', 'sch.month4', 'sch.month5', 'sch.month6', 'sch.month7', 'sch.month8', 'sch.month9', 'sch.month10', 'sch.month11'];
const PRIORITY_T_KEY: Record<string, TranslationKey> = {
  emergency: 'sch.priEmergency', critical: 'sch.priCritical', scheduled: 'sch.priScheduled',
  campaign: 'sch.priCampaign', default: 'sch.priDefault', standby: 'sch.priStandby',
};
const PRIORITY_DESC_KEY: Record<string, TranslationKey> = {
  emergency: 'sch.descEmergency', critical: 'sch.descCritical', scheduled: 'sch.descScheduled',
  campaign: 'sch.descCampaign', default: 'sch.descDefault', standby: 'sch.descStandby',
};

// สีประจำเพลย์ลิสต์ — แยกสีให้เห็นชัดว่าแต่ละเพลย์ลิสต์ (เหมือน Google Calendar แยกสีแต่ละปฏิทิน)
// จัดสรรตามลำดับ id ที่เรียง (ใน component) → คงที่และไม่ชนกันเมื่อมีเพลย์ลิสต์ ≤ 12
// แต่ละสียังมี hex — ใช้ทั้งตอนผู้ใช้เลือกสีเอง (บันทึกลง DB) และ render ด้วย inline style สำหรับ custom color
type PlaylistColor = { hex: string; bar: string; dot: string; custom?: boolean };
const PLAYLIST_COLORS: PlaylistColor[] = [
  { hex: '#f43f5e', bar: 'bg-rose-500/60 border-rose-500', dot: 'bg-rose-500' },
  { hex: '#f97316', bar: 'bg-orange-500/60 border-orange-500', dot: 'bg-orange-500' },
  { hex: '#f59e0b', bar: 'bg-amber-500/60 border-amber-500', dot: 'bg-amber-500' },
  { hex: '#84cc16', bar: 'bg-lime-500/60 border-lime-500', dot: 'bg-lime-500' },
  { hex: '#10b981', bar: 'bg-emerald-500/60 border-emerald-500', dot: 'bg-emerald-500' },
  { hex: '#14b8a6', bar: 'bg-teal-500/60 border-teal-500', dot: 'bg-teal-500' },
  { hex: '#06b6d4', bar: 'bg-cyan-500/60 border-cyan-500', dot: 'bg-cyan-500' },
  { hex: '#0ea5e9', bar: 'bg-sky-500/60 border-sky-500', dot: 'bg-sky-500' },
  { hex: '#6366f1', bar: 'bg-indigo-500/60 border-indigo-500', dot: 'bg-indigo-500' },
  { hex: '#8b5cf6', bar: 'bg-violet-500/60 border-violet-500', dot: 'bg-violet-500' },
  { hex: '#d946ef', bar: 'bg-fuchsia-500/60 border-fuchsia-500', dot: 'bg-fuchsia-500' },
  { hex: '#ec4899', bar: 'bg-pink-500/60 border-pink-500', dot: 'bg-pink-500' },
];
// hex (#rgb/#rrggbb) → rgba string (สำหรับ custom color ที่ไม่มี Tailwind class)
const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return undefined;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};
// inline style สำหรับบล็อก/ชิปสี custom (ไม่มี Tailwind class)
const plBarStyle = (c: PlaylistColor | null): React.CSSProperties | undefined =>
  c?.custom && c.hex ? { backgroundColor: hexA(c.hex, 0.55), borderColor: c.hex } : undefined;
const plDotStyle = (c: PlaylistColor | null): React.CSSProperties | undefined =>
  c?.custom && c.hex ? { backgroundColor: c.hex } : undefined;
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
  const { schedules, playlists, layouts, screens, addSchedule, updateSchedule, deleteSchedule, updatePlaylist, applyScheduleToScreens, resolveSchedules, undoStack, redoStack, setUndoStack, setRedoStack, clearHistory } = useSignageStore();
  // การเลือกหลายอีเวนต์ — เก็บใน store เพื่ออยู่รอดข้ามมุมมอง (เลือกใน Month → สลับไป Week แล้วลากกลุ่มได้)
  const selectedIds = useSignageStore((s) => s.selectedScheduleIds);
  const toggleSelected = useSignageStore((s) => s.toggleSelectedSchedule);
  const clearSelected = useSignageStore((s) => s.clearSelectedSchedules);
  // ลากสดจากแท็บอื่น (BroadcastChannel) — แท็บนี้เห็น ghost อีเวนต์ตามตำแหน่งลากจริงของอีกแท็บ
  const remoteDrag = useSignageStore((s) => s.remoteDrag);
  const screenGroups = useScreenGroups();

  // สีประจำเพลย์ลิสต์ — ถ้าเพลย์ลิสต์มี `color` (hex ที่ผู้ใช้ตั้งเอง บันทึกใน DB) → ใช้สีนั้น
  // ถ้าไม่มี → จัดสรรจากจาน 12 สีตามลำดับ id ที่เรียง (คงที่ ไม่ชนกัน)
  const playlistColorMap = useMemo(() => {
    const sorted = [...playlists].sort((a, b) => a.id.localeCompare(b.id));
    return new Map(sorted.map((p, i) => [p.id, PLAYLIST_COLORS[i % PLAYLIST_COLORS.length]]));
  }, [playlists]);
  const playlistColorOf = (playlistId?: string): PlaylistColor | null => {
    if (!playlistId) return null;
    const p = playlists.find((x) => x.id === playlistId);
    if (p?.color) return { hex: p.color, bar: '', dot: '', custom: true };
    return playlistColorMap.get(playlistId) ?? null;
  };

  // ซ่อน/แสดงอีเวนต์ตามเพลย์ลิสต์ (Google Calendar toggle calendar) — ใช้ทุกมุมมอง
  const [hiddenPlaylists, setHiddenPlaylists] = useState<Set<string>>(new Set());
  const togglePlaylistVisible = (id: string) => setHiddenPlaylists((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const visibleSchedules = useMemo(
    () => schedules.filter((s) => !s.playlistId || !hiddenPlaylists.has(s.playlistId)),
    [schedules, hiddenPlaylists],
  );

  // เลือกสีเพลย์ลิสต์เอง (บันทึกลง DB ผ่าน updatePlaylist → playlistApi.update)
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const [colorPickerValue, setColorPickerValue] = useState('#6366f1');
  const openColorPicker = (p: Playlist) => {
    setColorPickerFor(p.id);
    setColorPickerValue(p.color || playlistColorOf(p.id)?.hex || '#6366f1');
  };
  const savePlaylistColor = () => {
    if (!colorPickerFor) return;
    const before = snapshotPlaylistOf([colorPickerFor]);
    updatePlaylist(colorPickerFor, { color: colorPickerValue, updatedAt: new Date().toISOString() });
    commitHistory(t('sch.histColor'), { playlists: { before, after: snapshotPlaylistOf([colorPickerFor]) } });
    setColorPickerFor(null);
  };

  // view mode + วันที่ — เก็บใน store เพื่อซิงก์ข้ามแท็บ (BroadcastChannel: แท็บหนึ่งสลับ view อีกแท็บตาม)
  const viewMode = useSignageStore((s) => s.schedulerViewMode);
  const schedulerViewDate = useSignageStore((s) => s.schedulerViewDate);
  const setSchedulerView = useSignageStore((s) => s.setSchedulerView);
  const fmtYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseYMD = (ymd: string) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const viewDate = useMemo(() => parseYMD(schedulerViewDate), [schedulerViewDate]);
  const setViewMode = (m: 'list' | 'day' | 'week' | 'month') => setSchedulerView(m, schedulerViewDate);
  const setViewDate = (d: Date | ((prev: Date) => Date)) => {
    const next = typeof d === 'function' ? (d as (prev: Date) => Date)(viewDate) : d;
    setSchedulerView(viewMode, fmtYMD(next));
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // legend เพลย์ลิสต์ที่กำลังลากกฎไปวาง (ไฮไลต์ตอน hover)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  // ประวัติการแก้ไข dropdown (รายการล่าสุด + ล้างประวัติ)
  const [historyOpen, setHistoryOpen] = useState(false);


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

  // ─── Undo/Redo: ประวัติการแก้ไขทุกแบบ (ลาก/ฟอร์ม/สีเพลย์ลิสต์) — เก็บใน store เพื่ออยู่รอดข้ามแท็บ ──
  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y — กดย้อนกลับได้ทันที ไม่ต้องกดบันทึก
  // สแนปชอตกฎจาก store ปัจจุบัน (ใช้ getState เพื่อให้ `after` เห็นค่าที่ update ไปแล้ว)
  const snapshotOf = (ids: string[]) => {
    const state = useSignageStore.getState();
    const snap: Record<string, ScheduleItem> = {};
    ids.forEach((id) => { const s = state.schedules.find((x) => x.id === id); if (s) snap[id] = s; });
    return snap;
  };
  const snapshotPlaylistOf = (ids: string[]) => {
    const state = useSignageStore.getState();
    const snap: Record<string, Playlist> = {};
    ids.forEach((id) => { const p = state.playlists.find((x) => x.id === id); if (p) snap[id] = p; });
    return snap;
  };
  // บันทึกประวัติ — 1 entry เก็บได้ทั้งกฎ + เพลย์ลิสต์ · ข้ามรายการที่ไม่มีการเปลี่ยนแปลงจริง (no-op)
  const playlistNameOf = (id?: string) => (id ? playlists.find((p) => p.id === id)?.name : undefined) || '—';
  const dayAbbr = (ds: number[]) => ds.map((d) => t(DAY_T_KEYS[d])).join(',');
  // สร้างตัวอย่างการเปลี่ยนแปลง (ชื่อกฎ + ก่อน→หลัง ของเวลา/วัน/เพลย์ลิสต์/สี) — เก็บใน history entry ตอน push เพื่อแสดงใน dropdown
  const fmtDetail = (snap: {
    schedules?: { before: Record<string, ScheduleItem>; after: Record<string, ScheduleItem> };
    playlists?: { before: Record<string, Playlist>; after: Record<string, Playlist> };
  }): string => {
    const parts: string[] = [];
    if (snap.schedules) {
      const ids = new Set([...Object.keys(snap.schedules.before), ...Object.keys(snap.schedules.after)]);
      ids.forEach((id) => {
        const b = snap.schedules!.before[id];
        const a = snap.schedules!.after[id];
        const name = (a || b)?.name || id;
        if (!b && a) { parts.push(`+ ${name}`); return; }
        if (b && !a) { parts.push(`− ${name}`); return; }
        const ch: string[] = [];
        if (b.name !== a.name) ch.push(`"${b.name}" → "${a.name}"`);
        if (b.startTime !== a.startTime || b.endTime !== a.endTime) ch.push(`${b.startTime}–${b.endTime} → ${a.startTime}–${a.endTime}`);
        const bd = [...b.daysOfWeek].sort().join(','); const ad = [...a.daysOfWeek].sort().join(',');
        if (bd !== ad) ch.push(`${dayAbbr(b.daysOfWeek)} → ${dayAbbr(a.daysOfWeek)}`);
        if (b.isActive !== a.isActive) ch.push(`${b.isActive ? t('sch.on') : t('sch.off')} → ${a.isActive ? t('sch.on') : t('sch.off')}`);
        if ((b.playlistId || '') !== (a.playlistId || '')) ch.push(`${playlistNameOf(b.playlistId)} → ${playlistNameOf(a.playlistId)}`);
        if (ch.length) parts.push(`${name}: ${ch.join(' · ')}`);
      });
    }
    if (snap.playlists) {
      Object.keys(snap.playlists.after).forEach((id) => {
        const b = snap.playlists!.before[id];
        const a = snap.playlists!.after[id];
        if (b && a && (b.color || '') !== (a.color || '')) parts.push(`${a.name}: ${b.color || '—'} → ${a.color || '—'}`);
      });
    }
    return parts.join(' | ');
  };
  const commitHistory = (label: string, snap: {
    schedules?: { before: Record<string, ScheduleItem>; after: Record<string, ScheduleItem> };
    playlists?: { before: Record<string, Playlist>; after: Record<string, Playlist> };
  }) => {
    const stripMeta = (item: any) => { const { updatedAt, ...rest } = item ?? {}; return rest; };
    const sectionChanged = (before: Record<string, any>, after: Record<string, any>) =>
      (Object.keys(before).length === 0 && Object.keys(after).length > 0) ||
      Object.keys(before).some((id) => {
        const a = before[id]; const b = after[id];
        if (!a || !b) return true;
        return JSON.stringify(stripMeta(a)) !== JSON.stringify(stripMeta(b));
      }) ||
      // มี id ใหม่ใน after (เช่น import ที่เพิ่มกฎล้วน ๆ) — ต้องนับเป็นการเปลี่ยนแปลงด้วย
      Object.keys(after).some((id) => !(id in before));
    const changed = (snap.schedules && sectionChanged(snap.schedules.before, snap.schedules.after))
      || (snap.playlists && sectionChanged(snap.playlists.before, snap.playlists.after));
    if (!changed) return;
    // โหมดทดลอง (sandbox): undo ไม่จำกัด — ไม่งัด history เก่าทิ้ง (ปกติเก็บ 50 entry)
    // grp: การแก้ไขต่อเนื่อง (< 60 วิ) อยู่กลุ่มเดียวกัน → ปุ่ม "ย้อนขั้นตอนใหญ่" ย้อนทั้งกลุ่ม
    setUndoStack((prev) => {
      const last = prev[prev.length - 1];
      const grp = last && Date.now() - last.time < 60000 ? (last.grp ?? last.time) : Date.now();
      return [...(sandboxRef.current ? prev : prev.slice(-49)), { label, time: Date.now(), grp, detail: fmtDetail(snap), ...snap }];
    });
    setRedoStack(() => []);
  };
  const commitSchedules = (label: string, before: Record<string, ScheduleItem>, after: Record<string, ScheduleItem>) =>
    commitHistory(label, { schedules: { before, after } });
  // ใช้คืนกฎ (upsert — ถ้าถูกลบไปแล้วให้สร้างใหม่) — ใช้กับ undo/redo ทั้งคู่
  // await ทีละตัว (store คืน Promise ของ PATCH) → กัน PATCH ไปถึง DB เรียงสลับกันตอนย้อน/ทำซ้ำหลายขั้นตอนพร้อมกัน
  const upsertSchedules = async (map: Record<string, ScheduleItem>) => {
    const state = useSignageStore.getState();
    for (const [id, item] of Object.entries(map)) {
      if (state.schedules.some((s) => s.id === id)) await updateSchedule(id, item);
      // สร้างใหม่: normalize เวลาเป็น HH:MM (store ได้ 'HH:MM:SS' จาก DB — CreateScheduleSchema ต้องการ HH:MM)
      else await addSchedule({ ...item, startTime: item.startTime.slice(0, 5), endTime: item.endTime.slice(0, 5) } as ScheduleItem);
    }
  };
  const applyUndo = async (entry: HistoryEntry) => {
    if (entry.schedules) {
      const { before, after } = entry.schedules;
      await upsertSchedules(before); // คืนสภาพเดิม (กฎที่ถูกลบ → สร้างใหม่)
      for (const id of Object.keys(after)) if (!(id in before)) await deleteSchedule(id); // กฎที่สร้างใหม่ → ลบ
    }
    // ส่งเฉพาะ field color (ไม่ส่งทั้งออบเจกต์ — กันลบ/สร้าง items ซ้ำ) · ใช้ ?? '' เพราะ store แมปค่าว่างเป็น undefined (JSON.stringify จะทิ้ง key)
    if (entry.playlists) for (const [id, item] of Object.entries(entry.playlists.before)) await updatePlaylist(id, { color: item.color ?? '' });
  };
  const applyRedo = async (entry: HistoryEntry) => {
    if (entry.schedules) {
      const { before, after } = entry.schedules;
      await upsertSchedules(after); // ทำซ้ำการเปลี่ยนแปลง (กฎที่ถูก undo ลบไป → สร้างใหม่)
      for (const id of Object.keys(before)) if (!(id in after)) await deleteSchedule(id); // กฎที่ถูกลบ → ลบอีก
    }
    if (entry.playlists) for (const [id, item] of Object.entries(entry.playlists.after)) await updatePlaylist(id, { color: item.color ?? '' });
  };
  const undo = () => {
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    void applyUndo(entry);
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, entry]);
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    void applyRedo(entry);
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, entry]);
  };
  // ── ย้อน/ทำซ้ำ "ขั้นตอนใหญ่" — ย้อนทั้งกลุ่มของการแก้ไขต่อเนื่อง (grp เดียวกัน) ทีเดียว ──
  // serialize ทีละ entry (await) → PATCH ไปถึง DB เรียงตามลำดับ ไม่สลับกัน · pop stack ก่อน apply → กัน double-click
  // กลุ่ม = รายการต่อเนื่องจากบนสุดที่มี grp เดียวกัน (อัปเดตทุก render — ใช้ทั้งปุ่ม, tooltip และเมนูคลิกขวา)
  const groupOf = (stack: HistoryEntry[]): HistoryEntry[] => {
    if (stack.length === 0) return [];
    const grp = stack[stack.length - 1].grp ?? -1;
    let i = stack.length - 1;
    while (i >= 0 && (stack[i].grp ?? -1) === grp) i--;
    return stack.slice(i + 1);
  };
  const undoGroup = useMemo(() => groupOf(undoStack), [undoStack]); // [เก่าที่สุด .. ใหม่สุด] — ใหม่สุด = บนสุด
  const redoGroup = useMemo(() => groupOf(redoStack), [redoStack]);
  // ฟังก์ชัน apply รับรายการตามลำดับที่จะ apply แล้ว (ไม่กลับลำดับในตัว — ย้อน: ใหม่→เก่า · ทำซ้ำ: เก่า→ใหม่)
  const applyUndoEntries = async (entries: HistoryEntry[]) => { for (const e of entries) await applyUndo(e); };
  const applyRedoEntries = async (entries: HistoryEntry[]) => { for (const e of entries) await applyRedo(e); };
  const undoBigStep = async () => {
    if (undoStack.length === 0) return;
    const entries = undoGroup; // [e1..e3] เก่า→ใหม่
    setUndoStack((prev) => prev.slice(0, prev.length - entries.length));
    await applyUndoEntries([...entries].reverse()); // ย้อนใหม่สุดก่อน
    setRedoStack((prev) => [...prev, ...[...entries].reverse()]); // ต่อท้ายแบบกลับลำดับ → top = entry แรกของกลุ่ม
  };
  const redoBigStep = async () => {
    if (redoStack.length === 0) return;
    const entries = redoGroup; // [e3..e1] — redo ต้องเริ่มจาก e1 (ถูก undo ล่าสุด)
    setRedoStack((prev) => prev.slice(0, prev.length - entries.length));
    await applyRedoEntries([...entries].reverse()); // e1→e2→e3
    setUndoStack((prev) => [...prev, ...[...entries].reverse()]); // คืนตามลำดับ apply → top = entry สุดท้าย (เหมือน redo ทีละขั้น)
  };
  // ── เมนูคลิกขวาบนปุ่มขั้นตอนใหญ่ — เลือกเฉพาะบางรายการในกลุ่มที่จะย้อน/ทำซ้ำ ──
  const [stepMenu, setStepMenu] = useState<'undo' | 'redo' | null>(null);
  const [stepChecked, setStepChecked] = useState<boolean[]>([]);
  const openStepMenu = (kind: 'undo' | 'redo') => {
    const group = kind === 'undo' ? undoGroup : redoGroup;
    setStepChecked(group.map(() => true));
    setStepMenu(kind);
    setHistoryOpen(false);
  };
  // รายการที่จะย้อนจริง = เลือกต่อเนื่องจากบนสุด (รายการใต้ช่องว่างไม่ถูกย้อน — ก่อน/หลังเป็น snapshot เต็ม ย้อนข้ามไม่ได้)
  const stepRunCount = () => {
    if (!stepMenu) return 0;
    let n = 0;
    for (let j = 0; j < stepChecked.length; j++) { if (!stepChecked[j]) break; n++; }
    return n;
  };
  const confirmStepMenu = async () => {
    if (!stepMenu) return;
    const kind = stepMenu;
    const group = kind === 'undo' ? undoGroup : redoGroup;
    const n = stepRunCount();
    if (n === 0) { setStepMenu(null); return; }
    const topFirst = [...group].reverse(); // ลำดับที่จะ apply (บนสุดก่อน)
    const run = topFirst.slice(0, n);
    setStepMenu(null);
    if (kind === 'undo') {
      setUndoStack((prev) => prev.slice(0, prev.length - n));
      await applyUndoEntries(run);
      setRedoStack((prev) => [...prev, ...run]);
    } else {
      setRedoStack((prev) => prev.slice(0, prev.length - n));
      await applyRedoEntries(run);
      setUndoStack((prev) => [...prev, ...run]);
    }
  };

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
      const before = snapshotOf([editingId]);
      updateSchedule(editingId, { ...formData, updatedAt: new Date().toISOString() } as any);
      commitHistory(t('sch.histEdit'), { schedules: { before, after: snapshotOf([editingId]) } });
    } else {
      const id = 'sch-' + Date.now();
      addSchedule({
        id,
        ...formData,
        screenIds: [],
      } as ScheduleItem);
      commitHistory(t('sch.histCreate'), { schedules: { before: {}, after: snapshotOf([id]) } });
    }
    setIsFormOpen(false);
  };

  // คัดลอกกฎจากค่าปัจจุบันในฟอร์มทันที (id ใหม่) — ต้นฉบับคงเดิม · บันทึกเป็น history "Duplicate" (undo = ลบ)
  const handleDuplicate = () => {
    if (!editingId) return;
    const id = 'sch-' + Date.now();
    addSchedule({
      id,
      ...formData,
      // normalize เวลาเป็น HH:MM (store ได้ 'HH:MM:SS' จาก DB — CreateScheduleSchema ต้องการ HH:MM)
      startTime: formData.startTime.slice(0, 5),
      endTime: formData.endTime.slice(0, 5),
      screenIds: [],
    } as ScheduleItem);
    commitHistory(t('sch.histDuplicate'), { schedules: { before: {}, after: snapshotOf([id]) } });
    setIsFormOpen(false);
  };

  // ลบกฎจาก modal — มี confirm กันลบโดยไม่ตั้งใจ · บันทึกเป็น history "Delete" (undo = สร้างกลับ)
  const handleDeleteFromModal = () => {
    if (!editingId) return;
    if (!window.confirm(t('sch.confirmDelete'))) return;
    const before = snapshotOf([editingId]);
    deleteSchedule(editingId);
    commitHistory(t('sch.histDelete'), { schedules: { before, after: {} } });
    setEditingId(null);
    setIsFormOpen(false);
  };

  // คลิก history entry → กระโดดไปกฎนั้น (เปิด modal แก้ไข) หรือเปิดตัวเลือกสีของเพลย์ลิสต์
  const jumpToEntry = (en: HistoryEntry) => {
    setHistoryOpen(false);
    const sid = [...Object.keys(en.schedules?.after || {}), ...Object.keys(en.schedules?.before || {})]
      .find((id) => schedules.some((s) => s.id === id));
    if (sid) {
      const sch = schedules.find((s) => s.id === sid);
      if (sch) { openEdit(sch); return; }
    }
    const plId = Object.keys(en.playlists?.after || {}).find((id) => playlists.some((p) => p.id === id));
    if (plId) {
      const pl = playlists.find((p) => p.id === plId);
      if (pl) openColorPicker(pl);
    }
  };

  // ─── Export / Import กฎ Scheduler (JSON — รวมประวัติการแก้ไข) — สำรอง/ย้ายระหว่างระบบ ──
  const importFileRef = useRef<HTMLInputElement | null>(null);
  // ลาก/วางไฟล์ JSON ลงบนหน้าทั้งหมด = เปิด diff preview นำเข้าได้ทันที (drop zone ทั่วทั้งหน้า)
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileDragDepth = useRef(0);
  const onRootDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    fileDragDepth.current += 1;
    setFileDragOver(true);
  };
  const onRootDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onRootDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
    fileDragDepth.current = Math.max(0, fileDragDepth.current - 1);
    if (fileDragDepth.current === 0) setFileDragOver(false);
  };
  const onRootDrop = (e: React.DragEvent) => {
    e.preventDefault();
    fileDragDepth.current = 0;
    setFileDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) importSchedulerData(f);
  };
  const exportSchedulerData = () => {
    const st = useSignageStore.getState();
    const payload = {
      app: 'nextgen-digital-signage',
      type: 'scheduler-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      schedules: st.schedules,
      playlists: st.playlists.map((p) => ({ id: p.id, name: p.name, color: p.color || '' })),
      history: { undo: st.undoStack, redo: st.redoStack },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduler-backup-${fmtYMD(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  // ── เขียน backup ลง DB (ใช้ร่วม: import + กู้คืนสแนปชอต) — upsert กฎ + กู้สี + คืน stacks ──
  // บันทึก undo/redo ระดับระบบ 1 entry (ก่อน/หลัง ทั้งหมด) → Ctrl+Z หลัง import/กู้คืน = ย้อนกลับทุกอย่าง
  const applySchedulerBackup = (data: any, opts?: { historyLabel?: string }) => {
    const st = useSignageStore.getState();
    // สถานะเดิมทั้งหมด (กฎ + เพลย์ลิสต์) — ก่อนเขียนอะไรลง DB
    const beforeSched: Record<string, ScheduleItem> = {};
    const beforePl: Record<string, Playlist> = {};
    st.schedules.forEach((s) => { beforeSched[s.id] = s; });
    st.playlists.forEach((p) => { beforePl[p.id] = p; });
    let created = 0, updated = 0;
    (Array.isArray(data.schedules) ? data.schedules : []).forEach((sch: any) => {
      if (!sch?.id || !sch?.name) return;
      // normalize เวลาเป็น HH:MM (CreateScheduleSchema ต้องการ HH:MM)
      const item: ScheduleItem = { ...sch, startTime: String(sch.startTime).slice(0, 5), endTime: String(sch.endTime).slice(0, 5) };
      if (st.schedules.some((s) => s.id === item.id)) { updateSchedule(item.id, item); updated++; }
      else { addSchedule(item as ScheduleItem); created++; }
    });
    (Array.isArray(data.playlists) ? data.playlists : []).forEach((pl: any) => {
      if (pl?.id && pl.color) updatePlaylist(pl.id, { color: pl.color, updatedAt: new Date().toISOString() });
    });
    if (data.history && Array.isArray(data.history.undo)) {
      setUndoStack(() => data.history.undo);
      setRedoStack(() => data.history.redo);
    }
    // สถานะใหม่ทั้งหมด — 1 entry ใน history (undo/redo ระดับระบบ: ย้อน/ทำซ้ำทั้งการนำเข้า/กู้คืน)
    const st2 = useSignageStore.getState();
    const afterSched: Record<string, ScheduleItem> = {};
    const afterPl: Record<string, Playlist> = {};
    st2.schedules.forEach((s) => { afterSched[s.id] = s; });
    st2.playlists.forEach((p) => { afterPl[p.id] = p; });
    commitHistory(opts?.historyLabel ?? t('sch.histImport'), { schedules: { before: beforeSched, after: afterSched }, playlists: { before: beforePl, after: afterPl } });
    return { created, updated };
  };
  // ── schema mapping: แปลงแถวจากไฟล์ภายนอก (snake_case / ชื่อฟิลด์อื่น) → ScheduleItem มาตรฐาน ──
  const normalizeScheduleRow = (raw: any, idx: number): ScheduleItem | null => {
    if (!raw || typeof raw !== 'object') return null;
    const id = String(raw.id ?? raw.scheduleId ?? raw.schedule_id ?? '').trim() || `sch-import-${Date.now()}-${idx}`;
    const name = String(raw.name ?? raw.title ?? raw.label ?? '').trim();
    if (!name) return null;
    const toTime = (v: any): string => { const s = String(v ?? '').trim(); return s ? s.slice(0, 5) : '08:00'; };
    const days = raw.daysOfWeek ?? raw.days_of_week ?? raw.weekdays ?? raw.days;
    const daysArr: number[] = Array.isArray(days)
      ? days.map((d: any) => Number(d)).filter((n: number) => Number.isInteger(n) && n >= 0 && n <= 6)
      : [];
    return {
      id, name,
      playlistId: String(raw.playlistId ?? raw.playlist_id ?? raw.playlist ?? '') || undefined,
      layoutId: String(raw.layoutId ?? raw.layout_id ?? raw.layout ?? '') || undefined,
      priority: Number(raw.priority ?? 50) || 50,
      startDate: String(raw.startDate ?? raw.start_date ?? '2026-01-01').slice(0, 10),
      endDate: String(raw.endDate ?? raw.end_date ?? '2026-12-31').slice(0, 10),
      startTime: toTime(raw.startTime ?? raw.start_time ?? raw.start ?? raw.timeStart),
      endTime: toTime(raw.endTime ?? raw.end_time ?? raw.end ?? raw.timeEnd),
      daysOfWeek: daysArr.length ? [...new Set(daysArr)].sort() : [1, 2, 3, 4, 5],
      screenGroupIds: Array.isArray(raw.screenGroupIds ?? raw.screen_group_ids) ? (raw.screenGroupIds ?? raw.screen_group_ids) : [],
      screenIds: Array.isArray(raw.screenIds ?? raw.screen_ids) ? (raw.screenIds ?? raw.screen_ids) : [],
      isActive: raw.isActive !== undefined ? !!raw.isActive : raw.is_active !== undefined ? !!raw.is_active : raw.enabled !== undefined ? !!raw.enabled : true,
    } as ScheduleItem;
  };
  const schedKey = (s: ScheduleItem) => [s.name, s.playlistId || '', s.layoutId || '', s.priority, s.startTime.slice(0, 5), s.endTime.slice(0, 5), [...s.daysOfWeek].sort().join(','), s.isActive, s.startDate, s.endDate].join('|');
  // ── diff: กฎไหนจะถูกสร้าง / อัปเดต / ไม่เปลี่ยน (แสดงก่อนเขียน) ──
  const computeImportDiff = (candidates: ScheduleItem[]) => {
    const st = useSignageStore.getState();
    const created: ScheduleItem[] = [];
    const updated: ScheduleItem[] = [];
    let unchanged = 0;
    candidates.forEach((c) => {
      const existing = st.schedules.find((s) => s.id === c.id);
      if (!existing) { created.push(c); return; }
      if (schedKey(existing) === schedKey(c)) unchanged++;
      else updated.push(c);
    });
    return { created, updated, unchanged };
  };
  // ── import: อ่านไฟล์ → schema mapping → diff preview (ยังไม่เขียน) ──
  const [importPreview, setImportPreview] = useState<{
    candidates: ScheduleItem[]; created: ScheduleItem[]; updated: ScheduleItem[]; unchanged: number;
    playlists: any[]; history: any; foreign: boolean;
  } | null>(null);
  // เลือกเฉพาะกฎที่จะนำเข้า (ติ๊ก/ยกเลิกทีละรายการก่อน confirm) + ค้นหาในรายการ
  const [importSel, setImportSel] = useState<string[] | null>(null);
  const [importQuery, setImportQuery] = useState('');
  const importSelSet = useMemo(() => new Set(importSel ?? []), [importSel]);
  const selImportCandidates = useMemo(() => (importPreview ? importPreview.candidates.filter((c) => importSelSet.has(c.id)) : []), [importPreview, importSelSet]);
  const selImportDiff = useMemo(() => computeImportDiff(selImportCandidates), [selImportCandidates]);
  const importSchedulerData = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        let backup: any;
        if (data?.type === 'scheduler-backup' && Array.isArray(data.schedules)) {
          backup = data; // รูปแบบของเราเอง
        } else if (Array.isArray(data?.schedules)) {
          backup = { type: 'scheduler-backup', schedules: data.schedules, playlists: data.playlists || [], history: data.history || null };
        } else if (Array.isArray(data?.rules)) {
          backup = { type: 'scheduler-backup', schedules: data.rules, playlists: data.playlists || [], history: null };
        } else if (Array.isArray(data)) {
          backup = { type: 'scheduler-backup', schedules: data, playlists: [], history: null };
        } else {
          throw new Error('invalid');
        }
        const foreign = data?.type !== 'scheduler-backup';
        // schema mapping — ทุกแถว → ScheduleItem มาตรฐาน (ไฟล์ภายนอกก็ import ได้)
        const candidates = (backup.schedules || []).map((r: any, i: number) => normalizeScheduleRow(r, i)).filter(Boolean) as ScheduleItem[];
        if (!candidates.length) throw new Error('invalid');
        const diff = computeImportDiff(candidates);
        if (diff.created.length === 0 && diff.updated.length === 0) {
          window.alert(t('sch.noImportChanges'));
          return;
        }
        setImportPreview({ candidates, ...diff, playlists: backup.playlists || [], history: backup.history || null, foreign });
        setImportSel(candidates.map((c) => c.id)); // เริ่มต้นเลือกทั้งหมด — ติ๊กยกเลิกได้ก่อน confirm
        setImportQuery('');
      } catch {
        window.alert(t('sch.importFail'));
      }
    };
    reader.readAsText(file);
  };
  const confirmImport = () => {
    if (!importPreview || !importSel) return;
    const sel = new Set(importSel);
    const candidates = importPreview.candidates.filter((c) => sel.has(c.id));
    if (candidates.length === 0) { setImportPreview(null); setImportSel(null); return; }
    const { created, updated } = applySchedulerBackup({
      type: 'scheduler-backup', version: 1, exportedAt: new Date().toISOString(),
      schedules: candidates, playlists: importPreview.playlists, history: importPreview.history,
    });
    setImportPreview(null);
    setImportSel(null);
    window.alert(t('sch.importDone', { created, updated }));
  };
  const toggleImportItem = (id: string) => {
    setImportSel((prev) => {
      const s = new Set(prev ?? []);
      if (s.has(id)) s.delete(id); else s.add(id);
      return [...s];
    });
  };

  // ── Restore Points (สแนปชอตใน DB — ซิงก์ข้ามแท็บ/เครื่อง; localStorage เป็น fallback) ──
  const SNAP_KEY = 'scheduler-snapshots';
  type Snapshot = { id: string; name: string; createdAt: number; data: any };
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotsOpen, setSnapshotsOpen] = useState(false);
  const loadSnapshots = async () => {
    try {
      const res = await schedulerSnapshotApi.getAll();
      setSnapshots((res.data || []).map((r: any) => ({ id: r.id, name: r.name, createdAt: r.createdAt, data: r.data })));
    } catch {
      // offline/guest → localStorage เดิมเป็น fallback
      try { setSnapshots(JSON.parse(localStorage.getItem(SNAP_KEY) || '[]')); } catch { setSnapshots([]); }
    }
  };
  useEffect(() => { void loadSnapshots(); }, []);
  const persistSnapshots = (list: Snapshot[]) => { setSnapshots(list); localStorage.setItem(SNAP_KEY, JSON.stringify(list)); };
  const buildSnapshotData = () => {
    const st = useSignageStore.getState();
    return {
      app: 'nextgen-digital-signage', type: 'scheduler-backup', version: 1, exportedAt: new Date().toISOString(),
      schedules: st.schedules,
      playlists: st.playlists.map((p) => ({ id: p.id, name: p.name, color: p.color || '' })),
      history: { undo: st.undoStack, redo: st.redoStack },
    };
  };
  const saveSnapshot = () => {
    const snap: Snapshot = { id: 'snap-' + Date.now(), name: new Date().toLocaleString(), createdAt: Date.now(), data: buildSnapshotData() };
    setSnapshots((prev) => [...prev, snap]);
    schedulerSnapshotApi.create({ id: snap.id, name: snap.name, data: snap.data }).catch(() => {
      setSnapshots((prev) => prev.filter((s) => s.id !== snap.id)); // ล้มเหลว → เอาออก + เก็บไว้ใน localStorage แทน
      persistSnapshots([...snapshots, snap]);
    });
    window.alert(t('sch.snapshotSaved'));
  };
  const restoreSnapshot = (snap: Snapshot) => {
    const { created, updated } = applySchedulerBackup(snap.data, { historyLabel: t('sch.histRestore') });
    window.alert(t('sch.snapshotRestored', { created, updated }));
  };
  const deleteSnapshot = (id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    schedulerSnapshotApi.remove(id).catch(() => { void loadSnapshots(); });
  };

  // ── โหมดทดลอง (sandbox): กด "ทดลอง" → สแนปชอตอัตโนมัติ + undo ไม่จำกัด แล้วจบด้วย commit / revert ──
  const [sandboxActive, setSandboxActive] = useState(false);
  const [sandboxSnapId, setSandboxSnapId] = useState<string | null>(null);
  const sandboxRef = useRef(false);
  useEffect(() => { sandboxRef.current = sandboxActive; }, [sandboxActive]);
  const enterSandbox = () => {
    const snap: Snapshot = { id: 'snap-' + Date.now(), name: t('sch.sandboxSnapName', { time: new Date().toLocaleTimeString() }), createdAt: Date.now(), data: buildSnapshotData() };
    setSnapshots((prev) => [...prev, snap]);
    schedulerSnapshotApi.create({ id: snap.id, name: snap.name, data: snap.data }).catch(() => { /* เงียบ — localStorage fallback ยังมี */ });
    setSandboxSnapId(snap.id);
    setSandboxActive(true);
  };
  const commitSandbox = () => {
    setSandboxActive(false);
    setSandboxSnapId(null);
    if (sandboxSnapId) deleteSnapshot(sandboxSnapId); // commit แล้ว → ลบสแนปชอตอัตโนมัติทิ้ง
    window.alert(t('sch.sandboxCommitted'));
  };
  const revertSandbox = () => {
    const snap = snapshots.find((s) => s.id === sandboxSnapId);
    if (!snap) return;
    applySchedulerBackup(snap.data, { historyLabel: t('sch.histRevert') });
    setSandboxActive(false);
    setSandboxSnapId(null);
    if (sandboxSnapId) deleteSnapshot(sandboxSnapId);
    window.alert(t('sch.sandboxReverted'));
  };

  // ── sandbox visual diff: เทียบสถานะปัจจุบันกับสแนปชอตเริ่มต้น — ไฮไลต์กฎที่เปลี่ยน + สรุปในแถบ ──
  const sandboxDiff = useMemo(() => {
    if (!sandboxActive || !sandboxSnapId) return null;
    const snap = snapshots.find((s) => s.id === sandboxSnapId);
    if (!snap) return null;
    const before: Record<string, ScheduleItem> = {};
    (snap.data?.schedules || []).forEach((s: any) => { if (s?.id) before[s.id] = s; });
    const after: Record<string, ScheduleItem> = {};
    schedules.forEach((s) => { after[s.id] = s; });
    const beforePl: Record<string, Playlist> = {};
    (snap.data?.playlists || []).forEach((p: any) => { if (p?.id) beforePl[p.id] = { ...p, color: p.color || '' }; });
    const afterPl: Record<string, Playlist> = {};
    playlists.forEach((p) => { afterPl[p.id] = p; });
    let added = 0, removed = 0, changed = 0, plChanged = 0;
    const highlight = new Set<string>();
    new Set([...Object.keys(before), ...Object.keys(after)]).forEach((id) => {
      const b = before[id]; const a = after[id];
      if (!b) { added++; highlight.add(id); }
      else if (!a) removed++;
      else if (schedKey(b) !== schedKey(a)) { changed++; highlight.add(id); }
    });
    Object.keys(afterPl).forEach((id) => { const b = beforePl[id]; const a = afterPl[id]; if (b && a && (b.color || '') !== (a.color || '')) plChanged++; });
    const detail = fmtDetail({ schedules: { before, after }, playlists: { before: beforePl, after: afterPl } });
    return { added, removed, changed, plChanged, detail, highlight };
  }, [sandboxActive, sandboxSnapId, snapshots, schedules, playlists]);

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

  // ─── มุมมอง Day / Week / Month (Google Calendar style) ────────
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  // กฎออกอากาศทำงานในวันนั้นไหม (วันในสัปดาห์ + ช่วงวันที่ startDate–endDate)
  const isActiveOnDate = (s: ScheduleItem, d: Date) => {
    if (!s.daysOfWeek.includes(d.getDay())) return false;
    const ymd = fmtYMD(d);
    if (s.startDate && ymd < s.startDate) return false;
    if (s.endDate && ymd > s.endDate) return false;
    return true;
  };

  const isDayView = viewMode === 'day';
  const gridDays = useMemo(() => (isDayView ? [viewDate.getDay()] : DAY_ORDER), [isDayView, viewDate]);
  const gridDates = useMemo(() => {
    if (isDayView) return [viewDate];
    const ws = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate() - viewDate.getDay());
    return DAY_ORDER.map((_, i) => new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + i));
  }, [isDayView, viewDate]);

  const goPrev = () => setViewDate((d) => {
    if (viewMode === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
    if (viewMode === 'month') return new Date(d.getFullYear(), d.getMonth() - 1, 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7);
  });
  const goNext = () => setViewDate((d) => {
    if (viewMode === 'day') return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (viewMode === 'month') return new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
  });
  const goToday = () => setViewDate(new Date());
  const monthShort = (d: Date) => t(MONTH_T_KEYS[d.getMonth()]);
  const gridHeaderLabel = isDayView
    ? `${t(DAY_T_KEYS[viewDate.getDay()])} ${viewDate.getDate()} ${monthShort(viewDate)} ${viewDate.getFullYear()}`
    : viewMode === 'month'
      ? `${monthShort(viewDate)} ${viewDate.getFullYear()}`
      : (() => {
          const ws = gridDates[0];
          const we = gridDates[6];
          if (ws.getMonth() === we.getMonth()) return `${ws.getDate()} – ${we.getDate()} ${monthShort(we)} ${we.getFullYear()}`;
          if (ws.getFullYear() === we.getFullYear()) return `${ws.getDate()} ${monthShort(ws)} – ${we.getDate()} ${monthShort(we)} ${we.getFullYear()}`;
          return `${ws.getDate()} ${monthShort(ws)} ${ws.getFullYear()} – ${we.getDate()} ${monthShort(we)} ${we.getFullYear()}`;
        })();

  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const monthStart = new Date(firstOfMonth.getFullYear(), firstOfMonth.getMonth(), 1 - firstOfMonth.getDay());
  // ขยายกริดเดือนระหว่างลากชิป — ชี้ค้างที่ขอบบน/ล่างของกริด → เพิ่มแถวเดือนก่อน/ถัดไป (ลากข้ามเดือนไกลได้โดยไม่ต้องกด ◀▶)
  const MONTH_EXPAND_CAP = 14; // แถวสูงสุดต่อทิศ ≈ 3 เดือนครึ่ง
  const [monthExtraWeeks, setMonthExtraWeeks] = useState<{ top: number; bottom: number }>({ top: 0, bottom: 0 });
  const monthExtraWeeksRef = useRef({ top: 0, bottom: 0 });
  const setMonthExtraWeeksBoth = (next: { top: number; bottom: number }) => {
    monthExtraWeeksRef.current = next;
    setMonthExtraWeeks(next);
  };
  const lastMonthExpandRef = useRef(0); // throttle การขยายแถว (ทุก ~300ms)
  // 6 สัปดาห์ × 7 วัน — ระหว่างลาก ขยายแถวเดือนก่อน/ถัดไปได้ (total = 6 + top + bottom)
  const monthCells = useMemo(() => {
    const total = 6 + monthExtraWeeks.top + monthExtraWeeks.bottom;
    return Array.from({ length: total * 7 }, (_, i) =>
      new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() + i - monthExtraWeeks.top * 7));
  }, [monthStart, monthExtraWeeks]);

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
    // move: ids = กลุ่มที่ลากพร้อมกัน (เลือกหลายบล็อก Ctrl/Shift+คลิก) · copy = Alt+ลากคัดลอกกฎใหม่ (ต้นฉบับคงเดิม)
    | { mode: 'move'; id: string; ids: string[]; startMin: number; endMin: number; day: number; origDay: number; days: number[]; curMin: number; curDay: number; grabOffset: number; moved: boolean; startY: number; startX: number; copy?: boolean }
    | { mode: 'resize'; id: string; edge: 'top' | 'bottom'; startMin: number; endMin: number; curMin: number }
    | null;
  const [drag, setDrag] = useState<DragState>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Shift ค้าง = snap ชั่วโมงเต็ม (60 นาที) แทน 15 นาที ตอนวางชิปบน week strip
  const snapMinRef = useRef(SNAP_MIN);
  // ── ซิงก์ลากสดไปแท็บอื่น (BroadcastChannel) — start/move/end + throttle ~10/s ──
  const dragPosRef = useRef<{ ids: string[]; curMin: number; curDay: number; mode?: 'move' | 'resize'; edge?: 'top' | 'bottom'; plDrop?: string | null } | null>(null);
  const lastDragBroadcastRef = useRef(0);
  const maybeBroadcastDrag = (action: 'start' | 'move' | 'end', ids?: string[], curMin?: number, curDay?: number, extra?: { mode?: 'move' | 'resize'; edge?: 'top' | 'bottom' }) => {
    const now = Date.now();
    if (action === 'move') {
      if (now - lastDragBroadcastRef.current < 100) return; // throttle
      const p = dragPosRef.current;
      if (!p) return;
      lastDragBroadcastRef.current = now;
      broadcastDragSync('move', { ids: p.ids, curMin: p.curMin, curDay: p.curDay, mode: p.mode, edge: p.edge, plDrop: p.plDrop });
      return;
    }
    if (action === 'start' && ids) {
      dragPosRef.current = { ids, curMin: curMin ?? 0, curDay: curDay ?? 0, mode: extra?.mode ?? 'move', edge: extra?.edge };
      lastDragBroadcastRef.current = now;
      broadcastDragSync('start', { ids, curMin: curMin ?? 0, curDay: curDay ?? 0, mode: extra?.mode ?? 'move', edge: extra?.edge });
      return;
    }
    dragPosRef.current = null;
    broadcastDragSync('end');
  };

  const getPos = (e: React.PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const colW = (rect.width - GUTTER_W) / gridDays.length;
    const col = Math.max(0, Math.min(gridDays.length - 1, Math.floor((e.clientX - rect.left - GUTTER_W) / colW)));
    return { y, day: gridDays[col] };
  };

  const onGridPointerDown = (e: React.PointerEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    if (e.clientX - rect.left <= GUTTER_W) return; // จับที่แกนเวลาไม่ทำอะไร
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    // เตรียม scroller สำหรับ auto-scroll (ลากใกล้ขอบจอ → เลื่อนหน้า/กริดเอง เหมือน month view)
    autoScrollRef.current.vScroller = findVerticalScroller(e.currentTarget as HTMLElement);
    autoScrollRef.current.hScroller = weekCardRef.current;
    autoScrollZoneRef.current = 'viewport';
    scrollTickUpdaterRef.current = updateGridDragPosition;
    const el = (e.target as HTMLElement).closest('[data-sched-id]') as HTMLElement | null;
    const { y, day } = getPos(e);
    if (el?.dataset.schedId) {
      const sch = schedules.find((s) => s.id === el.dataset.schedId);
      if (!sch) return;
      const startMin = timeToMin(sch.startTime);
      const endMin = Math.max(timeToMin(sch.endTime), startMin + SNAP_MIN);
      const edge = el.dataset.resize as 'top' | 'bottom' | undefined;
      const grabMin = yToSnapMin(y);
      // Ctrl/Shift/⌘ + คลิกบนตัวบล็อก (ไม่ใช่ขอบ resize) = เลือก/ยกเลิกการเลือกหลายบล็อก — ไม่เริ่มลาก
      if ((e.ctrlKey || e.metaKey || e.shiftKey) && !edge) {
        toggleSelected(sch.id);
        return;
      }
      // ลากบล็อกที่ถูกเลือกอยู่แล้ว → ลากทั้งกลุ่ม · บล็อกอื่น → ลากเดี่ยว · Alt+ลาก = คัดลอก (ต้นฉบับคงเดิม)
      const inSelection = selectedIds.has(sch.id) && selectedIds.size > 0;
      const ids = inSelection ? [...selectedIds] : [sch.id];
      if (!inSelection && selectedIds.size > 0) clearSelected();
      setDrag(edge
        ? { mode: 'resize', id: sch.id, edge, startMin, endMin, curMin: edge === 'bottom' ? endMin : startMin }
        : { mode: 'move', id: sch.id, ids, startMin, endMin, day, origDay: day, days: [...sch.daysOfWeek], curMin: startMin, curDay: day, grabOffset: Math.max(0, grabMin - startMin), moved: false, startY: e.clientY, startX: e.clientX, copy: e.altKey });
      if (edge) maybeBroadcastDrag('start', [sch.id], startMin, day, { mode: 'resize', edge });
      else maybeBroadcastDrag('start', ids, startMin, day); // ซิงก์ลากสดไปแท็บอื่น
      e.preventDefault();
      return;
    }
    // ช่องว่าง → สร้างใหม่ (ลากค้าง)
    const startMin = yToSnapMin(y);
    setDrag({ mode: 'create', startMin, day, curMin: startMin, curDay: day, moved: false, startY: e.clientY, startX: e.clientX });
    e.preventDefault();
  };

  // คำนวณตำแหน่งลากใหม่จากพิกัดหน้าจอ (ใช้ทั้ง pointermove และ tick ของ auto-scroll — ตอนหน้าเลื่อนใต้ cursor ที่นิ่ง)
  const updateGridDragPosition = (clientX: number, clientY: number) => {
    // หาเป้าหมาย drop บน legend เพลย์ลิสต์ (ลากกฎมาวาง = เปลี่ยนเพลย์ลิสต์)
    const target = document.elementFromPoint(clientX, clientY)?.closest('[data-pl-drop]') as HTMLElement | null;
    const plDrop = target?.dataset.plDrop ?? null;
    setDropTargetId(plDrop);
    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const colW = (rect.width - GUTTER_W) / gridDays.length;
    const col = Math.max(0, Math.min(gridDays.length - 1, Math.floor((clientX - rect.left - GUTTER_W) / colW)));
    const day = gridDays[col];
    const min = yToSnapMin(y);
    setDrag((prev) => {
      if (!prev) return prev;
      if (prev.mode === 'resize') {
        dragPosRef.current = { ids: [prev.id], curMin: min, curDay: 0, mode: 'resize', edge: prev.edge };
        return { ...prev, curMin: min };
      }
      const moved = prev.moved || Math.abs(clientX - prev.startX) > 4 || Math.abs(clientY - prev.startY) > 4;
      if (prev.mode === 'move') {
        // ลากแนวตั้ง: กัน offset จากจุดกด — ลากแนวนอนล้วนต้องไม่เพี้ยนเวลา
        const duration = prev.endMin - prev.startMin;
        const newStart = Math.max(DAY_START_H * 60, Math.min(min - prev.grabOffset, 24 * 60 - duration));
        dragPosRef.current = { ids: prev.ids, curMin: newStart, curDay: day, mode: 'move', plDrop };
        return { ...prev, curMin: newStart, curDay: day, moved };
      }
      return { ...prev, curMin: min, curDay: day, moved };
    });
  };

  const onGridPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    updateGridDragPosition(e.clientX, e.clientY);
    updateAutoScroll(e.clientX, e.clientY);
    maybeBroadcastDrag('move'); // ซิงก์ลากสด (throttle)
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

  const onGridPointerUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const cur = drag;
    setDrag(null);
    setDropTargetId(null);
    clearSelected(); // ปล่อยแล้วจบการเลือกหลายบล็อก (เหมือน month view)
    stopAutoScroll();
    scrollTickUpdaterRef.current = null;
    maybeBroadcastDrag('end'); // จบการลาก → แท็บอื่นล้าง ghost
    // วางบน legend เพลย์ลิสต์ → เปลี่ยนเพลย์ลิสต์ของกฎทั้งกลุ่ม (คงเวลา/วันเดิมไว้ — ลากไป legend ไม่นับเป็นการย้ายเวลา)
    if (cur.mode === 'move' && cur.moved && !cur.copy) {
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-pl-drop]') as HTMLElement | null;
      const plId = target?.dataset.plDrop;
      if (plId) {
        const changed = cur.ids.some((id) => schedules.find((s) => s.id === id)?.playlistId !== plId);
        if (changed) {
          const before = snapshotOf(cur.ids);
          cur.ids.forEach((id) => updateSchedule(id, { playlistId: plId }));
          commitHistory(t('sch.histPlaylist'), { schedules: { before, after: snapshotOf(cur.ids) } });
          return;
        }
      }
    }
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
      if (!cur.moved) {
        // คลิกเฉยๆ → เปิด modal แก้ไข (Alt+คลิกเฉยๆ = ไม่ทำอะไร)
        if (!cur.copy) openEdit(schedules.find((s) => s.id === cur.id)!);
        return;
      }
      const before = snapshotOf(cur.ids);
      if (cur.copy) {
        // Alt+ลาก = คัดลอก: สร้างกฎใหม่ที่วัน/เวลาเป้าหมาย (ต้นฉบับคงเดิม) — ความต่างเวลาคงตามบล็อกที่จับ
        const newIds: string[] = [];
        const now = Date.now();
        cur.ids.forEach((id, i) => {
          const sch = schedules.find((s) => s.id === id);
          if (!sch) return;
          const dur = timeToMin(sch.endTime) - timeToMin(sch.startTime);
          const ns = Math.max(DAY_START_H * 60, Math.min(cur.curMin + (timeToMin(sch.startTime) - cur.startMin), 24 * 60 - dur));
          const newId = `sch-${now}-${i}`;
          const patch: Partial<ScheduleItem> = {
            id: newId, startTime: minToTime(ns), endTime: minToTime(ns + dur),
            ...(cur.curDay !== cur.origDay ? { daysOfWeek: [...sch.daysOfWeek.filter((d) => d !== cur.origDay && d !== cur.curDay), cur.curDay].sort() } : {}),
          };
          addSchedule({ ...sch, ...patch } as ScheduleItem);
          newIds.push(newId);
        });
        commitHistory(t('sch.histDuplicate'), { schedules: { before: {}, after: snapshotOf(newIds) } });
        return;
      }
      // ย้ายทั้งกลุ่ม: ทุกกฎได้ delta เท่ากัน (กัน offset จากจุดกดของบล็อกที่จับ) · ข้ามวัน → เอาวันต้นออก + เพิ่มวันเป้าหมาย
      const duration = cur.endMin - cur.startMin;
      const delta = Math.max(DAY_START_H * 60, Math.min(cur.curMin, 24 * 60 - duration)) - cur.startMin;
      const dayChanged = cur.curDay !== cur.origDay;
      for (const id of cur.ids) {
        const sch = schedules.find((s) => s.id === id);
        if (!sch) continue;
        const dur = timeToMin(sch.endTime) - timeToMin(sch.startTime);
        const ns = Math.max(DAY_START_H * 60, Math.min(timeToMin(sch.startTime) + delta, 24 * 60 - dur));
        const patch: any = { startTime: minToTime(ns), endTime: minToTime(ns + dur) };
        if (dayChanged) {
          patch.daysOfWeek = [...sch.daysOfWeek.filter((d) => d !== cur.origDay && d !== cur.curDay), cur.curDay].sort();
        }
        updateSchedule(id, patch);
      }
      commitHistory(t('sch.histMove'), { schedules: { before, after: snapshotOf(cur.ids) } });
      return;
    }
    // resize
    const sch = schedules.find((s) => s.id === cur.id);
    if (!sch) return;
    const before = snapshotOf([cur.id]);
    if (cur.edge === 'bottom') {
      const newEnd = Math.max(cur.startMin + SNAP_MIN, cur.curMin);
      if (newEnd !== timeToMin(sch.endTime)) updateSchedule(cur.id, { endTime: minToTime(newEnd) });
    } else {
      const newStart = Math.min(cur.endMin - SNAP_MIN, cur.curMin);
      if (newStart !== timeToMin(sch.startTime)) updateSchedule(cur.id, { startTime: minToTime(newStart) });
    }
    commitHistory(t('sch.histResize'), { schedules: { before, after: snapshotOf([cur.id]) } });
  };

  // ─── Month view: ลากชิปข้ามวัน/ข้ามเดือน = เปลี่ยนวันของกฎ (remove ต้นทาง + เพิ่มปลายทาง ใน daysOfWeek) ──
  // เลือกหลายชิป (Ctrl/Shift+คลิก) แล้วลากพร้อมกัน = ย้ายวัน/เดือนของหลายกฎทีเดียว · selection เก็บใน store → อยู่รอดข้ามมุมมอง
  const [monthDrag, setMonthDrag] = useState<{
    ids: string[]; origDay: number; curDay: number;
    curYmd: string | null; origYmd: string | null;
    moved: boolean; startX: number; startY: number; copy?: boolean;
    // weekDrop: ปล่อยบน week timeline ใต้กริด → เปลี่ยนวัน + เวลา (ลากข้าม view: month → week)
    weekDrop?: { day: number; startMin: number } | null;
  } | null>(null);
  const [monthDropYmd, setMonthDropYmd] = useState<string | null>(null);
  const monthGridRef = useRef<HTMLDivElement | null>(null); // scroll container ของกริดเดือน (เลื่อน/ขยายแนวตั้งตอนลาก)
  const weekStripRef = useRef<HTMLDivElement | null>(null); // week timeline ใต้กริดเดือน — drop ชิป = ตั้งวัน + เวลา
  const STRIP_START_MIN = DAY_START_H * 60; // 06:00
  const STRIP_END_MIN = 22 * 60;            // 22:00
  const STRIP_H_COMPACT = 150;              // ความสูง week timeline แบบย่อ (px)
  const STRIP_H_EXPANDED = 420;             // ความสูงแบบขยาย (px)
  const [stripH, setStripH] = useState(STRIP_H_COMPACT); // ย่อ/ขยายความสูงของ strip
  // คลิกคอลัมน์วันที่ใน strip = กรองเฉพาะกฎของวันนั้น (null = แสดงทุกวัน)
  const [stripFilterDay, setStripFilterDay] = useState<number | null>(null);
  // ── Auto-scroll: เลื่อนหน้า/กริดต่อเนื่องเมื่อลากชิปไปใกล้ขอบ (เดือน = ขอบกริด · กริดเวลา = ขอบ viewport) ──
  const monthCardRef = useRef<HTMLDivElement | null>(null); // การ์ด month view (overflow-x-auto)
  const weekCardRef = useRef<HTMLDivElement | null>(null); // การ์ด day/week view (overflow-x-auto) — ใช้ auto-scroll แนวนอนตอนลากในกริด
  // updater ที่ tick ของ auto-scroll เรียกทุกเฟรม (เดือน = ตามเซลล์ใต้ cursor · กริด = คำนวณตำแหน่งลากใหม่เมื่อหน้าเลื่อน)
  const scrollTickUpdaterRef = useRef<((clientX: number, clientY: number) => void) | null>(null);
  const autoScrollZoneRef = useRef<'viewport' | 'monthgrid'>('viewport'); // โซนตรวจจับขอบ: viewport (กริดเวลา) หรือขอบกริดเดือน
  const autoScrollRef = useRef<{
    active: boolean; raf: number;
    vDir: 'up' | 'down' | null; hDir: 'left' | 'right' | null;
    vScroller: HTMLElement | null; hScroller: HTMLElement | null;
    lastX: number; lastY: number;
  }>({ active: false, raf: 0, vDir: null, hDir: null, vScroller: null, hScroller: null, lastX: 0, lastY: 0 });
  // selection เก็บใน store → อยู่รอดข้ามมุมมอง (เลือกใน Month → สลับไป Week แล้วลากกลุ่มได้) · รีเซ็ตการขยายกริดเมื่อออกจาก month view
  useEffect(() => {
    if (viewMode !== 'month') setMonthExtraWeeksBoth({ top: 0, bottom: 0 });
  }, [viewMode]);
  // หา scroll container แนวตั้งที่แท้จริง (main content หรือ window) — กัน window.scrollBy ไปโดน container ผิด
  const findVerticalScroller = (el: HTMLElement | null): HTMLElement => {
    let n = el;
    while (n && n !== document.body && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (/(auto|scroll|overlay)/.test(s.overflowY) && n.scrollHeight > n.clientHeight + 1) return n;
      n = n.parentElement;
    }
    return (document.scrollingElement as HTMLElement) || document.documentElement;
  };
  // อัปเดต drop target จากตำแหน่ง pointer (ใช้ทั้งตอน pointermove และตอน auto-scroll เลื่อนเซลล์เข้ามาใต้ cursor)
  const updateMonthDropTarget = (clientX: number, clientY: number) => {
    // วางบน week timeline ใต้กริด (ลากชิปจาก month ลงมา) → ตั้งวัน (คอลัมน์) + เวลา (ตำแหน่ง y) — ลากข้าม view
    const strip = document.elementFromPoint(clientX, clientY)?.closest('[data-week-strip]') as HTMLElement | null;
    if (strip) {
      // ใช้ rect ของกริดจริง (data-strip-grid) — ความสูงย่อ/ขยายไม่มีผลต่อการคำนวณเวลา
      const grid = strip.querySelector('[data-strip-grid]') as HTMLElement | null;
      const rect = (grid || strip).getBoundingClientRect();
      const colW = rect.width / 7;
      const col = Math.max(0, Math.min(6, Math.floor((clientX - rect.left) / colW)));
      const frac = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      // Shift ค้าง = snap ชั่วโมงเต็ม (60) · ปกติ = snap 15 นาที
      const snap = snapMinRef.current;
      const startMin = Math.round((STRIP_START_MIN + frac * (STRIP_END_MIN - STRIP_START_MIN)) / snap) * snap;
      setMonthDropYmd(null);
      setMonthDrag((prev) => {
        if (!prev) return prev;
        dragPosRef.current = { ids: prev.ids, curMin: startMin, curDay: col };
        return { ...prev, curDay: col, weekDrop: { day: col, startMin } };
      });
      return;
    }
    const cell = document.elementFromPoint(clientX, clientY)?.closest('[data-month-cell]') as HTMLElement | null;
    setMonthDropYmd(cell?.dataset.monthCell ?? null);
    setMonthDrag((prev) => {
      if (!prev) return prev;
      const day = cell ? Number(cell.dataset.monthDay) : prev.curDay;
      dragPosRef.current = { ids: prev.ids, curMin: 0, curDay: Number.isNaN(day) ? prev.curDay : day };
      return { ...prev, curDay: Number.isNaN(day) ? prev.curDay : day, curYmd: cell?.dataset.monthCell ?? prev.curYmd, weekDrop: null };
    });
  };
  const stopAutoScroll = () => {
    const st = autoScrollRef.current;
    st.active = false;
    st.vDir = null;
    st.hDir = null;
    if (st.raf) cancelAnimationFrame(st.raf);
    st.raf = 0;
  };
  const tickAutoScroll = () => {
    const st = autoScrollRef.current;
    if (!st.active) { st.raf = 0; return; }
    // ความเร็วเพิ่มตามความลึกที่ชี้เข้าใกล้ขอบ (6px → 28px ต่อเฟรม)
    const vh = window.innerHeight;
    if (st.vDir && st.vScroller) {
      if (autoScrollZoneRef.current === 'monthgrid') {
        // month view — 2 เฟส:
        // เฟส 1: ยังไม่ถึงขอบบน/ล่างของกริด (ขอบกริดอยู่นอกจอ) → เลื่อนหน้าตามปกติ (ความเร็วตามความลึก)
        // เฟส 2: ชี้ใกล้ขอบกริดที่มองเห็น → ขยายแถวเดือนก่อน/ถัดไป + เลื่อนหน้าตาม 1 แถว (throttle ~300ms)
        //        → แถวใหม่โผล่ที่ขอบพอดี วางบนวันที่ไกลได้ (ข้ามเดือน) โดยไม่ต้องกด ◀▶
        const now = Date.now();
        const r = monthGridRef.current?.getBoundingClientRect();
        const rowH = document.querySelector('[data-month-cell]')?.getBoundingClientRect().height || 92;
        const depth = st.vDir === 'up' ? Math.max(0, 72 - st.lastY) : Math.max(0, st.lastY - (vh - 72));
        const speed = Math.min(28, 6 + depth / 2);
        if (st.vDir === 'down') {
          // เฟส 2: ขอบล่างกริดมองเห็น + ชี้ใกล้ขอบ → ขยายเดือนถัดไปทุก ~300ms (ระหว่างรอหยุดนิ่ง ไม่เลื่อนเร็ว)
          if (r && r.bottom <= vh && st.lastY > r.bottom - 40) {
            if (now - lastMonthExpandRef.current >= 300) {
              lastMonthExpandRef.current = now;
              const cur = monthExtraWeeksRef.current;
              if (cur.bottom < MONTH_EXPAND_CAP) {
                setMonthExtraWeeksBoth({ ...cur, bottom: cur.bottom + 1 });
                st.vScroller.scrollTop += rowH;
              }
            }
          } else {
            // เฟส 1: ยังไม่ถึงขอบล่างกริด → เลื่อนหน้าตามปกติ (ความเร็วตามความลึก)
            st.vScroller.scrollTop += speed;
          }
        } else if (r && r.top >= 0 && st.lastY < r.top + 40) {
          // เฟส 2 (บน): ขยายเดือนก่อนทุก ~300ms
          if (now - lastMonthExpandRef.current >= 300) {
            lastMonthExpandRef.current = now;
            const cur = monthExtraWeeksRef.current;
            if (cur.top < MONTH_EXPAND_CAP) {
              setMonthExtraWeeksBoth({ ...cur, top: cur.top + 1 });
              st.vScroller.scrollTop -= rowH;
            }
          }
        } else {
          st.vScroller.scrollTop -= speed;
        }
      } else {
        const depth = st.vDir === 'up' ? Math.max(0, 72 - st.lastY) : st.vDir === 'down' ? Math.max(0, st.lastY - (vh - 72)) : 0;
        const speed = Math.min(28, 6 + depth / 2);
        st.vScroller.scrollTop += (st.vDir === 'up' ? -1 : 1) * speed;
      }
    }
    let hSpeed = 6;
    if (st.hDir && st.hScroller) {
      const hr = st.hScroller.getBoundingClientRect();
      const hDepth = st.hDir === 'left' ? Math.max(0, hr.left + 72 - st.lastX) : Math.max(0, st.lastX - (hr.right - 72));
      hSpeed = Math.min(28, 6 + hDepth / 2);
    }
    if (st.hDir && st.hScroller) st.hScroller.scrollLeft += (st.hDir === 'left' ? -1 : 1) * hSpeed;
    // เซลล์/ตำแหน่งใหม่เลื่อนเข้ามาใต้ cursor → อัปเดต highlight/วันเป้าหมายต่อเนื่อง (แม้ pointer ไม่ขยับ)
    scrollTickUpdaterRef.current?.(st.lastX, st.lastY);
    st.raf = requestAnimationFrame(tickAutoScroll);
  };
  const updateAutoScroll = (clientX: number, clientY: number) => {
    const st = autoScrollRef.current;
    st.lastX = clientX;
    st.lastY = clientY;
    const EDGE = 72;
    let vDir: 'up' | 'down' | null = null;
    let hDir: 'left' | 'right' | null = null;
    // ชี้ที่ week timeline (drop ชิป → ตั้งวัน+เวลา) → ไม่ต้อง auto-scroll/ขยายเดือน
    if (!monthDrag?.weekDrop) {
    if (autoScrollZoneRef.current === 'monthgrid' && monthGridRef.current) {
      // month view: โซน = ขอบบน/ล่างของกริดเดือนที่มองเห็นได้ (clamp กับ viewport)
      const r = monthGridRef.current.getBoundingClientRect();
      const topEdge = Math.max(r.top, 0) + 40;
      const bottomEdge = Math.min(r.bottom, window.innerHeight) - 40;
      if (clientY < topEdge) vDir = 'up';
      else if (clientY > bottomEdge) vDir = 'down';
    } else if (clientY < EDGE) {
      vDir = 'up';
    } else if (clientY > window.innerHeight - EDGE) {
      vDir = 'down';
    }
    if (st.hScroller) {
      const r = st.hScroller.getBoundingClientRect();
      if (clientX < r.left + EDGE) hDir = 'left';
      else if (clientX > r.right - EDGE) hDir = 'right';
    }
    }
    st.vDir = vDir;
    st.hDir = hDir;
    if ((vDir || hDir) && !st.active) {
      st.active = true;
      st.raf = requestAnimationFrame(tickAutoScroll);
    } else if (!vDir && !hDir && st.active) {
      stopAutoScroll();
    }
  };
  // เริ่มลากชิป/บล็อก — ใช้ร่วมกัน: ชิปในกริดเดือน + บล็อกใน week strip (ลากได้ทั้ง 2 ทิศทาง เหมือน Google Calendar)
  const beginChipDrag = (e: React.PointerEvent, ev: ScheduleItem, day: number, origYmd: string | null) => {
    e.preventDefault(); // ยกเลิก pointerdown → ไม่เกิด click (cell ไม่กระโดดไป day view)
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    // Ctrl/Shift/⌘ + คลิก = เลือก/ยกเลิกการเลือกหลายชิป (ไม่เริ่มลาก — onClick เป็นคน toggle)
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;
    // ลากชิปที่ถูกเลือกอยู่แล้ว → ลากทั้งกลุ่ม (ย้ายวัน/เดือนของหลายกฎทีเดียว) · ชิปอื่น → ลากเดี่ยว
    const inSelection = selectedIds.has(ev.id) && selectedIds.size > 0;
    const ids = inSelection ? [...selectedIds] : [ev.id];
    if (!inSelection && selectedIds.size > 0) clearSelected();
    // เตรียม scroller สำหรับ auto-scroll — month view เลื่อนหน้า (ขอบ viewport) + ขยายแถวเดือน (ขอบกริด)
    autoScrollRef.current.vScroller = findVerticalScroller(e.currentTarget as HTMLElement);
    autoScrollRef.current.hScroller = monthCardRef.current;
    autoScrollZoneRef.current = 'monthgrid';
    scrollTickUpdaterRef.current = updateMonthDropTarget;
    lastMonthExpandRef.current = 0;
    setMonthExtraWeeksBoth({ top: 0, bottom: 0 });
    setMonthDrag({
      ids, origDay: day, curDay: day,
      curYmd: origYmd, origYmd,
      moved: false, startX: e.clientX, startY: e.clientY, copy: e.altKey, weekDrop: null,
    });
    maybeBroadcastDrag('start', ids, 0, day); // ซิงก์ลากสดไปแท็บอื่น
  };
  const onMonthChipPointerDown = (e: React.PointerEvent, ev: ScheduleItem, day: number) => {
    const cell = e.currentTarget.closest('[data-month-cell]') as HTMLElement | null;
    beginChipDrag(e, ev, day, cell?.dataset.monthCell ?? null);
  };
  // ลากบล็อกใน week strip ขึ้นไปวางบนกริดเดือน = เปลี่ยนวัน (ทิศทางตรงข้ามกับลากชิปลงมา)
  const onStripBlockPointerDown = (e: React.PointerEvent, ev: ScheduleItem, day: number) => {
    // origYmd = วันที่จริงของคอลัมน์ (gridDates) — วางบนเซลล์เดือนเดียวกัน = no-op · เดือนอื่น = view กระโดดตาม
    const colIdx = gridDays.indexOf(day);
    const origYmd = colIdx >= 0 ? fmtYMD(gridDates[colIdx]) : null;
    beginChipDrag(e, ev, day, origYmd);
    // ลากจาก strip ขึ้นบน: ใช้โซน viewport (ไม่ขยายแถวเดือนแบบขอบกริด — strip อยู่ชิดขอบล่างกริดพอดี กัน auto-scroll ผิดทิศ)
    autoScrollZoneRef.current = 'viewport';
  };
  const onMonthChipPointerMove = (e: React.PointerEvent) => {
    if (!monthDrag) return;
    updateMonthDropTarget(e.clientX, e.clientY);
    updateAutoScroll(e.clientX, e.clientY);
    maybeBroadcastDrag('move'); // ซิงก์ลากสด (throttle)
    setMonthDrag((prev) => {
      if (!prev) return prev;
      return { ...prev, moved: prev.moved || Math.abs(e.clientX - prev.startX) > 4 || Math.abs(e.clientY - prev.startY) > 4 };
    });
  };
  const onMonthChipPointerUp = (e: React.PointerEvent) => {
    const cur = monthDrag;
    if (!cur) return;
    e.preventDefault();
    e.stopPropagation();
    stopAutoScroll();
    scrollTickUpdaterRef.current = null;
    autoScrollZoneRef.current = 'viewport';
    maybeBroadcastDrag('end'); // จบการลาก → แท็บอื่นล้าง ghost
    setMonthDrag(null);
    setMonthDropYmd(null);
    setMonthExtraWeeksBoth({ top: 0, bottom: 0 });
    if (!cur.moved) {
      // คลิกธรรมดา (ไม่ลาก) → เปิด modal แก้ไขกฎที่คลิก
      clearSelected();
      const sch = schedules.find((s) => s.id === cur.ids[0]);
      if (sch) openEdit(sch);
      return;
    }
    const before = snapshotOf(cur.ids);
    // วางบน week timeline (ลากข้าม view: month → week) → เปลี่ยนวัน + เวลาของทั้งกลุ่ม (delta เท่ากัน เหมือนลากในกริด)
    if (cur.weekDrop) {
      const tgtDay = cur.weekDrop.day;
      const anchorStart = timeToMin(schedules.find((s) => s.id === cur.ids[0])?.startTime || '08:00');
      const delta = cur.weekDrop.startMin - anchorStart;
      if (cur.copy) {
        const newIds: string[] = [];
        const now = Date.now();
        cur.ids.forEach((id, i) => {
          const sch = schedules.find((s) => s.id === id);
          if (!sch) return;
          const dur = timeToMin(sch.endTime) - timeToMin(sch.startTime);
          const ns = Math.max(DAY_START_H * 60, Math.min(timeToMin(sch.startTime) + delta, 24 * 60 - dur));
          const newId = `sch-${now}-${i}`;
          addSchedule({
            ...sch, id: newId,
            startTime: minToTime(ns), endTime: minToTime(ns + dur),
            daysOfWeek: [...sch.daysOfWeek.filter((d) => d !== cur.origDay && d !== tgtDay), tgtDay].sort(),
          } as ScheduleItem);
          newIds.push(newId);
        });
        commitHistory(t('sch.histDuplicate'), { schedules: { before: {}, after: snapshotOf(newIds) } });
        clearSelected();
        return;
      }
      for (const id of cur.ids) {
        const sch = schedules.find((s) => s.id === id);
        if (!sch) continue;
        const dur = timeToMin(sch.endTime) - timeToMin(sch.startTime);
        const ns = Math.max(DAY_START_H * 60, Math.min(timeToMin(sch.startTime) + delta, 24 * 60 - dur));
        const patch: any = { startTime: minToTime(ns), endTime: minToTime(ns + dur) };
        if (tgtDay !== cur.origDay) {
          patch.daysOfWeek = [...sch.daysOfWeek.filter((d) => d !== cur.origDay && d !== tgtDay), tgtDay].sort();
        }
        updateSchedule(id, patch);
      }
      commitHistory(t('sch.histMove'), { schedules: { before, after: snapshotOf(cur.ids) } });
      clearSelected();
      return;
    }
    // วางบนวันที่ชัดเจน (มี ymd) → เปลี่ยนวันตามวันที่นั้น (รองรับเดือนไกลที่ขยายกริดเข้ามา — view กระโดดไปเดือนนั้นก่อนวาง)
    let tgtDay = cur.curDay;
    if (cur.curYmd && cur.curYmd !== cur.origYmd) {
      const tgt = parseYMD(cur.curYmd);
      if (tgt.getFullYear() !== viewDate.getFullYear() || tgt.getMonth() !== viewDate.getMonth()) {
        setViewDate(new Date(tgt.getFullYear(), tgt.getMonth(), tgt.getDate()));
      }
      tgtDay = tgt.getDay();
    }
    if (tgtDay !== cur.origDay) {
      if (cur.copy) {
        // Alt+ลากชิป = คัดลอก: สร้างกฎใหม่ที่วันเป้าหมาย (ต้นฉบับคงเดิม) — เก็บประวัติเป็น create
        const newIds: string[] = [];
        const now = Date.now();
        cur.ids.forEach((id, i) => {
          const sch = schedules.find((s) => s.id === id);
          if (!sch) return;
          const newId = `sch-${now}-${i}`;
          // normalize เวลาเป็น HH:MM (store ได้ 'HH:MM:SS' จาก DB — CreateScheduleSchema ต้องการ HH:MM)
          addSchedule({
            ...sch, id: newId,
            startTime: sch.startTime.slice(0, 5), endTime: sch.endTime.slice(0, 5),
            daysOfWeek: [...sch.daysOfWeek.filter((d) => d !== cur.origDay && d !== tgtDay), tgtDay].sort(),
          } as ScheduleItem);
          newIds.push(newId);
        });
        commitHistory(t('sch.histDuplicate'), { schedules: { before: {}, after: snapshotOf(newIds) } });
        clearSelected();
        return;
      }
      for (const id of cur.ids) {
        const sch = schedules.find((s) => s.id === id);
        if (!sch) continue;
        // ย้ายวัน → เอาวันต้นออก + เพิ่มวันเป้าหมาย (dedupe — วันเป้าหมายอาจมีอยู่แล้ว)
        updateSchedule(id, {
          daysOfWeek: [...sch.daysOfWeek.filter((d) => d !== cur.origDay && d !== tgtDay), tgtDay].sort(),
        });
      }
      commitHistory(t('sch.histDay'), { schedules: { before, after: snapshotOf(cur.ids) } });
    }
    clearSelected();
  };
  const onMonthChipPointerCancel = () => {
    stopAutoScroll();
    scrollTickUpdaterRef.current = null;
    autoScrollZoneRef.current = 'viewport';
    maybeBroadcastDrag('end');
    setMonthDrag(null);
    setMonthDropYmd(null);
    setMonthExtraWeeksBoth({ top: 0, bottom: 0 });
  };
  // หยุด auto-scroll เมื่อ component ถูก unmount
  useEffect(() => () => { stopAutoScroll(); scrollTickUpdaterRef.current = null; }, []);

  // นาฬิกาจริง — tick ทุกนาที (ตรงขอบนาที) → เส้นเวลาปัจจุบัน / ไฮไลต์วันนี้ + สัปดาห์ปัจจุบัน เคลื่อนสดโดยไม่ต้อง reload
  const [nowDate, setNowDate] = useState(() => new Date());
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    const schedule = () => {
      id = setTimeout(() => { setNowDate(new Date()); schedule(); }, 60_000 - (Date.now() % 60_000));
    };
    schedule();
    return () => clearTimeout(id);
  }, []);
  const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();
  // คีย์ลัด: Ctrl/Cmd+Z = ย้อนกลับ · Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y = ทำซ้ำ · Esc = ล้างการเลือกหลายชิป
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  useEffect(() => { undoRef.current = undo; redoRef.current = redo; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      snapMinRef.current = e.shiftKey ? 60 : SNAP_MIN; // Shift = snap ชั่วโมงเต็ม
      if (e.key === 'Escape') { clearSelected(); return; }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redoRef.current(); else undoRef.current(); }
      else if (e.key.toLowerCase() === 'y') { e.preventDefault(); redoRef.current(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') snapMinRef.current = SNAP_MIN;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); };
  }, []);
  // สัปดาห์ปัจจุบัน (อา–ส) — ใช้ไฮไลต์กรอบแถวใน Month view
  const nowWeekStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() - nowDate.getDay());
  const nowWeekEnd = new Date(nowWeekStart.getFullYear(), nowWeekStart.getMonth(), nowWeekStart.getDate() + 6);

  // ═══ End Week Calendar ════════════════════════════════════

  // ─── Legend (ใช้ร่วมทุกมุมมอง) — สีเพลย์ลิสต์ + REQ-006: 6 levels ──
  // คลิกชื่อ = ซ่อน/แสดงเพลย์ลิสต์ (Google Calendar toggle) · คลิกวงกลมสี = เปลี่ยนสีเพลย์ลิสต์ (บันทึกลง DB)
  // ลากกฎจาก week/day view มาวางบนเพลย์ลิสต์ = เปลี่ยนเพลย์ลิสต์ของกฎ
  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-3 border-t border-slate-800 text-[10px]">
      {playlists.length > 0 && (
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-1 -ml-1 transition-all ${drag?.mode === 'move' ? 'bg-cyan-500/10 ring-1 ring-cyan-400/40' : ''}`}>
          <span className="font-bold text-slate-500 uppercase">{t('sch.playlistLegend')}:</span>
          {playlists.map((p) => {
            const c = playlistColorOf(p.id);
            const hidden = hiddenPlaylists.has(p.id);
            if (!c) return null;
            return (
              <span key={p.id} data-pl-drop={p.id}
                title={t('sch.dragToPlaylist')}
                className={`flex items-center gap-1 rounded px-1 py-0.5 transition-all ${dropTargetId === p.id || remoteDrag?.plDrop === p.id ? 'ring-1 ring-white/80 bg-white/10' : ''}`}>
                {/* วงกลมสี — เปิดตัวเลือกสี */}
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); openColorPicker(p); }}
                  title={t('sch.playlistColorTitle')}
                  className="shrink-0 w-3 h-3 rounded-full cursor-pointer hover:scale-125 transition-transform">
                  <span className={`block w-full h-full rounded-full ${c.dot}`} style={plDotStyle(c)} />
                </button>
                {/* ชื่อ — คลิกซ่อน/แสดง */}
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); togglePlaylistVisible(p.id); }}
                  title={t('sch.togglePlaylist')}
                  className={`flex items-center gap-1 cursor-pointer transition-colors ${hidden ? 'text-slate-500 line-through opacity-60' : 'text-slate-300 hover:text-white'}`}>
                  {p.name}
                  {hidden && <EyeOff className="h-3 w-3" />}
                </button>
              </span>
            );
          })}
          <span className="w-px h-4 bg-slate-700" />
        </div>
      )}
      {PRIORITY_LEVELS.map((lv) => (
        <span key={lv.level} className="flex items-center gap-1">
          <span className={`w-3 h-3 rounded ${lv.dot}`} /> {t(PRIORITY_T_KEY[lv.level])} ({lv.min}-{lv.max})
        </span>
      ))}
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-1 ring-amber-400 bg-transparent" /> {t('sch.conflictLabel')}</span>
    </div>
  );

  return (
    <div className="space-y-6" onDragEnter={onRootDragEnter} onDragOver={onRootDragOver} onDragLeave={onRootDragLeave} onDrop={onRootDrop}>
      {/* Drop overlay — ลากไฟล์ JSON ค้างบนหน้า → ปล่อย = เปิด diff preview นำเข้า */}
      {fileDragOver && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-cyan-400 rounded-3xl px-12 py-10 bg-slate-900/90 shadow-2xl text-center">
            <Upload className="h-10 w-10 text-cyan-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">{t('sch.dropFileTitle')}</p>
            <p className="text-[11px] text-slate-400 mt-1">{t('sch.dropFileHint')}</p>
          </div>
        </div>
      )}
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
          {/* View Toggle — Google Calendar style: Day / Week / Month / List */}
          <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-0.5">
            <button onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'day' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t('sch.viewDay')}
            </button>
            <button onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'week' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t('sch.viewWeek')}
            </button>
            <button onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'month' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t('sch.viewMonth')}
            </button>
            <button onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
              {t('sch.viewList')}
            </button>
          </div>
          {/* Undo/Redo + ประวัติ — ย้อนกลับการลาก/ฟอร์ม/สี (Ctrl+Z / Ctrl+Shift+Z) · อยู่รอดข้ามแท็บ (เก็บใน store) */}
          <div className="relative">
            <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-0.5">
              <button onClick={undo} disabled={undoStack.length === 0} title={t('sch.undo')}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                <Undo2 className="h-4 w-4" />
              </button>
              <button onClick={redo} disabled={redoStack.length === 0} title={t('sch.redo')}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                <Redo2 className="h-4 w-4" />
              </button>
              {/* ย้อน/ทำซ้ำขั้นตอนใหญ่ — ย้อนทั้งกลุ่มของการแก้ไขต่อเนื่อง (ภายใน ~60 วิ) ทีเดียว · tooltip แสดงจำนวน · คลิกขวา = เลือกเฉพาะบางรายการ */}
              <button onClick={undoBigStep} onContextMenu={(e) => { e.preventDefault(); openStepMenu('undo'); }}
                disabled={undoStack.length === 0} title={t('sch.undoStepCount', { count: undoGroup.length })}
                className="relative p-1.5 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed border-l border-slate-700">
                <SkipBack className="h-4 w-4" />
                {undoGroup.length > 1 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-cyan-600 text-white text-[8px] font-bold flex items-center justify-center">{undoGroup.length}</span>
                )}
              </button>
              <button onClick={redoBigStep} onContextMenu={(e) => { e.preventDefault(); openStepMenu('redo'); }}
                disabled={redoStack.length === 0} title={t('sch.redoStepCount', { count: redoGroup.length })}
                className="relative p-1.5 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed">
                <SkipForward className="h-4 w-4" />
                {redoGroup.length > 1 && (
                  <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-cyan-600 text-white text-[8px] font-bold flex items-center justify-center">{redoGroup.length}</span>
                )}
              </button>
              <button onClick={() => { setStepMenu(null); setHistoryOpen((o) => !o); }} title={t('sch.historyTitle')}
                className="p-1.5 text-slate-400 hover:text-white border-l border-slate-700">
                <History className="h-4 w-4" />
              </button>
            </div>
            {/* เมนูคลิกขวา: เลือกเฉพาะบางรายการในกลุ่มที่จะย้อน/ทำซ้ำ */}
            {stepMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setStepMenu(null)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 flex items-center justify-between gap-2">
                    <span>{stepMenu === 'undo' ? t('sch.stepPickTitle') : t('sch.stepPickRedoTitle')}</span>
                    <button onClick={() => setStepMenu(null)} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                  </div>
                  <div className="max-h-56 overflow-y-auto px-2 py-1.5 space-y-0.5">
                    {(stepMenu === 'undo' ? undoGroup : redoGroup).length === 0 && (
                      <p className="text-[10px] text-slate-500 px-1 py-2">{t('sch.historyEmpty')}</p>
                    )}
                    {[...(stepMenu === 'undo' ? undoGroup : redoGroup)].reverse().map((en, j) => (
                      <label key={j} className="flex items-start gap-2 px-1.5 py-1 rounded-lg hover:bg-slate-800/50 cursor-pointer">
                        <input type="checkbox" checked={!!stepChecked[j]} onChange={() => setStepChecked((prev) => prev.map((v, k) => (k === j ? !v : v)))} className="accent-cyan-500 mt-0.5" />
                        <span className="min-w-0">
                          <span className="text-[10px] font-bold text-slate-200 truncate block">{en.label} <span className="text-slate-500 font-mono font-normal">{new Date(en.time).toLocaleTimeString()}</span></span>
                          {en.detail && <span className="block text-[9px] text-slate-400 truncate">{en.detail}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-slate-500">{
                      stepMenu === 'undo'
                        ? t('sch.stepPickHint', { count: stepRunCount(), total: undoGroup.length })
                        : t('sch.stepPickRedoHint', { count: stepRunCount(), total: redoGroup.length })
                    }</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setStepMenu(null)} className="px-2.5 py-1.5 text-slate-400 hover:text-white text-[10px]">{t('sch.cancel')}</button>
                      <button onClick={() => void confirmStepMenu()} disabled={stepRunCount() === 0}
                        className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white text-[10px] disabled:opacity-40">
                        {stepMenu === 'undo' ? t('sch.stepPickApply', { count: stepRunCount() }) : t('sch.stepPickRedoApply', { count: stepRunCount() })}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {historyOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800 flex items-center justify-between gap-2">
                  <span>{t('sch.historyTitle')}</span>
                  <button onClick={clearHistory} className="text-rose-400 hover:text-rose-300 font-semibold normal-case">
                    {t('sch.historyClear')}
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {undoStack.length === 0 ? (
                    <p className="px-3 py-3 text-[10px] text-slate-500">{t('sch.historyEmpty')}</p>
                  ) : (
                    [...undoStack].reverse().slice(0, 10).map((en, i) => (
                      <button key={i} type="button" onClick={() => jumpToEntry(en)}
                        title={t('sch.historyJump')}
                        className="w-full text-left px-3 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/60 transition-colors cursor-pointer">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-200 truncate">{en.label}</span>
                          <span className="text-[9px] text-slate-500 shrink-0 font-mono">
                            {new Date(en.time).toLocaleTimeString()}
                          </span>
                        </span>
                        {en.detail && (
                          <span className="block text-[9px] text-slate-400 mt-0.5 truncate">{en.detail}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Export/Import กฎ (JSON + ประวัติ) — สำรอง/ย้ายระหว่างระบบ */}
          <button onClick={exportSchedulerData} title={t('sch.export')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">
            <Download className="h-4 w-4" /> {t('sch.export')}
          </button>
          <button onClick={() => importFileRef.current?.click()} title={t('sch.import')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">
            <Upload className="h-4 w-4" /> {t('sch.import')}
          </button>
          <input ref={importFileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importSchedulerData(f); e.target.value = ''; }} />
          {/* Restore Points — สแนปชอตสถานะก่อนทดลอง + กู้คืน 1 คลิก */}
          <button onClick={() => setSnapshotsOpen(true)} title={t('sch.snapshotsTitle')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300">
            <Bookmark className="h-4 w-4" /> {t('sch.snapshotsTitle')}
          </button>
          {/* โหมดทดลอง — สแนปชอตอัตโนมัติ + undo ไม่จำกัด + commit/revert */}
          <button onClick={enterSandbox} disabled={sandboxActive} title={t('sch.sandboxTitle')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ${sandboxActive ? 'bg-emerald-900/50 text-emerald-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}>
            <FlaskConical className="h-4 w-4" /> {t('sch.sandboxTitle')}
          </button>
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30">
            <Plus className="h-4 w-4" /> {t('sch.createRule')}
          </button>
        </div>
      </div>

      {/* แถบโหมดทดลอง — commit / revert เมื่อเสร็จ */}
      {sandboxActive && (
        <div className="flex flex-col gap-2 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl px-4 py-2.5 mb-3 text-[11px] text-emerald-200">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t('sch.sandboxBanner')}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={revertSandbox} className="px-3 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 font-bold hover:bg-rose-600/30">{t('sch.sandboxRevert')}</button>
              <button onClick={commitSandbox} className="px-3 py-1.5 rounded-lg bg-emerald-600 font-bold text-white hover:bg-emerald-500">{t('sch.sandboxCommit')}</button>
            </div>
          </div>
          {/* Visual diff: สรุปการเปลี่ยนแปลงเทียบสแนปชอตเริ่มต้น + รายการก่อน→หลัง */}
          {sandboxDiff && (
            <div className="flex flex-col gap-1.5 border-t border-emerald-700/40 pt-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400/80">{t('sch.sandboxDiffTitle')}</span>
                {sandboxDiff.changed > 0 && <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">{t('sch.sandboxDiffChanged', { count: sandboxDiff.changed })}</span>}
                {sandboxDiff.added > 0 && <span className="px-1.5 py-0.5 rounded bg-green-950 text-green-300 border border-green-800">{t('sch.sandboxDiffAdded', { count: sandboxDiff.added })}</span>}
                {sandboxDiff.removed > 0 && <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">{t('sch.sandboxDiffRemoved', { count: sandboxDiff.removed })}</span>}
                {sandboxDiff.plChanged > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">{t('sch.sandboxDiffColors', { count: sandboxDiff.plChanged })}</span>}
                {sandboxDiff.changed === 0 && sandboxDiff.added === 0 && sandboxDiff.removed === 0 && sandboxDiff.plChanged === 0 && (
                  <span className="text-emerald-400/70">{t('sch.sandboxDiffNone')}</span>
                )}
              </div>
              {sandboxDiff.detail && (
                <div className="max-h-24 overflow-y-auto text-[10px] text-emerald-200/80 leading-relaxed bg-emerald-950/40 rounded-lg px-2.5 py-1.5 border border-emerald-800/50">
                  {sandboxDiff.detail}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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


      {/* ─── DAY / WEEK CALENDAR VIEW (Google Calendar style) ─── */}
      {(viewMode === 'day' || viewMode === 'week') && (
        <div ref={weekCardRef} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" /> {t(isDayView ? 'sch.dayCalendar' : 'sch.weekCalendar')}
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={goToday}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">
                {t('sch.today')}
              </button>
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg">
                <button onClick={goPrev} aria-label="previous" className="p-1.5 text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={goNext} aria-label="next" className="p-1.5 text-slate-400 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <span className="text-xs font-bold text-white min-w-[130px] text-center">{gridHeaderLabel}</span>
            </div>
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
              <span className="w-3.5 h-3.5 rounded bg-cyan-500/30 border border-cyan-400/60" />
              {t('sch.dragHint')}
              <span className="text-cyan-500/80">· {t('sch.selectHint')}</span>
              <span className="text-cyan-500/80">· {t('sch.copyHint')}</span>
            </p>
          </div>

          {/* แถบสถานะการเลือกหลายบล็อก (Ctrl/Shift+คลิก) */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-700/40 rounded-lg px-3 py-1.5 mb-2 text-[10px] text-cyan-200">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {t('sch.selectedCount', { count: selectedIds.size })}
              </span>
              <button type="button" onClick={() => clearSelected()}
                className="text-cyan-300 hover:text-white font-bold">{t('sch.cancel')}</button>
            </div>
          )}

          {/* Day headers — คลิกวันที่ = ไปมุมมองวันเดียว */}
          <div className="flex" style={{ minWidth: isDayView ? 420 : 640 }}>
            <div className="shrink-0" style={{ width: GUTTER_W }} />
            {gridDates.map((d, i) => {
              const count = visibleSchedules.filter((s) => isActiveOnDate(s, d)).length;
              const isToday = sameDay(d, nowDate);
              return (
                <div key={i} className="flex-1 text-center py-1.5 border-b border-slate-800 cursor-pointer hover:bg-slate-800/40"
                  onClick={() => { setViewDate(d); setViewMode('day'); }}
                  title={t('sch.viewDay')}>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-cyan-400' : 'text-slate-400'}`}>{t(DAY_T_KEYS[gridDays[i]])}</span>
                  <span className={`text-[11px] font-bold ${isToday ? 'text-cyan-300' : 'text-white'}`}> {d.getDate()}</span>
                  {isDayView && <span className="block text-[10px] text-slate-400">{t(MONTH_T_KEYS[d.getMonth()])} {d.getFullYear()}</span>}
                  {count > 0 && <span className="ml-1 text-[9px] text-slate-600 font-mono">{count}</span>}
                </div>
              );
            })}
          </div>

          {/* Grid (gutter + 7 day columns) — ลากบนช่องว่าง = สร้าง · ลากตัวบล็อก = ย้าย · ลากขอบ = ขยาย */}
          <div
            ref={gridRef}
            className="relative select-none"
            style={{ minWidth: isDayView ? 420 : 640, touchAction: 'none', cursor: drag ? 'grabbing' : undefined }}
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
              {gridDates.map((date, colIdx) => {
                const dayIdx = gridDays[colIdx];
                const colEvents = visibleSchedules.filter((s) =>
                  isActiveOnDate(s, date) || (drag?.mode === 'move' && drag.id === s.id && drag.curDay === dayIdx)
                  // ลากสดจากแท็บอื่น — แสดง ghost ในคอลัมน์ที่กำลังลาก
                  || (!!remoteDrag && remoteDrag.ids.includes(s.id) && remoteDrag.curDay === dayIdx));
                const layoutMap = collateEvents(colEvents.map((s) => ({
                  id: s.id,
                  startMin: timeToMin(s.startTime),
                  endMin: Math.max(timeToMin(s.endTime), timeToMin(s.startTime) + SNAP_MIN),
                })));
                return (
                  <div key={dayIdx} className="flex-1 relative" style={{ height: GRID_H }}>
                    {/* เส้นวันนี้ */}
                    {sameDay(date, nowDate) && nowMin >= DAY_START_H * 60 && nowMin <= 24 * 60 && (
                      <div
                        className="absolute left-0 right-0 z-20 border-t-2 border-rose-500/80 pointer-events-none"
                        style={{ top: ((nowMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H }}
                      >
                        <span className="absolute -top-1.5 left-0.5 text-[9px] font-bold text-rose-400">●</span>
                      </div>
                    )}

                    {colEvents.map((sch) => {
                      // ลากสด: ในเครื่อง (drag) หรือจากแท็บอื่น (remoteDrag) → ใช้ตำแหน่งลากจริง
                      const localDragging = drag?.mode === 'move' && drag.id === sch.id;
                      const remoteDragging = !!remoteDrag && remoteDrag.ids.includes(sch.id) && remoteDrag.curDay === dayIdx;
                      const isDragging = localDragging || remoteDragging;
                      // curMin ใช้ย้ายตำแหน่งเฉพาะโหมด move — resize ต้องยึด top เดิม (ความสูงเปลี่ยนอย่างเดียว เหมือนลากในเครื่อง)
                      const dragStartMin = localDragging ? drag.curMin : (remoteDragging && remoteDrag && remoteDrag.mode === 'move' ? remoteDrag.curMin : undefined);
                      const dur = Math.max(timeToMin(sch.endTime) - timeToMin(sch.startTime), SNAP_MIN);
                      const startMin = dragStartMin !== undefined ? dragStartMin : timeToMin(sch.startTime);
                      const endMin = Math.max(dragStartMin !== undefined ? dragStartMin + dur : timeToMin(sch.endTime), startMin + SNAP_MIN);
                      const top = ((startMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H;
                      const height = ((endMin - startMin) / 60) * ROW_PX;
                      const pos = layoutMap[sch.id] ?? { col: 0, cols: 1 };
                      const hasConflict = conflicts.has(sch.id);
                      // สีหลักของบล็อก = สีประจำเพลย์ลิสต์ (ถ้าไม่มีเพลย์ลิสต์ → ใช้สีระดับ priority)
                      const plColor = playlistColorOf(sch.playlistId);
                      const barColor = plColor?.bar ?? levelDef(sch.priority).bar;
                      const priDot = levelDef(sch.priority).dot;
                      const colW = `${100 / pos.cols}%`;
                      const colLeft = `${(pos.col / pos.cols) * 100}%`;

                      // resize live preview (บล็อกเดียวกับที่กำลังลาก — ในเครื่อง + จากแท็บอื่น)
                      let topPx = top;
                      let heightPx = height;
                      if (drag?.mode === 'resize' && drag.id === sch.id) {
                        if (drag.edge === 'bottom') heightPx = ((drag.curMin - drag.startMin) / 60) * ROW_PX;
                        else {
                          topPx = ((drag.curMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H;
                          heightPx = ((drag.endMin - drag.curMin) / 60) * ROW_PX;
                        }
                      } else if (remoteDrag?.mode === 'resize' && remoteDrag.ids.includes(sch.id)) {
                        const baseStart = timeToMin(sch.startTime);
                        const baseEnd = Math.max(timeToMin(sch.endTime), baseStart + SNAP_MIN);
                        if (remoteDrag.edge === 'bottom') heightPx = ((remoteDrag.curMin - baseStart) / 60) * ROW_PX;
                        else {
                          topPx = ((remoteDrag.curMin - DAY_START_H * 60) / (DAY_HOURS * 60)) * GRID_H;
                          heightPx = ((baseEnd - remoteDrag.curMin) / 60) * ROW_PX;
                        }
                      }

                      return (
                        <div
                          key={sch.id}
                          data-sched-id={sch.id}
                          className={`absolute rounded-md border ${barColor} overflow-hidden ${
                            !sch.isActive ? 'opacity-30' : ''
                          } ${hasConflict ? 'ring-1 ring-amber-400' : ''} ${
                            isDragging ? 'ring-2 ring-white/60 shadow-lg z-30' : selectedIds.has(sch.id) ? 'ring-2 ring-white/70' : 'z-10'
                          }`}
                          style={{ top: topPx, height: Math.max(14, heightPx), left: colLeft, width: colW, cursor: 'grab', ...plBarStyle(plColor) }}
                          title={`${sch.name} (${sch.startTime}–${sch.endTime}) P:${sch.priority}`}
                        >
                          {/* แถบซ้าย = ระดับความสำคัญ (บล็อกสีตามเพลย์ลิสต์) */}
                          {plColor && <div className={`absolute left-0 top-0 bottom-0 w-1 ${priDot}`} />}
                          {/* body (ลากย้าย) */}
                          <div className="absolute inset-0 py-0.5 text-[9px] font-bold text-white truncate pointer-events-none"
                            style={{ paddingLeft: plColor ? 14 : 4 }}>
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
                    {visibleSchedules.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-[11px] pointer-events-none">
                        {t('sch.noRules')} — {t('sch.dragHint')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend — สีเพลย์ลิสต์ + REQ-006: 6 levels */}
          {legend}
        </div>
      )}

      {/* ─── MONTH CALENDAR VIEW (Google Calendar style) ────── */}
      {viewMode === 'month' && (
        <div ref={monthCardRef} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-cyan-400" /> {t('sch.monthCalendar')}
            </h3>
            <div className="flex items-center gap-2">
              <button onClick={goToday}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white">
                {t('sch.today')}
              </button>
              <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg">
                <button onClick={goPrev} aria-label="previous" className="p-1.5 text-slate-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={goNext} aria-label="next" className="p-1.5 text-slate-400 hover:text-white"><ChevronRight className="h-4 w-4" /></button>
              </div>
              <span className="text-xs font-bold text-white min-w-[130px] text-center">{gridHeaderLabel}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mb-2 flex-wrap">
            <Move className="h-3 w-3 text-cyan-400" /> {t('sch.monthDragHint')}
            <span className="text-cyan-500/80">· {t('sch.selectHint')}</span>
            <span className="text-cyan-500/80">· {t('sch.monthExpandHint')}</span>
            <span className="text-cyan-500/80">· {t('sch.copyHint')}</span>
            <span className="text-cyan-500/80">· {t('sch.monthToWeekHint')}</span>
          </p>

          {/* แถบสถานะการเลือกหลายชิป (Ctrl/Shift+คลิก) */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-700/40 rounded-lg px-3 py-1.5 mb-2 text-[10px] text-cyan-200">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                {t('sch.selectedCount', { count: selectedIds.size })}
              </span>
              <button type="button" onClick={() => clearSelected()}
                className="text-cyan-300 hover:text-white font-bold">{t('sch.cancel')}</button>
            </div>
          )}

          {/* กริด 6 สัปดาห์ × 7 วัน (ขยายแถวเดือนก่อน/ถัดไปได้ระหว่างลาก — ลากข้ามเดือนไกล) · คลิกวันที่ = ไปมุมมองวันเดียว · คลิกชิป = แก้ไขกฎ · ลากชิป = เปลี่ยนวัน */}
          <div ref={monthGridRef}>
            <div className="grid grid-cols-7 gap-px bg-slate-800 rounded-xl overflow-hidden" style={{ minWidth: 640 }}>
            {DAY_ORDER.map((d) => (
              <div key={`h${d}`} className="bg-slate-950 py-1.5 text-center text-[10px] font-bold text-slate-400">
                {t(DAY_T_KEYS[d])}
              </div>
            ))}
            {monthCells.map((date, i) => {
              const isToday = sameDay(date, nowDate);
              const inMonth = date.getMonth() === viewDate.getMonth();
              const inCurrentWeek = date >= nowWeekStart && date <= nowWeekEnd;
              const ymd = fmtYMD(date);
              const isDropTarget = monthDrag !== null && monthDropYmd === ymd;
              const dayEvents = visibleSchedules
                .filter((s) => isActiveOnDate(s, date))
                .sort((a, b) => b.priority - a.priority);
              const shown = dayEvents.slice(0, 3);
              const more = dayEvents.length - shown.length;
              return (
                <div
                  key={i}
                  data-month-cell={ymd}
                  data-month-day={date.getDay()}
                  onClick={() => { setViewDate(date); setViewMode('day'); }}
                  className={`bg-slate-900 min-h-[92px] p-1 flex flex-col gap-0.5 cursor-pointer transition-colors hover:bg-slate-800/70 ${inMonth ? '' : 'opacity-35'} ${inCurrentWeek ? 'ring-1 ring-inset ring-cyan-400/60' : ''}`}
                  style={{
                    ...(inCurrentWeek ? { backgroundColor: 'rgba(34, 211, 238, 0.07)' } : undefined),
                    // ไฮไลต์เซลล์เป้าหมายตอนลากชิปข้ามวัน
                    ...(isDropTarget ? { boxShadow: 'inset 0 0 0 2px rgba(103, 232, 249, 0.9)' } : undefined),
                  }}
                >
                  <span className={`self-end w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${
                    isToday ? 'bg-cyan-500 text-slate-950' : inMonth ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {date.getDate()}
                  </span>
                  {shown.map((ev) => {
                    const evPl = playlistColorOf(ev.playlistId);
                    // dim ทั้งในเครื่อง (monthDrag) และจากแท็บอื่น (remoteDrag — ghost ลากสด)
                    const dragging = (monthDrag ? monthDrag.ids.includes(ev.id) : false) || (!!remoteDrag && remoteDrag.ids.includes(ev.id));
                    const isSelected = selectedIds.has(ev.id);
                    return (
                      <span
                        key={ev.id}
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Ctrl/Shift/⌘ + คลิก = เลือก/ยกเลิกการเลือกหลายชิป · คลิกธรรมดา = แก้ไขกฎ
                          if (e.ctrlKey || e.metaKey || e.shiftKey) { toggleSelected(ev.id); return; }
                          if (selectedIds.size > 0) clearSelected();
                          openEdit(ev);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); openEdit(ev); } }}
                        onPointerDown={(e) => onMonthChipPointerDown(e, ev, date.getDay())}
                        onPointerMove={onMonthChipPointerMove}
                        onPointerUp={onMonthChipPointerUp}
                        onPointerCancel={onMonthChipPointerCancel}
                        className={`${evPl?.bar ?? levelDef(ev.priority).bar} rounded px-1 py-px text-[9px] font-bold text-white truncate cursor-pointer leading-tight flex items-center gap-0.5 ${dragging ? 'opacity-50' : ''} ${dragging || isSelected ? 'ring-2 ring-white/80' : sandboxDiff?.highlight.has(ev.id) ? 'ring-2 ring-emerald-400/80' : ''}`}
                        style={{ touchAction: 'none', ...plBarStyle(evPl) }}
                        title={`${ev.name} · ${ev.startTime}–${ev.endTime}`}
                      >
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${levelDef(ev.priority).dot}`} />
                        <span className="truncate">{ev.startTime} {ev.name}</span>
                      </span>
                    );
                  })}
                  {more > 0 && (
                    <span className="text-[9px] text-slate-400 pl-1">{t('sch.moreEvents', { count: more })}</span>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          {/* Week Timeline — ลากชิปจากกริดเดือนมาวาง = เปลี่ยนวัน + เวลา · ลากบล็อกขึ้นไปวางบนกริดเดือน = เปลี่ยนวัน (ลากได้ 2 ทิศทาง) */}
          <div
            ref={weekStripRef}
            data-week-strip
            className={`mt-3 rounded-xl border p-2 select-none transition-colors ${monthDrag?.weekDrop ? 'border-cyan-400/70 bg-cyan-950/20' : 'border-slate-800 bg-slate-950'}`}
            style={{ minWidth: 640 }}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
              <div className="flex items-center gap-2">
                <h4 className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-cyan-400" /> {t('sch.weekStripTitle')}
                </h4>
                {stripFilterDay !== null && (
                  <button type="button" onClick={() => setStripFilterDay(null)} title={t('sch.stripFilterClear')}
                    className="px-1.5 py-0.5 rounded bg-cyan-600/20 text-cyan-300 text-[9px] font-bold border border-cyan-700/50">
                    {t(DAY_T_KEYS[stripFilterDay])} ✕
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500 hidden sm:inline">{t('sch.monthToWeekHint')} · {t('sch.shiftSnapHint')}</span>
                <button type="button" onClick={() => setStripH((h) => (h === STRIP_H_COMPACT ? STRIP_H_EXPANDED : STRIP_H_COMPACT))}
                  title={stripH === STRIP_H_COMPACT ? t('sch.stripExpand') : t('sch.stripCollapse')}
                  className="p-1 text-slate-400 hover:text-white border border-slate-700 rounded">
                  {stripH === STRIP_H_COMPACT ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="flex" style={{ height: stripH }}>
              {/* แกนเวลา 06:00–22:00 */}
              <div className="shrink-0 relative" style={{ width: 32 }}>
                {Array.from({ length: (STRIP_END_MIN - STRIP_START_MIN) / 60 + 1 }, (_, i) => (STRIP_START_MIN + i * 60) / 60).map((h) => (
                  <span key={h} className="absolute right-1 -translate-y-1/2 text-[8px] text-slate-500 font-mono"
                    style={{ top: ((h * 60 - STRIP_START_MIN) / (STRIP_END_MIN - STRIP_START_MIN)) * stripH }}>
                    {String(h).padStart(2, '0')}
                  </span>
                ))}
              </div>
              {/* 7 คอลัมน์ — คลิกวันที่ = กรองเฉพาะวันนั้น · วางชิป = ตั้งวัน+เวลา · ลากบล็อกขึ้น = เปลี่ยนวัน */}
              <div data-strip-grid className="flex flex-1">
                {gridDates.map((date, i) => {
                  const dayIdx = gridDays[i];
                  const isDrop = monthDrag?.weekDrop?.day === dayIdx;
                  const isFiltered = stripFilterDay !== null && stripFilterDay !== dayIdx;
                  const innerH = stripH - 14;
                  return (
                    <div key={dayIdx} className="relative flex-1 border-l border-slate-800/60 first:border-l-0">
                      <button type="button" onClick={() => setStripFilterDay((f) => (f === dayIdx ? null : dayIdx))}
                        title={t('sch.stripFilterHint')}
                        className={`w-full text-center text-[8px] font-bold mb-0.5 leading-none cursor-pointer transition-colors ${isDrop || stripFilterDay === dayIdx ? 'text-cyan-300' : 'text-slate-500 hover:text-slate-300'}`}>
                        {t(DAY_T_KEYS[dayIdx])} {date.getDate()}
                      </button>
                      <div className="relative" style={{ height: innerH, opacity: isFiltered ? 0.3 : 1 }}>
                        {/* เส้นชั่วโมง */}
                        {Array.from({ length: (STRIP_END_MIN - STRIP_START_MIN) / 60 - 1 }, (_, idx) => idx + 1).map((idx) => (
                          <div key={idx} className="absolute left-0 right-0 border-t border-slate-800/40"
                            style={{ top: ((idx * 60) / (STRIP_END_MIN - STRIP_START_MIN)) * innerH }} />
                        ))}
                        {/* บล็อกกฎ — ลากขึ้นไปวางบนกริดเดือน = เปลี่ยนวัน (เหมือนชิปใน month) · คลิก = แก้ไข · Ctrl+คลิก = เลือก */}
                        {visibleSchedules.filter((s) => isActiveOnDate(s, date)).map((sch) => {
                          const plColor = playlistColorOf(sch.playlistId);
                          const sMin = timeToMin(sch.startTime);
                          const eMin = Math.max(timeToMin(sch.endTime), sMin + SNAP_MIN);
                          const top = ((Math.max(sMin, STRIP_START_MIN) - STRIP_START_MIN) / (STRIP_END_MIN - STRIP_START_MIN)) * innerH;
                          const hgt = ((Math.min(eMin, STRIP_END_MIN) - Math.max(sMin, STRIP_START_MIN)) / (STRIP_END_MIN - STRIP_START_MIN)) * innerH;
                          const dragging = monthDrag ? monthDrag.ids.includes(sch.id) : false;
                          return (
                            <span key={sch.id} role="button" tabIndex={0}
                              title={`${sch.name} · ${sch.startTime}–${sch.endTime}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (e.ctrlKey || e.metaKey || e.shiftKey) { toggleSelected(sch.id); return; }
                                if (selectedIds.size > 0) clearSelected();
                                openEdit(sch);
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); openEdit(sch); } }}
                              onPointerDown={(e) => onStripBlockPointerDown(e, sch, dayIdx)}
                              onPointerMove={onMonthChipPointerMove}
                              onPointerUp={onMonthChipPointerUp}
                              onPointerCancel={onMonthChipPointerCancel}
                              className={`absolute rounded-sm cursor-pointer ${plColor?.bar ?? levelDef(sch.priority).bar} ${!sch.isActive ? 'opacity-30' : ''} ${dragging ? 'opacity-50' : ''} ${dragging || selectedIds.has(sch.id) ? 'ring-1 ring-white/80' : ''}`}
                              style={{ top, height: Math.max(2, hgt), left: 1, right: 1, touchAction: 'none', ...plBarStyle(plColor) }} />
                          );
                        })}
                        {/* ไฮไลต์เป้าหมาย drop — เส้นเวลาที่จะวาง */}
                        {isDrop && monthDrag?.weekDrop && (
                          <div className="absolute inset-y-0 left-1 right-1 z-10 pointer-events-none rounded ring-2 ring-inset ring-cyan-400/90">
                            <div className="absolute left-0 right-0 border-t-2 border-cyan-400"
                              style={{ top: ((monthDrag.weekDrop.startMin - STRIP_START_MIN) / (STRIP_END_MIN - STRIP_START_MIN)) * innerH }}>
                              <span className="absolute -top-2 left-0.5 text-[8px] font-bold text-cyan-300">{minToTime(monthDrag.weekDrop.startMin)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Legend — สีเพลย์ลิสต์ + REQ-006: 6 levels */}
          {legend}
        </div>
      )}


      {/* ─── LIST VIEW ──────────────────────────────────────── */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            {t('sch.activeRules', { count: visibleSchedules.length })}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleSchedules.map(sch => {
              const playlist = playlists.find(p => p.id === sch.playlistId);
              const layout = layouts.find(l => l.id === sch.layoutId);
              const plColor = playlistColorOf(sch.playlistId);
              const hasConflict = conflicts.has(sch.id);

              const sandboxChanged = !!sandboxDiff?.highlight.has(sch.id);
              return (
                <div key={sch.id}
                  className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition-all shadow-xl ${
                    hasConflict ? 'border-amber-600/50 ring-1 ring-amber-500/20'
                    : sandboxChanged ? 'border-emerald-500/60 ring-1 ring-emerald-500/40'
                    : 'border-slate-800 hover:border-slate-700'
                  }`}>
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${levelDef(sch.priority).badge}`}>
                      {t(PRIORITY_T_KEY[levelDef(sch.priority).level])} · {sch.priority}
                    </span>
                    {sandboxChanged && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-emerald-950 text-emerald-300 border-emerald-700">{t('sch.sandboxChangedBadge')}</span>
                    )}
                    <div className="flex items-center gap-2">
                      {hasConflict && (
                        <span className="text-[9px] text-amber-400 flex items-center gap-0.5" title={`Conflicts with: ${conflicts.get(sch.id)?.join(', ')}`}>
                          <AlertTriangle className="h-3 w-3" /> {t('sch.conflictLabel')}
                        </span>
                      )}
                      <button onClick={() => {
                        const before = snapshotOf([sch.id]);
                        updateSchedule(sch.id, { isActive: !sch.isActive, updatedAt: new Date().toISOString() } as any);
                        commitHistory(t('sch.histEdit'), { schedules: { before, after: snapshotOf([sch.id]) } });
                      }}
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
                    <div className="flex justify-between"><span className="text-slate-500">{t('sch.playlist')}</span>
                      <span className="font-medium flex items-center gap-1.5">
                        {playlist && <span className={`w-2 h-2 rounded-full ${plColor?.dot ?? 'bg-indigo-400'}`} style={plDotStyle(plColor)} />}
                        <span className="text-indigo-400">{playlist?.name || '—'}</span>
                      </span>
                    </div>
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
                    <button onClick={() => {
                      if (!window.confirm(t('sch.confirmDelete'))) return; // กันลบโดยไม่ตั้งใจ
                      const before = snapshotOf([sch.id]);
                      deleteSchedule(sch.id);
                      commitHistory(t('sch.histDelete'), { schedules: { before, after: {} } });
                    }}
                      title={t('sch.deleteRule')}
                      className="text-slate-500 hover:text-rose-400 p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend — ใช้ซ่อน/แสดง + เปลี่ยนสีเพลย์ลิสต์ได้ทุกมุมมอง */}
          {legend}
        </div>
      )}


      {/* ─── PLAYLIST COLOR PICKER MODAL ─────────────────────── */}
      {colorPickerFor && (() => {
        const pl = playlists.find((x) => x.id === colorPickerFor);
        if (!pl) return null;
        return (
          <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-cyan-400" /> {t('sch.playlistColorTitle')}
                </h3>
                <button onClick={() => setColorPickerFor(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <p className="text-slate-200 font-bold">{pl.name}</p>
                {/* Preset palette */}
                <div>
                  <p className="text-slate-500 uppercase font-bold text-[10px] mb-2">{t('sch.presetColors')}</p>
                  <div className="grid grid-cols-6 gap-2">
                    {PLAYLIST_COLORS.map((c) => (
                      <button key={c.hex} type="button"
                        onClick={() => setColorPickerValue(c.hex)}
                        title={c.hex}
                        className={`h-8 rounded-lg transition-transform hover:scale-110 ${colorPickerValue.toLowerCase() === c.hex ? 'ring-2 ring-white' : ''}`}
                        style={{ backgroundColor: c.hex }} />
                    ))}
                  </div>
                </div>
                {/* Custom color */}
                <div>
                  <p className="text-slate-500 uppercase font-bold text-[10px] mb-2">{t('sch.customColor')}</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={colorPickerValue}
                      onChange={(e) => setColorPickerValue(e.target.value)}
                      className="w-10 h-9 rounded cursor-pointer bg-slate-950 border border-slate-700" />
                    <input type="text" value={colorPickerValue}
                      onChange={(e) => {
                        let v = e.target.value;
                        if (v && !v.startsWith('#')) v = '#' + v;
                        if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setColorPickerValue(v);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono" />
                    <span className="shrink-0 w-9 h-9 rounded-lg border border-slate-700" style={{ backgroundColor: colorPickerValue }} />
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                  <button onClick={() => setColorPickerFor(null)} className="px-4 py-2 text-slate-400 hover:text-white">{t('sch.cancel')}</button>
                  <button onClick={savePlaylistColor}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5" /> {t('sch.saveColor')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}


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

              {/* Footer — แก้ไข: คัดลอก/ลบกฎ (มี confirm) · สร้าง: บันทึกอย่างเดียว */}
              <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-800">
                {editingId && (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={handleDuplicate} title={t('sch.duplicateHint')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Copy className="h-3.5 w-3.5" /> {t('sch.duplicateRule')}
                    </button>
                    <button type="button" onClick={handleDeleteFromModal}
                      className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" /> {t('sch.deleteRule')}
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white">{t('sch.cancel')}</button>
                  <button type="submit" className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white flex items-center gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {editingId ? t('sch.saveChanges') : t('sch.createRule')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ─── IMPORT PREVIEW MODAL (diff ก่อนเขียน — ยังไม่แตะ DB) ────── */}
      {importPreview && (() => {
        const q = importQuery.trim().toLowerCase();
        const rows = importPreview.candidates.filter((c) => !q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
        const allSel = importPreview.candidates.length > 0 && importPreview.candidates.every((c) => importSelSet.has(c.id));
        return (
        <div className="fixed inset-0 z-[58] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-400" /> {t('sch.importPreview')}
              </h3>
              <button onClick={() => { setImportPreview(null); setImportSel(null); }} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto text-xs space-y-3">
              {importPreview.foreign && (
                <p className="text-[10px] text-amber-300 bg-amber-950/30 border border-amber-700/40 rounded-lg px-2 py-1.5">
                  {t('sch.importForeign')}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">{t('sch.importNew', { count: selImportDiff.created.length })}</span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">{t('sch.importChanged', { count: selImportDiff.updated.length })}</span>
                <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-700">{t('sch.importSame', { count: selImportDiff.unchanged })}</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">{t('sch.importSelected', { count: importSelSet.size, total: importPreview.candidates.length })}</span>
              </div>
              <div className="flex items-center gap-2">
                <input value={importQuery} onChange={(e) => setImportQuery(e.target.value)} placeholder={t('sch.importSearch')}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white placeholder-slate-600 outline-none focus:border-cyan-500" />
                <button onClick={() => setImportSel(importPreview.candidates.map((c) => c.id))}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold">{t('sch.importSelectAll')}</button>
                <button onClick={() => setImportSel([])}
                  className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold">{t('sch.importSelectNone')}</button>
              </div>
              <div className="space-y-0.5 max-h-44 overflow-y-auto bg-slate-950 rounded-xl p-2 border border-slate-800">
                {rows.map((c) => {
                  const isNew = selImportDiff.created.some((x) => x.id === c.id);
                  return (
                    <label key={c.id} className={`flex items-center gap-2 px-1.5 py-1 rounded-lg cursor-pointer hover:bg-slate-800/50 ${isNew ? 'text-emerald-400' : 'text-amber-300'}`}>
                      <input type="checkbox" checked={importSelSet.has(c.id)} onChange={() => toggleImportItem(c.id)} className="accent-cyan-500" />
                      <span className="truncate">{isNew ? '+ ' : '~ '}{c.name} <span className="text-slate-500">({c.id})</span></span>
                    </label>
                  );
                })}
                {rows.length === 0 && <div className="text-slate-500 px-1.5 py-1">{t('sch.importSearchEmpty')}</div>}
                {importPreview.created.length === 0 && importPreview.updated.length === 0 && (
                  <div className="text-slate-500 px-1.5 py-1">{t('sch.noImportChanges')}</div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
              <button onClick={() => { setImportPreview(null); setImportSel(null); }} className="px-4 py-2 text-slate-400 hover:text-white">{t('sch.cancel')}</button>
              <button onClick={confirmImport} disabled={importSelSet.size === 0} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 font-bold rounded-xl text-white disabled:opacity-40">
                {t('sch.confirmImport')}
              </button>
            </div>
          </div>
        </div>
        );
      })()}


      {/* ─── RESTORE POINTS MODAL (สแนปชอตใน localStorage + กู้คืน 1 คลิก) ── */}
      {snapshotsOpen && (
        <div className="fixed inset-0 z-[58] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-cyan-400" /> {t('sch.snapshotsTitle')}
              </h3>
              <button onClick={() => setSnapshotsOpen(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto text-xs space-y-2">
              <button onClick={saveSnapshot}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white">
                <Bookmark className="h-3.5 w-3.5" /> {t('sch.saveSnapshot')}
              </button>
              {snapshots.length === 0 ? (
                <p className="text-[10px] text-slate-500 pt-2">{t('sch.snapshotsEmpty')}</p>
              ) : (
                [...snapshots].reverse().map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 bg-slate-950 rounded-xl px-3 py-2 border border-slate-800">
                    <div className="min-w-0">
                      <div className="text-slate-200 font-bold text-[11px] truncate">{s.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono">{s.data.schedules?.length ?? 0} {t('sch.rules')}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => restoreSnapshot(s)}
                        className="px-2 py-1 rounded-lg bg-cyan-600/20 text-cyan-300 text-[10px] font-bold hover:bg-cyan-600/30">{t('sch.restore')}</button>
                      <button onClick={() => deleteSnapshot(s.id)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
