import { en, type Messages, type TranslationKey } from './translations/en';
import { th } from './translations/th';
import { zh } from './translations/zh';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type LanguageCode } from './types';

export type { Messages, TranslationKey } from './translations/en';
export type { LanguageCode, LanguageMeta } from './types';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, isSupportedLanguage } from './types';

/**
 * Registry of all language message packs.
 * When adding a language: add its pack here (see types.ts for the checklist).
 */
export const translations: Record<LanguageCode, Messages> = {
  en,
  th,
  zh,
};

export type TranslationVars = Record<string, string | number>;

/** Returns the message pack for a language, falling back to English (core). */
export function getMessages(lang: string | null | undefined): Messages {
  return translations[(lang as LanguageCode) ?? DEFAULT_LANGUAGE] ?? en;
}

/**
 * Translate a key for a given language with `{var}` interpolation.
 * Unknown keys fall back to English, then to the raw key — never throws.
 */
export function translate(lang: string | null | undefined, key: TranslationKey, vars?: TranslationVars): string {
  const pack = getMessages(lang);
  let msg = pack[key];
  if (msg === undefined) {
    msg = en[key]; // core fallback
  }
  if (msg === undefined) {
    return key; // last-resort: show the key itself
  }
  if (!vars) return msg;
  return msg.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/** Returns the BCP-47 locale for a language (falls back to English). */
export function getLocale(lang: string | null | undefined): string {
  return SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.locale ?? 'en-US';
}
