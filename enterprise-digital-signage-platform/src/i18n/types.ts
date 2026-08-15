/**
 * i18n language registry.
 *
 * To add a NEW language:
 *   1. Add its code to the `LanguageCode` union below.
 *   2. Add an entry to `SUPPORTED_LANGUAGES` (this is what drives the
 *      switcher UI — nothing else needs to change).
 *   3. Create `src/i18n/translations/<code>.ts` typed as `Messages`
 *      (the compiler will list every missing key for you).
 *   4. Register it in `translations` inside `src/i18n/index.ts`.
 *
 * English (`en`) is the CORE language — it is the source of truth for the
 * translation keys and the automatic fallback for any missing string.
 */

export type LanguageCode = 'en' | 'th' | 'zh';

export interface LanguageMeta {
  code: LanguageCode;
  /** BCP-47 locale used for <html lang> and date/number formatting */
  locale: string;
  /** Language name written in its own script (shown in the switcher) */
  nativeName: string;
  /** Compact label used by the collapsed switcher button */
  shortLabel: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', locale: 'en-US', nativeName: 'English', shortLabel: 'EN', flag: '🇺🇸' },
  { code: 'th', locale: 'th-TH', nativeName: 'ไทย', shortLabel: 'TH', flag: '🇹🇭' },
  { code: 'zh', locale: 'zh-CN', nativeName: '中文', shortLabel: '中', flag: '🇨🇳' },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_STORAGE_KEY = 'signage_language';

export function isSupportedLanguage(code: string | null | undefined): code is LanguageCode {
  return !!code && SUPPORTED_LANGUAGES.some((l) => l.code === code);
}
