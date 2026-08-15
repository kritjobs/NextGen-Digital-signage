/**
 * InteractPage — หน้า QR Scan-to-Interact (มือถือ)
 * URL: /interact/:screenId
 * Flow: สแกน QR บนจอ → เปิดหน้านี้ → ส่งข้อความ Quick Post (ไม่ต้อง login)
 *       หรือเปลี่ยน layout/playlist (ต้องเป็น admin — ใช้ token ใน browser นี้)
 */
import React, { useState, useEffect } from 'react';
import { Monitor, Send, LayoutGrid, ListVideo, CheckCircle2, AlertCircle, Loader2, Lock, Zap } from 'lucide-react';

interface InteractData {
  screen: { id: string; name: string; group: string };
  availableActions: string[];
  layouts: { id: string; name: string }[];
  playlists: { id: string; name: string }[];
}

export const InteractPage: React.FC = () => {
  const screenId = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [data, setData] = useState<InteractData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Quick message form
  const [message, setMessage] = useState('');
  const [style, setStyle] = useState('info');
  const [duration, setDuration] = useState(15);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  // Content switch (admin)
  const [switching, setSwitching] = useState<string | null>(null);
  const [switchMsg, setSwitchMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/interact/${screenId}`);
        if (!res.ok) throw new Error('Screen not found');
        setData(await res.json());
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [screenId]);

  const authHeaders = () => {
    const token = localStorage.getItem('signage_access_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setSent(null);
    setSwitchMsg(null);
    try {
      const res = await fetch(`/api/interact/${screenId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'show_message', payload: { message: message.trim(), style, duration } }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setSent(`ส่งแล้ว — จอจะแสดงทันที (${duration} วินาที)`);
      setMessage('');
    } catch (err: any) {
      setSent(`⚠️ ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const switchContent = async (action: 'set_layout' | 'set_playlist', id: string, name: string) => {
    setSwitching(action + ':' + id);
    setSwitchMsg(null);
    setSent(null);
    try {
      const key = action === 'set_layout' ? 'layoutId' : 'playlistId';
      const res = await fetch(`/api/interact/${screenId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action, payload: { [key]: id } }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          setSwitchMsg('🔒 เปลี่ยนเนื้อหาต้องเป็น admin — ลงชื่อเข้าใช้ก่อน (ส่งข้อความได้โดยไม่ต้อง login)');
        } else {
          setSwitchMsg(`⚠️ ${j.error || 'Failed'}`);
        }
        return;
      }
      setSwitchMsg(`✅ สลับเป็น "${name}" แล้ว — จออัปเดตทันที`);
    } catch (err: any) {
      setSwitchMsg(`⚠️ ${err.message}`);
    } finally {
      setSwitching(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
        <p className="text-slate-400 text-sm">กำลังโหลดข้อมูลจอ...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h1 className="text-xl font-bold">ไม่พบหน้าจอนี้</h1>
        <p className="text-slate-400 text-sm">{error || 'Screen not found'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
          <Monitor className="w-5 h-5 text-cyan-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold truncate">{data.screen.name}</h1>
          <p className="text-[11px] text-slate-400 truncate">{data.screen.group} • สแกน QR จากจอเพื่อควบคุม</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-5 mt-5">

        {/* Quick Message */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Zap className="w-4 h-4 text-amber-400" />
            ส่งข้อความด่วนถึงจอ <span className="text-[10px] text-slate-500 font-normal">(ไม่ต้อง login)</span>
          </div>
          <form onSubmit={sendMessage} className="space-y-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="พิมพ์ข้อความ เช่น ประชุมห้อง 301 เวลา 14:00 น."
              rows={2}
              maxLength={200}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-2">
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs flex-1"
              >
                <option value="info">ℹ️ ข้อมูล</option>
                <option value="warning">⚠️ คำเตือน</option>
                <option value="success">✅ ประกาศดี</option>
                <option value="urgent">🚨 ด่วน</option>
              </select>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs"
              >
                <option value={15}>15 วิ</option>
                <option value={30}>30 วิ</option>
                <option value={60}>1 นาที</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold text-sm flex items-center justify-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              ส่งถึงจอเดี๋ยวนี้
            </button>
          </form>
          {sent && (
            <p className={`text-xs font-semibold ${sent.startsWith('⚠️') ? 'text-rose-400' : 'text-emerald-400'}`}>
              {sent}
            </p>
          )}
        </section>

        {/* Content Switch (admin) */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <LayoutGrid className="w-4 h-4 text-indigo-400" />
            เปลี่ยนเนื้อหาบนจอ <Lock className="w-3 h-3 text-slate-500" />
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-2 flex items-center gap-1.5">
              <ListVideo className="w-3.5 h-3.5" /> Playlist ({data.playlists.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {data.playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchContent('set_playlist', p.id, p.name)}
                  disabled={switching?.startsWith('set_playlist')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {switching === 'set_playlist:' + p.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                  {p.name}
                </button>
              ))}
              {data.playlists.length === 0 && <p className="text-xs text-slate-600">ไม่มี playlist</p>}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-semibold uppercase mb-2 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" /> Layout ({data.layouts.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {data.layouts.map((l) => (
                <button
                  key={l.id}
                  onClick={() => switchContent('set_layout', l.id, l.name)}
                  disabled={switching?.startsWith('set_layout')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  {switching === 'set_layout:' + l.id ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                  {l.name}
                </button>
              ))}
              {data.layouts.length === 0 && <p className="text-xs text-slate-600">ไม่มี layout</p>}
            </div>
          </div>

          {switchMsg && (
            <p className={`text-xs font-semibold ${switchMsg.startsWith('🔒') || switchMsg.startsWith('⚠️') ? 'text-amber-400' : 'text-emerald-400'}`}>
              {switchMsg}
            </p>
          )}
        </section>

        {/* Footer note */}
        <div className="flex items-start gap-2 text-[11px] text-slate-600 px-1">
          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>การส่งข้อความไม่ต้อง login — การเปลี่ยน playlist/layout ต้องเป็นผู้ดูแลระบบ (ลงชื่อเข้าใช้ในมือถือเครื่องนี้ก่อน)</p>
        </div>
      </div>
    </div>
  );
};
