/** Die 12 UI-Sprachen. Labels sind Eigennamen (werden nie uebersetzt). */
export interface Language {
  code: string
  label: string
}

export const LANGUAGES: Language[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
]

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code)
