import React, { useState } from 'react';
import { Monitor, Lock, Mail, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useBrandingStore } from '../store/useBrandingStore';

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuthStore();
  const { loginTitle, loginSubtitle, logoUrl } = useBrandingStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await login(email, password);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.1),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
            <Monitor className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {loginTitle || 'SIGNAGE ENTERPRISE'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {loginSubtitle || 'Smart Digital Signage Management Platform'}
          </p>
        </div>

        {/* Login Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Secure Login</h2>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <p className="text-rose-300 text-sm">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@signage.local"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl
                           text-white placeholder-slate-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                           transition-all"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl
                           text-white placeholder-slate-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                           transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn || !email || !password}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm
                       bg-indigo-600 hover:bg-indigo-500 text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200
                       shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Guest Mode */}
          <div className="mt-5 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => {
                // Bypass auth — set guest user directly in store
                const guestUser = { id: 'guest-001', email: 'guest@signage.local', displayName: 'Guest Viewer', role: 'super_admin' as const };
                localStorage.setItem('signage_user', JSON.stringify(guestUser));
                localStorage.setItem('signage_access_token', 'guest-token-bypass');
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm
                       bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700
                       transition-all duration-200"
            >
              Enter as Guest (Demo Mode)
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Protected by JWT + RBAC • Session expires in 15 min
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          NextGen Digital Signage Platform v0.2.0 • Enterprise Security
        </p>
      </div>
    </div>
  );
};
