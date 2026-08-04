/**
 * Aussprechbar-Modus: alternierende Konsonant-Vokal-Silben.
 *
 * KOMFORT-FEATURE mit bewusst GERINGERER Entropie pro Zeichen als der
 * Zufalls-Modus — die UI zeigt dazu einen sichtbaren Warnhinweis
 * (warnings: ['pronounceableEntropy']). Die Entropie wird ehrlich aus den
 * tatsaechlichen Set-Groessen pro Position berechnet, nicht geschoent.
 */

import { pickChar, randomDigits } from '../crypto/random'
import { GeneratorError } from './errors'
import type { GeneratorResult, PronounceableOptions } from './types'

export const PRONOUNCEABLE_MIN = 6
export const PRONOUNCEABLE_MAX = 32

// Ohne leicht verwechselbare Zeichen (l, o, q, x, y) — bleibt tippbar/lesbar.
const CONSONANTS = 'bcdfghjkmnprstvwz' // 17 Zeichen
const VOWELS = 'aeiu' // 4 Zeichen (ohne o wegen 0-Verwechslung)

export const DEFAULT_PRONOUNCEABLE_OPTIONS: PronounceableOptions = {
  length: 14,
  capitalize: true,
  appendDigits: true,
}

export function generatePronounceable(o: PronounceableOptions): GeneratorResult {
  if (
    !Number.isInteger(o.length) ||
    o.length < PRONOUNCEABLE_MIN ||
    o.length > PRONOUNCEABLE_MAX
  ) {
    throw new GeneratorError('lengthOutOfRange')
  }

  const digitCount = o.appendDigits ? 2 : 0
  const letterCount = o.length - digitCount

  let out = ''
  let bits = 0
  for (let i = 0; i < letterCount; i++) {
    // Gerade Positionen Konsonant, ungerade Vokal → "bakuri"-Muster.
    const set = i % 2 === 0 ? CONSONANTS : VOWELS
    out += pickChar(set)
    bits += Math.log2(set.length)
  }
  if (o.capitalize && out.length > 0) {
    // Feste Position (erstes Zeichen) → kein Entropiegewinn, wird nicht gezaehlt.
    out = out.charAt(0).toUpperCase() + out.slice(1)
  }
  if (digitCount > 0) {
    out += randomDigits(digitCount)
    bits += digitCount * Math.log2(10)
  }

  return {
    value: out,
    entropyBits: bits,
    poolSize: CONSONANTS.length + VOWELS.length,
    warnings: ['pronounceableEntropy'],
    constrained: true,
  }
}
