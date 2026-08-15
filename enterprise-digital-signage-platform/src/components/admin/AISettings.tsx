/**
 * AI Settings Page — Manage providers + task→model mapping + test connections
 */
import React, { useState, useEffect } from 'react';
import {
  Bot, Plus, Trash2, Save, Check, X, RefreshCw, Zap,
  Settings, Sparkles, AlertCircle, Globe, Server, Cpu
} from 'lucide-react';
import { aiApi } from '../../services/api';

const PROVIDER_TYPES = [
  { id: 'gemini', label: 'Google Gemini', icon: '🔷', baseUrl: 'https://generativelanguage.googleapis.com' },
  { id: 'openrouter', label: 'OpenRouter', icon: '🌐', baseUrl: 'https://openrouter.ai/api/v1' },
  { id: 'ollama', label: 'Ollama (Local)', icon: '🦙', baseUrl: 'http://localhost:11434' },
  { id: 'openai_compatible', label: 'Custom (OpenAI-compatible)', icon: '⚡', baseUrl: '' },
];

const DEFAULT_MODELS: Record<string, string[]> = {
  gemini: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash-exp'],
  openrouter: ['anthropic/claude-sonnet-4-20250514', 'google/gemini-2.5-flash', 'openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct', 'mistralai/mistral-large-latest', 'deepseek/deepseek-chat-v3'],
  ollama: ['llama3.2', 'gemma2', 'mistral', 'phi3', 'qwen2.5'],
  openai_compatible: ['gpt-4o', 'gpt-4o-mini'],
};

