import { useLanguageStore } from '../store/useLanguageStore';
import { translate, type TranslationKey, type TranslationVars } from '../i18n';
import { SUPPORTED_LANGUAGES, type LanguageCode, type LanguageMeta } from '../i18n';

export interface UseTranslationResult {
  /** Translate a typed key with optional `{var}` interpolation. */
  t: (key: TranslationKey, vars?: TranslationVars) => string;
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languages: LanguageMeta[];
}

export function useTranslation(): UseTranslationResult {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const t = (key: TranslationKey, vars?: TranslationVars) => translate(language, key, vars);

  return { t, language, setLanguage, languages: SUPPORTED_LANGUAGES };
}
