import { create } from 'zustand';
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  isSupportedLanguage,
  getLocale,
  type LanguageCode,
} from '../i18n';

interface LanguageState {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
}

/**
 * Initial language resolution order:
 *   1. saved preference in localStorage (`signage_language`)
 *   2. browser locale hint (th / zh)
 *   3. DEFAULT_LANGUAGE (English — the core language)
 */
const getInitialLanguage = (): LanguageCode => {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
    const nav = (navigator.language || '').toLowerCase();
    if (nav.startsWith('th')) return 'th';
    if (nav.startsWith('zh')) return 'zh';
  } catch { /* localStorage unavailable */ }
  return DEFAULT_LANGUAGE;
};

export const useLanguageStore = create<LanguageState>((set) => ({
  language: getInitialLanguage(),

  setLanguage: (language) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.code === language)) return;
    set({ language });
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch { /* ignore */ }
    document.documentElement.lang = getLocale(language);
  },
}));

// Keep <html lang> in sync on load (before any component mounts)
if (typeof document !== 'undefined') {
  document.documentElement.lang = getLocale(getInitialLanguage());
}
