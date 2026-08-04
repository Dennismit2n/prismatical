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
const BLOCK_BYTES = 64

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
  const alphabet = sets.all
  if (alphabet.length === 0) throw new GeneratorError('emptyAlphabet')
  if (!Number.isInteger(options.length) || options.length < 4 || options.length > 64) {
    throw new GeneratorError('lengthOutOfRange')
  }

  const n = alphabet.length
  const limit = 256 - (256 % n)
  let out = ''
  let blockIndex = 0
  let block = await deriveBlock(input, blockIndex)
  let pos = 0

  while (out.length < options.length) {
    if (pos >= block.length) {
      blockIndex += 1
      block = await deriveBlock(input, blockIndex)
      pos = 0
    }
    const b = block[pos++]
    if (b < limit) out += alphabet[b % n] // Rejection-Sampling wie im Zufallsmodus
  }

  return {
    value: out,
    entropyBits: charEntropyBits(options.length, n),
    poolSize: n,
    warnings: ['deterministicNoRecovery'],
    constrained: false,
  }
}
