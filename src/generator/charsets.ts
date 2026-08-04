/** Zeichenklassen-Grundlagen des Zufalls-Passwort-Modus. */

export const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
export const DIGITS = '0123456789'
export const DEFAULT_SPECIAL = '!@#$%^&*'

/** Mehrdeutige Zeichen (l/1/I/| und 0/O), per Option ausschliessbar. */
export const AMBIGUOUS = 'l1I|0O'

export type CharClass = 'upper' | 'lower' | 'digit' | 'special'

/**
 * Klassifiziert ein Zeichen fuer Zaehlung (Minima) und Zeichen-Typ-Faerbung.
 * Basisklassen haben Vorrang; alles andere gilt als Sonderzeichen.
 */
export function classOfChar(ch: string): CharClass {
  if (UPPERCASE.includes(ch)) return 'upper'
  if (LOWERCASE.includes(ch)) return 'lower'
  if (DIGITS.includes(ch)) return 'digit'
  return 'special'
}

/** Entfernt Duplikate aus einem Zeichensatz-String, erhaelt die Reihenfolge. */
export function dedupeChars(chars: string): string {
  return [...new Set([...chars])].join('')
}

/** Entfernt alle Zeichen aus `remove` aus dem Satz `chars`. */
export function removeChars(chars: string, remove: string): string {
  if (!remove) return chars
  const removeSet = new Set([...remove])
  return [...chars].filter((c) => !removeSet.has(c)).join('')
}
