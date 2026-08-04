/**
 * Zentrale Zufallsquelle von Prisma.
 *
 * SICHERHEITSKRITISCH — bitte nur mit Bedacht aendern.
 *
 * Grundsaetze:
 *  1. ALLE Zufaelle der App kommen aus crypto.getRandomValues() (CSPRNG des
 *     Betriebssystems). Math.random() ist im gesamten Projekt verboten und
 *     wird zusaetzlich per ESLint-Regel blockiert.
 *  2. Kein Modulo-Bias: `getRandomValues() % n` waere fuer die meisten n
 *     unfair, weil 256 bzw. 2^32 nicht glatt durch n teilbar sind — niedrige
 *     Werte kaemen dann messbar haeufiger vor. Wir nutzen Rejection-Sampling:
 *     Byte-Werte oberhalb des groessten Vielfachen von n werden verworfen und
 *     neu gezogen. Der Chi-Quadrat-Test in random.test.ts belegt die
 *     Gleichverteilung (und dass die naive Modulo-Variante durchfallen wuerde).
 */

const MAX_UINT32 = 0x1_0000_0000 // 2^32

function getCrypto(): Crypto {
  const c = globalThis.crypto
  if (!c || typeof c.getRandomValues !== 'function') {
    // Ohne CSPRNG erzeugen wir grundsaetzlich nichts — lieber ein harter
    // Fehler als ein unsicheres Passwort.
    throw new Error('Web Crypto API nicht verfügbar – keine sichere Zufallsquelle.')
  }
  return c
}

/**
 * Liefert eine gleichverteilte Ganzzahl im Bereich [0, maxExclusive).
 *
 * Rejection-Sampling:
 *  - Fuer n <= 256 ziehen wir 8-Bit-Werte und verwerfen alles >= 256 - (256 % n).
 *    `limit` ist damit das groesste Vielfache von n unterhalb von 256; jeder
 *    Wert < limit faellt in genau gleich viele Restklassen — kein Bias.
 *  - Fuer n > 256 (z. B. Wortlisten mit 7776 Eintraegen) laeuft dieselbe Logik
 *    ueber 32-Bit-Werte: verworfen wird alles >= 2^32 - (2^32 % n).
 *
 * Die Schleife terminiert praktisch sofort: die Verwurfswahrscheinlichkeit
 * liegt immer unter 50 %, meist weit darunter.
 */
export function randomBelow(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > MAX_UINT32) {
    throw new RangeError(`randomBelow: ungültige Obergrenze ${maxExclusive}`)
  }
  if (maxExclusive === 1) return 0

  const c = getCrypto()

  if (maxExclusive <= 256) {
    const limit = 256 - (256 % maxExclusive)
    // Batch von 16 Bytes: spart getRandomValues-Aufrufe, aendert an der
    // Verteilung nichts (jedes Byte wird einzeln geprueft).
    const buf = new Uint8Array(16)
    for (;;) {
      c.getRandomValues(buf)
      for (const b of buf) {
        if (b < limit) return b % maxExclusive
      }
    }
  }

  const limit = MAX_UINT32 - (MAX_UINT32 % maxExclusive)
  const buf = new Uint32Array(8)
  for (;;) {
    c.getRandomValues(buf)
    for (const v of buf) {
      if (v < limit) return v % maxExclusive
    }
  }
}

/** Ein gleichverteilt zufaelliges Zeichen aus einem Alphabet-String. */
export function pickChar(alphabet: string): string {
  if (alphabet.length === 0) throw new RangeError('pickChar: leeres Alphabet')
  // Hinweis: alle Alphabete in Prisma bestehen aus BMP-Zeichen (ASCII),
  // daher ist Index-Zugriff pro UTF-16-Einheit hier korrekt.
  return alphabet[randomBelow(alphabet.length)]
}

/** Ein gleichverteilt zufaelliges Element aus einem Array (z. B. Diceware-Wort). */
export function pickItem<T>(items: readonly T[]): T {
  if (items.length === 0) throw new RangeError('pickItem: leere Liste')
  return items[randomBelow(items.length)]
}

/**
 * Fisher-Yates-Mischen in-place. Jede Permutation ist gleich wahrscheinlich,
 * weil jeder Tauschindex unbiased via randomBelow gezogen wird.
 * Wird benutzt, damit Pflichtzeichen (Minima) nicht an vorhersagbaren
 * Positionen im Passwort landen.
 */
export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1)
    const tmp = items[i]
    items[i] = items[j]
    items[j] = tmp
  }
  return items
}

/** n gleichverteilte Dezimalziffern als String (fuer PIN-Modus; fuehrende Nullen erlaubt). */
export function randomDigits(count: number): string {
  let out = ''
  for (let i = 0; i < count; i++) out += randomBelow(10).toString()
  return out
}
