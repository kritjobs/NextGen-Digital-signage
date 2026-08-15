import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Play, Pause, GripVertical, Layers, Clock, RotateCcw } from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';
import { Campaign, CampaignLayoutItem } from '../../types/signage';
import { campaignApi } from '../../services/api';

export const CampaignManager: React.FC = () => {
  const { layouts } = useSignageStore();
  const publishedLayouts = layouts.filter(l => l.status === 'published');

  // REQ-011: campaigns เก็บฝั่ง server (DB) — ไม่ใช้ localStorage อีกต่อไป
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      const res = await campaignApi.getAll();
      setCampaigns(res.data || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadCampaigns(); }, [loadCampaigns]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formMode, setFormMode] = useState<'sequential' | 'random'>('sequential');
  const [formSequence, setFormSequence] = useState<CampaignLayoutItem[]>([]);

  const openCreate = () => {
    setEditId(null);
    setFormName('');
    setFormMode('sequential');
    setFormSequence([{ layoutId: publishedLayouts[0]?.id || '', durationSec: 30 }]);
    setShowCreate(true);
  };

  const openEdit = (c: Campaign) => {
    setEditId(c.id);
    setFormName(c.name);
    setFormMode(c.cycleMode);
    setFormSequence([...c.layoutSequence]);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      setError(null);
      const payload = { name: formName, cycleMode: formMode, layoutSequence: formSequence };
      if (editId) {
        await campaignApi.update(editId, payload);
      } else {
        await campaignApi.create({ ...payload, description: '', isActive: true });
      }
      await loadCampaigns();
      setShowCreate(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save campaign');
    }
  };

  const toggleActive = async (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return;
    try {
      setError(null);
      await campaignApi.update(id, { isActive: !target.isActive });
      await loadCampaigns();
    } catch (e: any) {
      setError(e.message || 'Failed to update campaign');
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      setError(null);
      await campaignApi.delete(id);
      await loadCampaigns();
    } catch (e: any) {
      setError(e.message || 'Failed to delete campaign');
    }
  };

  const addSequenceItem = () => {
    setFormSequence([...formSequence, { layoutId: publishedLayouts[0]?.id || '', durationSec: 30 }]);
  };

  const removeSequenceItem = (idx: number) => {
    setFormSequence(formSequence.filter((_, i) => i !== idx));
  };

  const updateSequenceItem = (idx: number, field: keyof CampaignLayoutItem, value: any) => {
    setFormSequence(formSequence.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const totalDuration = formSequence.reduce((sum, item) => sum + item.durationSec, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-violet-400" />
            <span>Campaign Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Create multi-layout campaigns that rotate automatically on screens</p>
        </div>
        <button onClick={openCreate} className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all">
          <Plus className="h-4 w-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-700/40 rounded-xl px-4 py-2 text-xs text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Campaign List */}
      {loading ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <RotateCcw className="h-12 w-12 text-slate-700 mx-auto mb-3 animate-spin" />
          <p className="text-slate-400 text-sm">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
          <RotateCcw className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No campaigns yet</p>
          <p className="text-slate-600 text-xs mt-1">Create a campaign to rotate multiple layouts automatically (saved to server, applies to all screens below schedule priority)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map(campaign => {
            const layoutNames = campaign.layoutSequence.map(item => {
              const l = layouts.find(lay => lay.id === item.layoutId);
              return l?.name || 'Unknown';
            });
            const total = campaign.layoutSequence.reduce((s, i) => s + i.durationSec, 0);

            return (
              <div key={campaign.id} className={`bg-slate-900 border rounded-2xl p-4 transition-all ${campaign.isActive ? 'border-violet-700/50' : 'border-slate-800 opacity-60'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{campaign.name}</h3>
                    <p className="text-[10px] text-slate-500">{campaign.layoutSequence.length} layouts • {total}s total • {campaign.cycleMode}</p>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button onClick={() => toggleActive(campaign.id)} className={`p-1.5 rounded-lg ${campaign.isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'}`} title={campaign.isActive ? 'Pause' : 'Activate'}>
                      {campaign.isActive ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => openEdit(campaign)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-[10px] font-bold">Edit</button>
                    <button onClick={() => deleteCampaign(campaign.id)} className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {/* Layout sequence preview */}
                <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                  {campaign.layoutSequence.map((item, i) => (
                    <div key={i} className="flex items-center shrink-0">
                      <div className="bg-violet-950/50 border border-violet-800/30 rounded-lg px-2 py-1 text-[9px]">
                        <span className="text-violet-300 font-medium">{layoutNames[i]}</span>
                        <span className="text-violet-500 ml-1">{item.durationSec}s</span>
                      </div>
                      {i < campaign.layoutSequence.length - 1 && <span className="text-slate-600 mx-0.5 text-[10px]">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editId ? 'Edit Campaign' : 'Create Campaign'}</h3>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Campaign Name</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Morning Rotation" className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Cycle Mode</label>
                <select value={formMode} onChange={e => setFormMode(e.target.value as any)} className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white">
                  <option value="sequential">Sequential (in order)</option>
                  <option value="random">Random</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Layout Sequence</label>
                  <span className="text-[10px] text-violet-400">Total: {totalDuration}s ({Math.round(totalDuration / 60)}min)</span>
                </div>

                <div className="space-y-2">
                  {formSequence.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700/50">
                      <GripVertical className="h-4 w-4 text-slate-600 shrink-0" />
                      <span className="text-[10px] text-slate-500 w-4 shrink-0">{idx + 1}.</span>
                      <select
                        value={item.layoutId}
                        onChange={e => updateSequenceItem(idx, 'layoutId', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        {publishedLayouts.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                      <div className="flex items-center space-x-1 shrink-0">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <input
                          type="number"
                          min={5}
                          max={600}
                          value={item.durationSec}
                          onChange={e => updateSequenceItem(idx, 'durationSec', Number(e.target.value))}
                          className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                        />
                        <span className="text-[9px] text-slate-500">sec</span>
                      </div>
                      {formSequence.length > 1 && (
                        <button onClick={() => removeSequenceItem(idx)} className="text-rose-400 hover:text-rose-300 shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={addSequenceItem} className="mt-2 w-full flex items-center justify-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-dashed border-slate-700">
                  <Plus className="h-3 w-3" />
                  <span>Add Layout</span>
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 flex justify-end space-x-2">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm">Cancel</button>
              <button onClick={handleSave} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm">
                {editId ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
