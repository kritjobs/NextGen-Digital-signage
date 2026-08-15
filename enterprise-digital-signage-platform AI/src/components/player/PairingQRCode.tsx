import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Tv, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  Wifi, 
  ArrowRight 
} from 'lucide-react';
import { useSignageStore } from '../../store/useSignageStore';

interface PairingQRCodeProps {
  initialCode?: string;
  onPairSuccess?: (code: string) => void;
}

export const PairingQRCode: React.FC<PairingQRCodeProps> = ({ 
  initialCode = 'PAIR-8899',
  onPairSuccess 
}) => {
  const { screens, setPlayerScreenId } = useSignageStore();
  const [pairingCode, setPairingCode] = useState<string>(initialCode);
  const [isCopied, setIsCopied] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Dynamic mobile auth url encoded into the QR code
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://signage.app';
  const mobileAuthUrl = `${baseUrl}/pair?code=${pairingCode}&device=SmartTV-4K`;

  const handleGenerateNewCode = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newCode = `PAIR-${randomNum}`;
    setPairingCode(newCode);
    setAuthSuccess(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileAuthUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulateMobilePairing = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setAuthSuccess(true);
      
      // Select the first available screen or fire callback after 1.2s
      setTimeout(() => {
        if (onPairSuccess) {
          onPairSuccess(pairingCode);
        } else if (screens.length > 0) {
          setPlayerScreenId(screens[0].id);
        }
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Background ambient glow effect */}
      <div className="absolute inset-0 bg-radial from-cyan-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center space-y-6">
        
        {/* Header Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Tv className="h-3.5 w-3.5 animate-pulse" />
            <span>Smart TV Pairing Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Mobile Device Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Scan the dynamic QR code below using your mobile camera or Signage Companion app to instantly register this screen.
          </p>
        </div>

        {/* QR Code Container & Pairing Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full items-center bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
          
          {/* QR Code Box */}
          <div className="flex flex-col items-center space-y-3">
            <div className="relative group p-3 bg-slate-950 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_25px_rgba(34,211,238,0.15)] transition-all duration-300 hover:border-cyan-400">
              {/* Corner accents */}
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

              <QRCodeSVG
                value={mobileAuthUrl}
                size={180}
                bgColor="#020617"
                fgColor="#22d3ee"
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <Wifi className="h-3 w-3 text-emerald-400 animate-ping" />
              <span>WebSocket Port 3000 Listening...</span>
            </div>
          </div>

          {/* Manual Code & Quick Actions */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pairing Passcode</span>
              <div className="mt-1 flex items-center space-x-2">
                <div className="px-4 py-2 bg-slate-900 border-2 border-cyan-500 rounded-xl font-mono text-2xl font-black text-cyan-400 tracking-widest shadow-inner">
                  {pairingCode}
                </div>
                <button
                  onClick={handleGenerateNewCode}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                  title="Generate New Pairing Code"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Encoded URL info */}
            <div className="w-full text-xs bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Encoded Auth Endpoint</div>
              <div className="font-mono text-[11px] text-slate-300 truncate max-w-[200px]">
                {mobileAuthUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 mt-1"
              >
                {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{isCopied ? 'Link Copied!' : 'Copy Mobile Auth URL'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Steps and Authentication Trigger */}
        <div className="w-full space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white">
                <Smartphone className="h-3.5 w-3.5 text-cyan-400" />
                <span>1. Scan QR</span>
              </div>
              <p className="text-[11px] text-slate-400">Use mobile phone camera to open authentication link.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>2. Authenticate</span>
              </div>
              <p className="text-[11px] text-slate-400">Authorize display pairing via cloud credentials.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-white">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>3. Sync & Play</span>
              </div>
              <p className="text-[11px] text-slate-400">WebSocket handshake binds screen instantly.</p>
            </div>
          </div>

          {/* Interactive Mobile Auth Simulator Button */}
          <div className="pt-2">
            <button
              onClick={handleSimulateMobilePairing}
              disabled={isAuthenticating || authSuccess}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer ${
                authSuccess 
                  ? 'bg-emerald-600 text-white' 
                  : isAuthenticating 
                    ? 'bg-slate-800 text-slate-400 cursor-wait' 
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold'
              }`}
            >
              {authSuccess ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-white animate-bounce" />
                  <span>MOBILE AUTHENTICATION SUCCESSFUL! CONNECTING...</span>
                </>
              ) : isAuthenticating ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
                  <span>PERFORMING MOBILE WEBSOCKET HANDSHAKE...</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5" />
                  <span>SIMULATE MOBILE QR SCAN & PAIR DISPLAY</span>
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
