/**
 * Zufalls-Passwort-Generator (Modus "Passwort").
 *
 * SICHERHEITSKRITISCH. Ablauf:
 *  1. Effektive Zeichenklassen bauen (Basisklassen minus mehrdeutige und
 *     ausgeschlossene Zeichen; Sonderzeichensatz anpassbar).
 *  2. Pflichtzeichen ziehen: erst "mindestens X Ziffern" und "mindestens X
 *     Sonderzeichen", dann — falls aktiv — je ein Zeichen fuer jede noch nicht
 *     abgedeckte gewaehlte Klasse. Jede Ziehung ist unbiased
 *     (Rejection-Sampling in crypto/random.ts).
 *  3. Restliche Positionen aus dem Gesamtalphabet fuellen.
 *  4. Fisher-Yates-Mischen, damit Pflichtzeichen nicht an vorhersagbaren
 *     Positionen stehen.
 *
 * "Keine Wiederholungen" wird als Ziehen ohne Zuruecklegen umgesetzt: der
 * jeweils verfuegbare Pool ist der Klassen- bzw. Gesamtpool minus der bereits
 * benutzten Zeichen; ist er leer, gibt es einen fachlichen Fehler statt eines
 * schwaecheren Passworts.
 */

import { pickChar, shuffleInPlace } from '../crypto/random'
import {
  AMBIGUOUS,
  DIGITS,
  LOWERCASE,
  UPPERCASE,
  dedupeChars,
  removeChars,
} from './charsets'
import { charEntropyBits } from './entropy'
import { GeneratorError } from './errors'
import type { GeneratorResult, PasswordOptions } from './types'

export const PASSWORD_LENGTH_MIN = 4
export const PASSWORD_LENGTH_MAX = 128

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  special: true,
  excludeAmbiguous: false,
  noRepeats: false,
  requireEachClass: true,
  minDigits: 1,
  minSpecial: 1,
  specialChars: '!@#$%^&*',
  excludeChars: '',
}

export interface EffectiveSets {
  upper: string
  lower: string
  digit: string
  special: string
  /** Vereinigung der AKTIVEN Klassen */
  all: string
}

/**
 * Baut die effektiv nutzbaren Zeichensaetze aus den Optionen.
 * Der Sonderzeichensatz wird um Zeichen bereinigt, die schon zu den
 * Basisklassen gehoeren — sonst waere die Zaehlung der Minima mehrdeutig
 * (z. B. wenn jemand "a1" in die Sonderzeichen schreibt).
 */
export function buildSets(o: PasswordOptions): EffectiveSets {
  const strip = (chars: string): string => {
    let out = dedupeChars(chars)
    if (o.excludeAmbiguous) out = removeChars(out, AMBIGUOUS)
    out = removeChars(out, o.excludeChars)
    return out
  }

  const special = removeChars(strip(o.specialChars), UPPERCASE + LOWERCASE + DIGITS)

  const sets: EffectiveSets = {
    upper: o.upper ? strip(UPPERCASE) : '',
    lower: o.lower ? strip(LOWERCASE) : '',
    digit: o.digits ? strip(DIGITS) : '',
    special: o.special ? special : '',
    all: '',
  }
  sets.all = sets.upper + sets.lower + sets.digit + sets.special
  return sets
}

export function generatePassword(o: PasswordOptions): GeneratorResult {
  if (
    !Number.isInteger(o.length) ||
    o.length < PASSWORD_LENGTH_MIN ||
    o.length > PASSWORD_LENGTH_MAX
  ) {
    throw new GeneratorError('lengthOutOfRange')
  }
  // Vertragspruefung: negative oder nicht-ganzzahlige Minima wuerden die
  // Kontingent-Logik (und damit die requireEachClass-Garantie) still aushebeln.
  for (const min of [o.minDigits, o.minSpecial]) {
    if (!Number.isInteger(min) || min < 0 || min > 9) {
      throw new RangeError(`generatePassword: ungültiges Minimum ${min}`)
    }
  }
  if (!o.upper && !o.lower && !o.digits && !o.special) {
    throw new GeneratorError('noClasses')
  }

  const sets = buildSets(o)
  if (sets.all.length === 0) throw new GeneratorError('emptyAlphabet')

  if (o.minDigits > 0 && sets.digit.length === 0) {
    throw new GeneratorError('minDigitsWithoutDigits')
  }
  if (o.minSpecial > 0 && sets.special.length === 0) {
    throw new GeneratorError('minSpecialWithoutSpecial')
  }

  // Pflicht-Kontingente planen: Minima zuerst, dann Klassenzwang fuer alle
  // gewaehlten Klassen, die noch nicht durch ein Minimum abgedeckt sind.
  const quotas: { pool: string; count: number }[] = [
    { pool: sets.digit, count: o.minDigits },
    { pool: sets.special, count: o.minSpecial },
  ]
  if (o.requireEachClass) {
    if (sets.upper) quotas.push({ pool: sets.upper, count: 1 })
    if (sets.lower) quotas.push({ pool: sets.lower, count: 1 })
    if (sets.digit && o.minDigits === 0) quotas.push({ pool: sets.digit, count: 1 })
    if (sets.special && o.minSpecial === 0) quotas.push({ pool: sets.special, count: 1 })
  }

  const requiredCount = quotas.reduce((sum, q) => sum + q.count, 0)
  if (requiredCount > o.length) throw new GeneratorError('minimaExceedLength')
  // Poolgroesse pro Codepoint zaehlen (Emoji im Sonderzeichensatz = 1 Zeichen).
  const poolSize = [...sets.all].length
  if (o.noRepeats && poolSize < o.length) {
    throw new GeneratorError('notEnoughUniqueChars')
  }

  // Ziehen ohne Zuruecklegen (nur bei noRepeats): der Pool wird pro Ziehung
  // um bereits benutzte Zeichen verkleinert. Jede einzelne Ziehung bleibt
  // dadurch gleichverteilt ueber die noch verfuegbaren Zeichen.
  const used = new Set<string>()
  const draw = (pool: string): string => {
    const effective = o.noRepeats ? removeChars(pool, [...used].join('')) : pool
    if (effective.length === 0) throw new GeneratorError('notEnoughUniqueChars')
    const ch = pickChar(effective)
    if (o.noRepeats) used.add(ch)
    return ch
  }

  const chars: string[] = []
  for (const q of quotas) {
    for (let i = 0; i < q.count; i++) chars.push(draw(q.pool))
  }
  while (chars.length < o.length) chars.push(draw(sets.all))

  // Mischen, damit z. B. die Pflicht-Ziffern nicht immer vorne stehen.
  shuffleInPlace(chars)

  const constrained =
    o.noRepeats || o.requireEachClass || o.minDigits > 0 || o.minSpecial > 0

  // Entropie: mit noRepeats wird ohne Zuruecklegen gezogen — exakt ist dann
  // sum(log2(N-i)) statt der L*log2(N)-Obergrenze.
  let entropyBits = charEntropyBits(o.length, poolSize)
  if (o.noRepeats) {
    entropyBits = 0
    for (let i = 0; i < o.length; i++) entropyBits += Math.log2(poolSize - i)
  }

  return {
    value: chars.join(''),
    entropyBits,
    poolSize,
    warnings: [],
    constrained,
  }
}
