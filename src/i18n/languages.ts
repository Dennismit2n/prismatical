/**
 * Die 14 UI-Sprachen. Labels sind Eigennamen (werden nie uebersetzt).
 *
 * Reihenfolge wie im Auswahlfeld der Startseite: Deutsch und Englisch vorn,
 * dann die uebrige Lateinschrift alphabetisch, danach Russisch, Hindi und die
 * ostasiatischen Schriften.
 */
export interface Language {
  code: string
  label: string
}

export const LANGUAGES: Language[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'pt', label: 'Português' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ru', label: 'Русский' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
]

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code)
