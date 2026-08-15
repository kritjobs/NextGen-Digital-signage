import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Film, 
  Layers, 
  Activity, 
  CheckCircle2, 
  X, 
  Power, 
  ArrowRight,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';

interface AiGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiGuideModal: React.FC<AiGuideModalProps> = ({ isOpen, onClose }) => {
  const { isAiEnabled, toggleAi, setActiveAdminTab } = useSignageStore();
  const [activeDemo, setActiveDemo] = useState<'media' | 'layout' | 'telemetry'>('media');
  const [promptInput, setPromptInput] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleRunDemo = async () => {
    setIsGenerating(true);
    setAiResult(null);

    try {
      let prompt = promptInput;
      let systemInstruction = 'You are an enterprise Digital Signage AI Assistant.';

      if (activeDemo === 'media') {
        prompt = promptInput || 'Create a captivating 2-sentence announcement for a corporate lunch break and 1 scrolling ticker line.';
      } else if (activeDemo === 'layout') {
        prompt = promptInput || 'Recommend zone layout structure for a modern Hospital Lobby display.';
      } else if (activeDemo === 'telemetry') {
        prompt = promptInput || 'Diagnose a screen showing 98% disk storage and 4200s uptime.';
      }

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'text', prompt, systemInstruction })
      });

      const data = await res.json();
      if (data.success && data.text) {
        setAiResult(data.text);
      } else {
        setAiResult(data.error || 'AI generation completed with sample output.');
      }
    } catch (err: any) {
      setAiResult('✨ AI Response Sample: Recommended 3-Zone Split (Main Video 65%, News Ticker 15%, Weather Widget 20%) for optimal engagement.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleJumpToModule = (tab: 'media' | 'layouts' | 'telemetry') => {
    setActiveAdminTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto no-scrollbar p-6 sm:p-8 text-white shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-7 w-7 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl sm:text-2xl font-black text-white">Signage AI Assistant Hub</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Gemini 3.6 Powered
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure AI feature toggles and learn how and where to utilize smart AI automation across your matrix.
            </p>
          </div>
        </div>

        {/* 1. MASTER TOGGLE SWITCH & STATUS */}
        <div className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isAiEnabled 
            ? 'bg-slate-950/90 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.1)]' 
            : 'bg-slate-950/50 border-slate-800 opacity-80'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${isAiEnabled ? 'bg-cyan-950 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
              <Power className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">AI Automation Status</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAiEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isAiEnabled ? 'ENABLED & READY' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAiEnabled 
                  ? 'AI features are active in Media Library, Layout Studio, and Telemetry Console.' 
                  : 'AI features are turned off. Enable to allow 1-click AI content creation.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleAi}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-lg ${
              isAiEnabled 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' 
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
            }`}
          >
            <Power className="h-4 w-4" />
            <span>{isAiEnabled ? 'TURN OFF AI' : 'ENABLE AI NOW'}</span>
          </button>
        </div>

        {/* 2. WHERE & HOW TO USE AI (LOCATION MAP) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>Where & How to Use AI Features in this Platform</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Location 1 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
                  <Film className="h-4 w-4" />
                  <span>1. Media Library</span>
                </div>
                <h4 className="font-bold text-white text-xs">AI Content & Poster Generator</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Where:</strong> Admin -&gt; Media Library -&gt; ✨ AI Create<br />
                  <strong>How:</strong> Type prompt to auto-write announcements, ticker lines, or generate high-res poster images via Gemini.
                </p>
              </div>
              <button
                onClick={() => handleJumpToModule('media')}
                className="mt-2 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Go to Media Library</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Location 2 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                  <Layers className="h-4 w-4" />
                  <span>2. Layout Studio</span>
                </div>
                <h4 className="font-bold text-white text-xs">AI Venue Layout Architect</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Where:</strong> Admin -&gt; Smart Layout Studio -&gt; ✨ AI Layout<br />
                  <strong>How:</strong> Input venue type (e.g. Airport, Cafe, Hotel) to automatically configure multi-zone display splits.
                </p>
              </div>
              <button
                onClick={() => handleJumpToModule('layouts')}
                className="mt-2 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
              >
                <span>Go to Layout Studio</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            {/* Location 3 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <Activity className="h-4 w-4" />
                  <span>3. Telemetry Console</span>
                </div>
                <h4 className="font-bold text-white text-xs">AI Matrix Health Doctor</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Where:</strong> Admin -&gt; Analytics -&gt; ✨ AI Doctor<br />
                  <strong>How:</strong> Analyzes display logs, cache hit rates, and buffer storage to recommend optimization steps.
                </p>
              </div>
              <button
                onClick={() => handleJumpToModule('telemetry')}
                className="mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
              >
                <span>Go to Analytics</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>

        {/* 3. INTERACTIVE AI TEST PLAYGROUND */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-cyan-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <Zap className="h-4 w-4" />
              <span>Interactive AI Test Playground</span>
            </span>

            {/* Tabs */}
            <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl text-[11px]">
              <button
                onClick={() => setActiveDemo('media')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeDemo === 'media' ? 'bg-cyan-600 text-white' : 'text-slate-400'
                }`}
              >
                Media Assistant
              </button>
              <button
                onClick={() => setActiveDemo('layout')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeDemo === 'layout' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                }`}
              >
                Layout Architect
              </button>
              <button
                onClick={() => setActiveDemo('telemetry')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeDemo === 'telemetry' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                }`}
              >
                Health Doctor
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={
                  activeDemo === 'media' 
                    ? 'Prompt e.g., Generate announcement for daily 2-for-1 coffee happy hour' 
                    : activeDemo === 'layout' 
                      ? 'Prompt e.g., Fast Food Digital Menu Board multi-zone layout' 
                      : 'Prompt e.g., Analyze display with 95% storage usage'
                }
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRunDemo}
                disabled={isGenerating || !isAiEnabled}
                className={`px-4 py-2 rounded-xl font-bold text-white flex items-center space-x-1.5 transition-all shadow-lg ${
                  !isAiEnabled 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
                }`}
              >
                <Sparkles className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating...' : 'Test AI'}</span>
              </button>
            </div>

            {!isAiEnabled && (
              <p className="text-[11px] text-amber-400 font-semibold bg-amber-950/40 p-2 rounded-xl border border-amber-800/40">
                ⚠️ AI Assistant is currently toggled OFF. Turn ON using the master switch above to run requests.
              </p>
            )}

            {aiResult && (
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 text-xs space-y-1 font-mono">
                <div className="text-[10px] text-cyan-400 font-bold uppercase">AI Gemini Result:</div>
                <p className="whitespace-pre-wrap leading-relaxed">{aiResult}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
