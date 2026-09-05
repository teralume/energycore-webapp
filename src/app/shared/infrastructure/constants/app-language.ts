export const APP_LANGUAGES = {
  ES: 'es',
  EN: 'en',
  PT: 'pt',
} as const;

export type AppLanguageCode =
  (typeof APP_LANGUAGES)[keyof typeof APP_LANGUAGES];

export const DEFAULT_LANGUAGE: AppLanguageCode = APP_LANGUAGES.ES;

export const SUPPORTED_LANGUAGES: AppLanguageCode[] = [
  APP_LANGUAGES.ES,
  APP_LANGUAGES.EN,
  APP_LANGUAGES.PT,
];

export const LANGUAGE_LABELS: Record<AppLanguageCode, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};