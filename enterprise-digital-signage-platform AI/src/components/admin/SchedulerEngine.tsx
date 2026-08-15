import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  Layers, 
  Monitor, 
  CheckCircle2, 
  Sliders, 
  Zap 
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { ScheduleItem } from '../../types/signage';

export const SchedulerEngine: React.FC = () => {
  const { schedules, playlists, layouts, screens, addSchedule, updateSchedule, deleteSchedule } = useSignageStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [playlistId, setPlaylistId] = useState(playlists[0]?.id || '');
  const [layoutId, setLayoutId] = useState(layouts[0]?.id || '');
  const [priority, setPriority] = useState(50);
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri

  const daysLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const newSch: ScheduleItem = {
      id: 'sch-' + Date.now(),
      name: name || 'Custom Broadcast Trigger',
      playlistId,
      layoutId,
      screenGroupIds: ['All Displays'],
      screenIds: [],
      priority,
      startDate,
      endDate,
      startTime,
      endTime,
      daysOfWeek: selectedDays,
      isActive: true
    };

    addSchedule(newSch);
    setIsAddModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-cyan-400" />
            <span>Time & Priority Scheduler Engine</span>
          </h2>
          <p className="text-xs text-slate-400">Configure time-based broadcast triggers, day-of-week rules, and conflict resolution rules</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Create Schedule Rule</span>
        </button>
      </div>

      {/* Priority Hierarchy Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-xl">
        <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 bg-rose-600/20 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-rose-400 uppercase">PRIORITY 100 (HIGHEST)</div>
            <h4 className="font-bold text-white text-xs">Emergency Alert Override</h4>
            <p className="text-[10px] text-slate-400">Instant WebSocket broadcast. Clears all active schedules.</p>
          </div>
        </div>

        <div className="bg-cyan-950/40 border border-cyan-800/60 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 bg-cyan-600/20 rounded-lg">
            <Clock className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-cyan-400 uppercase">PRIORITY 50-80 (SCHEDULED)</div>
            <h4 className="font-bold text-white text-xs">Time-Based Event Triggers</h4>
            <p className="text-[10px] text-slate-400">Executes during specific hours (e.g., Cafeteria Lunch Menu 11am-2pm).</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center space-x-3">
          <div className="p-2 bg-slate-800 rounded-lg">
            <Layers className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase">PRIORITY 10 (DEFAULT)</div>
            <h4 className="font-bold text-white text-xs">Default Fallback Loop</h4>
            <p className="text-[10px] text-slate-400">Plays when no higher priority event is actively triggered.</p>
          </div>
        </div>
      </div>

      {/* Active Schedules List */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <span>Active Broadcast Schedule Rules ({schedules.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((sch) => {
            const assignedPlaylist = playlists.find((p) => p.id === sch.playlistId);
            const assignedLayout = layouts.find((l) => l.id === sch.layoutId);

            return (
              <div 
                key={sch.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 hover:border-slate-700 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      sch.priority > 70 
                        ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      Priority Weight: {sch.priority}
                    </span>

                    <button
                      onClick={() => updateSchedule(sch.id, { isActive: !sch.isActive })}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        sch.isActive 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                          : 'bg-slate-950 text-slate-500'
                      }`}
                    >
                      {sch.isActive ? '● ENABLED' : '○ DISABLED'}
                    </button>
                  </div>

                  <h4 className="font-bold text-white text-sm mt-2">{sch.name}</h4>

                  <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Layout:</span>
                      <span className="font-semibold text-cyan-400">{assignedLayout?.name || 'Default Canvas'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Playlist:</span>
                      <span className="font-semibold text-indigo-400">{assignedPlaylist?.name || 'Default Loop'}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Active Window:</span>
                      <span className="font-mono text-slate-200">{sch.startTime} - {sch.endTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 mt-3">
                    {daysLabel.map((dayName, dIdx) => {
                      const isDayActive = sch.daysOfWeek.includes(dIdx);
                      return (
                        <span
                          key={dayName}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            isDayActive 
                              ? 'bg-cyan-600 text-white' 
                              : 'bg-slate-950 text-slate-600'
                          }`}
                        >
                          {dayName}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Scope: {sch.screenGroupIds.join(', ')}</span>
                  <button
                    onClick={() => deleteSchedule(sch.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add Schedule Rule */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-white shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Scheduled Broadcast Rule</h3>

            <form onSubmit={handleCreateSchedule} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. Daily Cafeteria Lunch Menu"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Assigned Layout</label>
                  <select
                    value={layoutId}
                    onChange={(e) => setLayoutId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  >
                    {layouts.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Assigned Playlist</label>
                  <select
                    value={playlistId}
                    onChange={(e) => setPlaylistId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  >
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Days of Week</label>
                <div className="flex space-x-1">
                  {daysLabel.map((dName, idx) => (
                    <button
                      key={dName}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] ${
                        selectedDays.includes(idx) ? 'bg-cyan-600 text-white' : 'bg-slate-950 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {dName}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Priority Weight ({priority})</label>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 font-bold rounded-xl text-white">
                  Save Schedule Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
