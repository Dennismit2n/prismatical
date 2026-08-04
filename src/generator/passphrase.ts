/**
 * Passphrase-Modus (Diceware).
 *
 * Woerter werden unbiased aus der geladenen Wortliste gezogen (Rejection-
 * Sampling ueber den 32-Bit-Pfad, da Listen > 256 Eintraege haben).
 * Entropie = wordCount × log2(listSize); Extras (Ziffern-Trenner, angehaengte
 * Ziffer/Sonderzeichen) werden exakt aufaddiert und einzeln ausgewiesen.
 */

import { pickChar, pickItem, randomBelow, randomDigits } from '../crypto/random'
import { DEFAULT_SPECIAL } from './charsets'
import { wordEntropyBits } from './entropy'
import { GeneratorError } from './errors'
import type { GeneratorResult, PassphraseOptions } from './types'

export const PASSPHRASE_WORDS_MIN = 3
export const PASSPHRASE_WORDS_MAX = 12

export const DEFAULT_PASSPHRASE_OPTIONS: PassphraseOptions = {
  wordCount: 6,
  separator: 'dash',
  customSeparator: '',
  capitalizeWords: false,
  includeDigit: false,
  includeSpecial: false,
  listId: 'auto',
}

export function generatePassphrase(
  o: PassphraseOptions,
  words: readonly string[],
): GeneratorResult {
  if (
    !Number.isInteger(o.wordCount) ||
    o.wordCount < PASSPHRASE_WORDS_MIN ||
    o.wordCount > PASSPHRASE_WORDS_MAX
  ) {
    throw new GeneratorError('lengthOutOfRange')
  }
  if (words.length < 2) throw new GeneratorError('wordlistUnavailable')

  const picked: string[] = []
  for (let i = 0; i < o.wordCount; i++) {
    let w = pickItem(words)
    if (o.capitalizeWords) w = w.charAt(0).toUpperCase() + w.slice(1)
    picked.push(w)
  }

  // Basis-Entropie: nur die Wortauswahl.
  let bits = wordEntropyBits(o.wordCount, words.length)

  // Extras: jede Zufallsentscheidung wird exakt beziffert.
  if (o.includeDigit) {
    // Wahl des Wortes (log2 n) + Wahl der Ziffer (log2 10)
    const idx = randomBelow(o.wordCount)
    picked[idx] = picked[idx] + randomDigits(1)
    bits += Math.log2(o.wordCount) + Math.log2(10)
  }
  if (o.includeSpecial) {
    const idx = randomBelow(o.wordCount)
    picked[idx] = picked[idx] + pickChar(DEFAULT_SPECIAL)
    bits += Math.log2(o.wordCount) + Math.log2(DEFAULT_SPECIAL.length)
  }

  let value: string
  if (o.separator === 'digit') {
    // Jede Fuge bekommt eine eigene Zufallsziffer: (n-1) × log2 10 Bits extra.
    let out = picked[0]
    for (let i = 1; i < picked.length; i++) out += randomDigits(1) + picked[i]
    bits += (picked.length - 1) * Math.log2(10)
    value = out
  } else {
    const sep =
      o.separator === 'dash'
        ? '-'
        : o.separator === 'dot'
          ? '.'
          : o.separator === 'space'
            ? ' '
            : o.customSeparator
    value = picked.join(sep)
  }

  return {
    value,
    entropyBits: bits,
    poolSize: words.length,
    warnings: [],
    constrained: false,
  }
}
