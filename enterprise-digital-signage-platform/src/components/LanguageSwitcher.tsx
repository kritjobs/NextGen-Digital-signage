import React, { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../store/useThemeStore';

/**
 * Language switcher — renders a globe button showing the current language's
 * short label; clicking opens a dropdown listing every language in
 * `SUPPORTED_LANGUAGES` (adding a language there automatically adds it here).
 */
export const LanguageSwitcher: React.FC = () => {
  const { t, language, setLanguage, languages } = useTranslation();
  const { theme } = useThemeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const current = languages.find((l) => l.code === language) ?? languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        id="language-switcher"
        type="button"
        aria-label={t('language.label')}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        title={t('language.label')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Globe className="h-3.5 w-3.5" />
        <span>{current.shortLabel}</span>
        <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-1.5 w-44 rounded-xl border shadow-2xl overflow-hidden z-50 ${
            theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
          }`}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => {
                setLanguage(lang.code);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors cursor-pointer ${
                lang.code === language
                  ? theme === 'dark'
                    ? 'bg-cyan-600/20 text-cyan-300'
                    : 'bg-cyan-50 text-cyan-700'
                  : theme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-700/60'
                    : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="font-semibold">{lang.nativeName}</span>
              {lang.code === language && <span className="ml-auto text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
