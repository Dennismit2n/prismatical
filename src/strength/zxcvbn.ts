/**
 * zxcvbn-ts-Integration (Core 4.x, klassenbasierte API: ZxcvbnFactory + .check).
 *
 * Woerterbuecher und Tastatur-Graphen werden lazy per dynamic import geladen
 * (eigene Chunks, praecached vom Service Worker → offline verfuegbar).
 * Pro UI-Sprache wird das passende Sprachpaket dazugemischt; fuer Sprachen
 * ohne Paket (ru, zh) gilt der dokumentierte Fallback auf Englisch.
 */

import { ZxcvbnFactory } from '@zxcvbn-ts/core'
import type { OptionsType, ZxcvbnResult } from '@zxcvbn-ts/core'

export type { ZxcvbnResult }

interface LanguagePack {
  translations: OptionsType['translations']
  dictionary: Record<string, (string | number)[]>
}

const PACK_LOADERS: Record<string, () => Promise<LanguagePack>> = {
  de: () => import('@zxcvbn-ts/language-de'),
  en: () => import('@zxcvbn-ts/language-en'),
  fr: () => import('@zxcvbn-ts/language-fr'),
  es: () => import('@zxcvbn-ts/language-es-es'),
  it: () => import('@zxcvbn-ts/language-it'),
  pt: () => import('@zxcvbn-ts/language-pt-br'),
  nl: () => import('@zxcvbn-ts/language-nl-be'),
  pl: () => import('@zxcvbn-ts/language-pl'),
  tr: () => import('@zxcvbn-ts/language-tr'),
  ja: () => import('@zxcvbn-ts/language-ja'),
}

let factory: ZxcvbnFactory | null = null
let factoryLang = ''
let pending: Promise<void> | null = null

/** Sprache mit zxcvbn-Paket? Sonst greift der en-Fallback (ru, zh). */
export function zxcvbnLangFor(uiLang: string): string {
  return uiLang in PACK_LOADERS ? uiLang : 'en'
}

/**
 * Laedt (einmal pro Sprache) Woerterbuecher + Graphen und baut die Factory.
 * Das englische Woerterbuch ist immer dabei — englische Woerter sind in
 * Passwoertern weltweit haeufig und sollen ueberall erkannt werden.
 */
export function ensureChecker(uiLang: string): Promise<void> {
  const lang = zxcvbnLangFor(uiLang)
  if (factory && factoryLang === lang) return Promise.resolve()
  if (pending) return pending

  pending = (async () => {
    const [common, en, pack] = await Promise.all([
      import('@zxcvbn-ts/language-common'),
      import('@zxcvbn-ts/language-en'),
      PACK_LOADERS[lang](),
    ])
    const options: OptionsType = {
      translations: pack.translations,
      graphs: common.adjacencyGraphs,
      dictionary: {
        ...common.dictionary,
        ...en.dictionary,
        ...pack.dictionary,
      },
      useLevenshteinDistance: true,
    }
    factory = new ZxcvbnFactory(options)
    factoryLang = lang
  })().finally(() => {
    pending = null
  })
  return pending
}

/** Synchrone Pruefung; null, solange die Factory noch laedt. */
export function checkStrength(password: string): ZxcvbnResult | null {
  if (!factory || password.length === 0) return null
  return factory.check(password)
}
