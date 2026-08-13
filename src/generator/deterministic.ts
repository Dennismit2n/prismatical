/**
 * Deterministischer / zustandsloser Modus (LessPass-Prinzip).
 *
 * SICHERHEITSKRITISCH. Aus Master-Passwort + Domain + Login + Zaehler wird per
 * PBKDF2-SHA-256 (Web Crypto, 310.000 Iterationen — OWASP-Empfehlung) ein
 * reproduzierbares Passwort abgeleitet. Es wird NICHTS gespeichert und NICHTS
 * versendet; dasselbe Eingabe-Tripel ergibt immer dasselbe Passwort.
 *
 * KEIN RECOVERY: Wer das Master-Passwort vergisst, kann die abgeleiteten
 * Passwoerter nicht wiederherstellen. Die UI zeigt diesen Hinweis deutlich an.
 *
 * Auch hier gilt das Anti-Bias-Prinzip: abgeleitete Bytes werden per
 * Rejection-Sampling auf das Alphabet abgebildet (Bytes >= 256 - (256 % n)
 * werden verworfen). Reichen die Bytes eines Blocks nicht, wird deterministisch
 * ein weiterer Block mit erhoehtem Block-Index abgeleitet — das Ergebnis
 * bleibt fuer gleiche Eingaben identisch.
 */

import { GeneratorError } from './errors'
import { buildSets } from './password'
import { charEntropyBits } from './entropy'
import type { GeneratorResult, PasswordOptions } from './types'

export interface DeterministicInput {
  master: string
  site: string
  login: string
  counter: number
}

const PBKDF2_ITERATIONS = 310_000
/**
 * Genau eine SHA-256-Ausgabelaenge pro deriveBits-Aufruf: dkLen > hashLen
 * wuerde PBKDF2 intern mehrfach laufen lassen, ein Angreifer muesste aber nur
 * den ersten Block berechnen — das verschenkte Verteidiger-Arbeit.
 */
const BLOCK_BYTES = 32

async function deriveBlock(input: DeterministicInput, blockIndex: number): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(input.master),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  // \x00 als Feldtrenner verhindert Kollisionen wie site="ab"+login="c" vs. "a"+"bc".
  const salt = enc.encode(
    `prisma-det-v1\x00${input.site}\x00${input.login}\x00${input.counter}\x00${blockIndex}`,
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS },
    key,
    BLOCK_BYTES * 8,
  )
  return new Uint8Array(bits)
}

/**
 * Leitet ein deterministisches Passwort ab. `options` steuert Laenge und
 * Zeichenklassen (Minima/noRepeats gibt es hier bewusst nicht — sie wuerden
 * die Reproduzierbarkeit verkomplizieren, ohne Sicherheit zu gewinnen).
 */
export async function deriveDeterministicPassword(
  input: DeterministicInput,
  options: Pick<
    PasswordOptions,
    'length' | 'upper' | 'lower' | 'digits' | 'special' | 'specialChars'
  >,
): Promise<GeneratorResult> {
  const fullOptions: PasswordOptions = {
    ...options,
    excludeAmbiguous: false,
    noRepeats: false,
    requireEachClass: false,
    minDigits: 0,
    minSpecial: 0,
    excludeChars: '',
  }
  if (!options.upper && !options.lower && !options.digits && !options.special) {
    throw new GeneratorError('noClasses')
  }
  const sets = buildSets(fullOptions)
  // Pro CODEPOINT arbeiten (nutzerdefinierte Sonderzeichen koennten Emoji sein).
  const alphabet = [...sets.all]
  if (alphabet.length === 0) throw new GeneratorError('emptyAlphabet')
  if (!Number.isInteger(options.length) || options.length < 4 || options.length > 64) {
    throw new GeneratorError('lengthOutOfRange')
  }

  const n = alphabet.length
  // 16-Bit-Rejection-Sampling (2 Bytes pro Ziehung): traegt auch Alphabete
  // mit mehr als 256 Zeichen. Der fruehere 8-Bit-Pfad haette bei n > 256
  // JEDEN Wert verworfen (limit = 0) und niemals terminiert.
  if (n > 0x10000) throw new GeneratorError('emptyAlphabet')
  const limit = 0x10000 - (0x10000 % n)
  const picks: string[] = []
  let blockIndex = 0
  let block = await deriveBlock(input, blockIndex)
  let pos = 0

  while (picks.length < options.length) {
    if (pos + 1 >= block.length) {
      blockIndex += 1
      block = await deriveBlock(input, blockIndex)
      pos = 0
    }
    const value = (block[pos] << 8) | block[pos + 1]
    pos += 2
    if (value < limit) picks.push(alphabet[value % n]) // Rejection-Sampling
  }

  return {
    value: picks.join(''),
    entropyBits: charEntropyBits(options.length, n),
    poolSize: n,
    warnings: ['deterministicNoRecovery'],
    constrained: false,
  }
}
