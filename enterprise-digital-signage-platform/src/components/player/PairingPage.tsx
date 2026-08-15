/**
 * PairingPage — TV เปิดหน้านี้เพื่อ pair กับ server
 * URL: /pair
 * Flow: ใส่ pairing code → verify → ได้ token → redirect ไป /display/:id
 */
import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Wifi, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const PairingPage: React.FC = () => {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pairedInfo, setPairedInfo] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Check if already paired (token in localStorage)
  useEffect(() => {
    const savedToken = localStorage.getItem('signage_display_token');
    const savedScreenId = localStorage.getItem('signage_display_screen_id');
    if (savedToken && savedScreenId) {
      // Auto-redirect to player
      window.location.href = `/display/${savedScreenId}?token=${savedToken}`;
    }
  }, []);

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setStatus('pairing');
    setErrorMsg('');

    try {
      // ข้อมูลจริงจากตัวเครื่อง: browser หา IP/MAC เองไม่ได้ → server ใช้ req.ip แทน
      // แต่ถ้ารันใน Android player (SignageNative) จะได้ IP/MAC จริงจากระบบ
      let nativeInfo: any = {};
      try {
        const raw = (window as any).SignageNative?.getDeviceInfo?.();
        if (raw) nativeInfo = JSON.parse(raw);
      } catch { /* ignore */ }

      const deviceInfo: any = {
        userAgent: navigator.userAgent,
        resolution: `${screen.width}x${screen.height}`,
      };
      if (nativeInfo.ipAddress) deviceInfo.ipAddress = nativeInfo.ipAddress;
      if (nativeInfo.macAddress) deviceInfo.macAddress = nativeInfo.macAddress;
      if (nativeInfo.model) deviceInfo.model = nativeInfo.model;

      const res = await fetch('/api/display/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: code.trim(), deviceInfo }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Pairing failed');
        return;
      }

      // Save token for auto-reconnect
      localStorage.setItem('signage_display_token', data.displayToken);
      localStorage.setItem('signage_display_screen_id', data.screen.id);

      setStatus('success');
      setPairedInfo(data);

      // Enter fullscreen before redirecting to display
      try {
        const el = document.documentElement;
        if (el.requestFullscreen) {
          el.requestFullscreen();
        } else if ((el as any).webkitRequestFullscreen) {
          (el as any).webkitRequestFullscreen();
        }
      } catch (e) { /* ignore if not allowed */ }

      // Redirect to player after 2 seconds
      setTimeout(() => {
        window.location.href = data.displayUrl;
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg('Network error: ' + err.message);
    }
  };

  const handleUnpair = () => {
    localStorage.removeItem('signage_display_token');
    localStorage.removeItem('signage_display_screen_id');
    setStatus('idle');
    setCode('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-4">
            <Monitor className="w-10 h-10 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Digital Signage
          </h1>
          <p className="text-slate-400 mt-2">
            Enter the pairing code to connect this display
          </p>
        </div>

        {/* Pairing Form */}
        {status === 'idle' || status === 'error' ? (
          <form onSubmit={handlePair} className="space-y-6">
            <div>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE (e.g. LOBBY-88)"
                className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em]
                         bg-slate-900 border-2 border-slate-700 rounded-2xl px-6 py-5
                         text-white placeholder-slate-600
                         focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20
                         uppercase"
                maxLength={20}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {status === 'error' && (
              <div className="flex items-center justify-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!code.trim()}
              className="w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed
                       text-white text-lg font-bold rounded-2xl transition-all
                       shadow-lg shadow-cyan-600/30"
            >
              <span className="flex items-center justify-center gap-2">
                <Wifi className="w-5 h-5" />
                Connect Display
              </span>
            </button>
          </form>
        ) : status === 'pairing' ? (
          <div className="py-12">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-lg">Connecting...</p>
          </div>
        ) : status === 'success' && pairedInfo ? (
          <div className="py-8 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">Paired Successfully!</h2>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Display:</span>
                <span className="text-white font-semibold">{pairedInfo.screen.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Group:</span>
                <span className="text-cyan-400">{pairedInfo.screen.group}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-300">{pairedInfo.screen.location}</span>
              </div>
            </div>
            <p className="text-emerald-400 text-sm animate-pulse">
              Starting display in 2 seconds...
            </p>
          </div>
        ) : null}

        {/* Footer info */}
        <div className="mt-12 text-xs text-slate-600 space-y-1">
          <p>Ask your administrator for the pairing code</p>
          <p>This display will auto-reconnect on restart</p>
          {(localStorage.getItem('signage_display_token')) && (
            <button onClick={handleUnpair} className="mt-2 text-slate-500 hover:text-rose-400 underline">
              Unpair this device
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