export const AISettings: React.FC = () => {
  const [providers, setProviders] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'providers' | 'tasks'>('providers');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});

  // Add provider form
  const [isAddingProvider, setIsAddingProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', type: 'openrouter', baseUrl: '', apiKey: '' });

  // Edit provider
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editApiKey, setEditApiKey] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [p, t] = await Promise.all([aiApi.getProviders(), aiApi.getTasks()]);
      setProviders(p.data || []);
      setTasks(t.data || []);
    } catch {}
    setIsLoading(false);
  };

  const handleTestProvider = async (id: string) => {
    setTestingId(id);
    try {
      const result = await aiApi.testProvider(id);
      setTestResult(prev => ({ ...prev, [id]: result }));
    } catch (e: any) {
      setTestResult(prev => ({ ...prev, [id]: { success: false, message: e.message } }));
    }
    setTestingId(null);
    loadData();
  };

  const handleAddProvider = async () => {
    const type = PROVIDER_TYPES.find(t => t.id === newProvider.type);
    try {
      await aiApi.addProvider({
        name: newProvider.name || type?.label || 'New Provider',
        type: newProvider.type,
        baseUrl: newProvider.baseUrl || type?.baseUrl || '',
        apiKey: newProvider.apiKey,
        models: DEFAULT_MODELS[newProvider.type] || [],
      });
      setIsAddingProvider(false);
      setNewProvider({ name: '', type: 'openrouter', baseUrl: '', apiKey: '' });
      loadData();
    } catch {}
  };

  const handleDeleteProvider = async (id: string) => {
    if (!confirm('Delete this AI provider?')) return;
    try { await aiApi.deleteProvider(id); loadData(); } catch {}
  };

  const handleToggleProvider = async (id: string, isEnabled: boolean) => {
    try { await aiApi.updateProvider(id, { isEnabled }); loadData(); } catch {}
  };

  const handleSaveApiKey = async (id: string) => {
    try { await aiApi.updateProvider(id, { apiKey: editApiKey }); setEditingProviderId(null); setEditApiKey(''); loadData(); } catch {}
  };

  const handleUpdateTask = async (id: string, data: any) => {
    try { await aiApi.updateTask(id, data); loadData(); } catch {}
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin" /></div>;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <span>AI Configuration</span>
            <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">Multi-Provider</span>
          </h2>
          <p className="text-xs text-slate-400">Configure AI providers, API keys, and assign models to tasks</p>
        </div>
        <div className="flex bg-slate-950 border border-slate-700 rounded-xl p-0.5">
          <button onClick={() => setActiveSection('providers')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${activeSection === 'providers' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
            <Globe className="h-3 w-3 inline mr-1" /> Providers
          </button>
          <button onClick={() => setActiveSection('tasks')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${activeSection === 'tasks' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}>
            <Zap className="h-3 w-3 inline mr-1" /> Task Mapping
          </button>
        </div>
      </div>

      {/* ═══ PROVIDERS SECTION ═══════════════════════════════ */}
      {activeSection === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">AI Providers ({providers.length})</span>
            <button onClick={() => setIsAddingProvider(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg">
              <Plus className="h-3.5 w-3.5" /> Add Provider
            </button>
          </div>

          {providers.map(p => (
            <div key={p.id} className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${p.isEnabled ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{PROVIDER_TYPES.find(t => t.id === p.type)?.icon || '⚡'}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{p.name}</h4>
                    <span className="text-[10px] text-slate-500">{p.type} • {p.baseUrl?.slice(0, 40)}...</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Test button */}
                  <button onClick={() => handleTestProvider(p.id)} disabled={testingId === p.id}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium disabled:opacity-50">
                    {testingId === p.id ? <RefreshCw className="h-3 w-3 animate-spin inline" /> : <Zap className="h-3 w-3 inline" />} Test
                  </button>
                  {/* Toggle */}
                  <div onClick={() => handleToggleProvider(p.id, !p.isEnabled)}
                    className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all ${p.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${p.isEnabled ? 'translate-x-5' : ''}`} />
                  </div>
                  <button onClick={() => handleDeleteProvider(p.id)} className="text-slate-500 hover:text-rose-400 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                  p.lastTestStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                  p.lastTestStatus === 'failed' ? 'bg-rose-500/10 text-rose-400' :
                  'bg-slate-800 text-slate-500'
                }`}>
                  {p.lastTestStatus === 'success' ? <Check className="h-3 w-3" /> : p.lastTestStatus === 'failed' ? <AlertCircle className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
                  {p.lastTestStatus || 'untested'}
                </span>
                <span className="text-slate-600">API Key: {p.apiKeySet ? '✅ Set' : '❌ Not set'}</span>
                <span className="text-slate-600">Models: {p.models?.length || 0}</span>
              </div>

              {testResult[p.id] && (
                <div className={`text-[11px] p-2 rounded-lg ${testResult[p.id].success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  {testResult[p.id].message}
                </div>
              )}

              {/* API Key Warning + Edit */}
              {!p.apiKeySet && p.type !== 'ollama' && (
                <div className="text-[11px] p-2 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  No API key set — this provider won't work until you add a key.
                </div>
              )}

              {/* Edit API Key Form */}
              {editingProviderId === p.id ? (
                <div className="p-3 bg-slate-950 rounded-xl border border-purple-500/30 space-y-2">
                  <label className="text-[10px] text-slate-400 block">API Key</label>
                  <input type="text" value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)}
                    placeholder={p.type === 'openrouter' ? 'sk-or-v1-...' : p.type === 'gemini' ? 'AIzaSy...' : 'key...'}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-purple-500 focus:outline-none" autoFocus />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingProviderId(null); setEditApiKey(''); }}
                      className="px-3 py-1 text-xs text-slate-400 hover:text-white">Cancel</button>
                    <button onClick={() => handleSaveApiKey(p.id)} disabled={!editApiKey.trim()}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg disabled:opacity-30">
                      <Save className="h-3 w-3 inline mr-1" /> Save Key
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setEditingProviderId(p.id); setEditApiKey(''); }}
                  className="w-full text-left text-[11px] text-purple-400 hover:text-purple-300 py-1.5 px-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-purple-500/30">
                  ✏️ Edit API Key & Settings
                </button>
              )}
            </div>
          ))}

          {providers.length === 0 && (
            <div className="py-12 text-center bg-slate-900 rounded-xl border-2 border-dashed border-slate-700">
              <Bot className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No AI providers configured</p>
              <button onClick={() => setIsAddingProvider(true)} className="mt-3 text-xs text-purple-400 hover:text-purple-300">+ Add your first provider</button>
            </div>
          )}
        </div>
      )}


      {/* ═══ TASK MAPPING SECTION ════════════════════════════ */}
      {activeSection === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">Task → Model Mapping</span>
            <span className="text-[10px] text-slate-500">Assign which AI model handles each task type</span>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center bg-slate-900 rounded-xl border-2 border-dashed border-slate-700">
              <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No task configs yet. Add providers first, then seed tasks.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div key={task.id} className={`bg-slate-900 border rounded-xl p-4 space-y-3 ${task.isEnabled ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{task.taskLabel}</h4>
                      <p className="text-[10px] text-slate-500">{task.description || task.taskType}</p>
                    </div>
                    <div onClick={() => handleUpdateTask(task.id, { isEnabled: !task.isEnabled })}
                      className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-all ${task.isEnabled ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${task.isEnabled ? 'translate-x-5' : ''}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Provider</label>
                      <select value={task.providerId}
                        onChange={(e) => handleUpdateTask(task.id, { providerId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white">
                        {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Model</label>
                      <select value={task.modelId}
                        onChange={(e) => handleUpdateTask(task.id, { modelId: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white">
                        {(providers.find(p => p.id === task.providerId)?.models || []).map((m: string) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">System Prompt</label>
                    <textarea rows={2} value={task.systemPrompt || ''}
                      onChange={(e) => handleUpdateTask(task.id, { systemPrompt: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white resize-none"
                      placeholder="Custom system instruction..." />
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span>Temp: {task.temperature}</span>
                    <span>Max Tokens: {task.maxTokens}</span>
                    <span>Provider: {task.provider?.name || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ADD PROVIDER MODAL ══════════════════════════════ */}
      {isAddingProvider && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Add AI Provider</h3>
              <button onClick={() => setIsAddingProvider(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Provider Type</label>
                <select value={newProvider.type} onChange={(e) => setNewProvider(p => ({ ...p, type: e.target.value, baseUrl: PROVIDER_TYPES.find(t => t.id === e.target.value)?.baseUrl || '' }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white">
                  {PROVIDER_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Display Name</label>
                <input type="text" value={newProvider.name} onChange={(e) => setNewProvider(p => ({ ...p, name: e.target.value }))}
                  placeholder={PROVIDER_TYPES.find(t => t.id === newProvider.type)?.label}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Base URL</label>
                <input type="text" value={newProvider.baseUrl || PROVIDER_TYPES.find(t => t.id === newProvider.type)?.baseUrl || ''}
                  onChange={(e) => setNewProvider(p => ({ ...p, baseUrl: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-[11px]" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">API Key {newProvider.type === 'ollama' && <span className="text-slate-600">(not required)</span>}</label>
                <input type="password" value={newProvider.apiKey} onChange={(e) => setNewProvider(p => ({ ...p, apiKey: e.target.value }))}
                  placeholder={newProvider.type === 'openrouter' ? 'sk-or-...' : newProvider.type === 'gemini' ? 'AIzaSy...' : ''}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button onClick={() => setIsAddingProvider(false)} className="px-4 py-2 text-slate-400">Cancel</button>
                <button onClick={handleAddProvider} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg">
                  <Plus className="h-3 w-3 inline mr-1" /> Add Provider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
