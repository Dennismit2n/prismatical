import { describe, expect, it } from 'vitest'
import { AMBIGUOUS, DIGITS } from './charsets'
import { GeneratorError } from './errors'
import {
  DEFAULT_PASSWORD_OPTIONS,
  buildSets,
  generatePassword,
} from './password'
import type { PasswordOptions } from './types'

const base: PasswordOptions = { ...DEFAULT_PASSWORD_OPTIONS }

function countMatching(value: string, pool: string): number {
  return [...value].filter((c) => pool.includes(c)).length
}

describe('generatePassword – Grundregeln', () => {
  it('haelt die gewuenschte Laenge ein (4–128)', () => {
    for (const length of [4, 20, 77, 128]) {
      expect(generatePassword({ ...base, length }).value).toHaveLength(length)
    }
  })

  it('weist Laengen ausserhalb 4–128 zurueck', () => {
    for (const length of [3, 129, 0, -1, 10.5]) {
      expect(() => generatePassword({ ...base, length })).toThrow(GeneratorError)
    }
  })

  it('nutzt nur Zeichen aus den gewaehlten Klassen', () => {
    const o: PasswordOptions = {
      ...base,
      upper: false,
      special: false,
      minSpecial: 0,
      length: 40,
    }
    const sets = buildSets(o)
    for (let i = 0; i < 50; i++) {
      const { value } = generatePassword(o)
      for (const ch of value) expect(sets.all).toContain(ch)
    }
  })

  it('wirft, wenn keine Klasse gewaehlt ist', () => {
    expect(() =>
      generatePassword({
        ...base,
        upper: false,
        lower: false,
        digits: false,
        special: false,
        minDigits: 0,
        minSpecial: 0,
      }),
    ).toThrow(GeneratorError)
  })
})

describe('generatePassword – Minima werden IMMER erfuellt', () => {
  it('mindestens X Ziffern und Y Sonderzeichen, ueber viele Kombinationen', () => {
    for (let minDigits = 0; minDigits <= 9; minDigits++) {
      for (const minSpecial of [0, 1, 3, 9]) {
        const o: PasswordOptions = { ...base, length: 24, minDigits, minSpecial }
        const sets = buildSets(o)
        for (let run = 0; run < 20; run++) {
          const { value } = generatePassword(o)
          expect(countMatching(value, sets.digit)).toBeGreaterThanOrEqual(minDigits)
          expect(countMatching(value, sets.special)).toBeGreaterThanOrEqual(minSpecial)
        }
      }
    }
  })

  it('jede gewaehlte Klasse kommt mindestens einmal vor (requireEachClass)', () => {
    const o: PasswordOptions = {
      ...base,
      length: 4,
      minDigits: 0,
      minSpecial: 0,
      requireEachClass: true,
    }
    const sets = buildSets(o)
    for (let run = 0; run < 200; run++) {
      const { value } = generatePassword(o)
      expect(countMatching(value, sets.upper)).toBeGreaterThanOrEqual(1)
      expect(countMatching(value, sets.lower)).toBeGreaterThanOrEqual(1)
      expect(countMatching(value, sets.digit)).toBeGreaterThanOrEqual(1)
      expect(countMatching(value, sets.special)).toBeGreaterThanOrEqual(1)
    }
  })

  it('wirft, wenn Minima die Laenge sprengen', () => {
    expect(() =>
      generatePassword({ ...base, length: 4, minDigits: 9, minSpecial: 9 }),
    ).toThrow(GeneratorError)
  })

  it('wirft, wenn ein Minimum ohne zugehoerige Klasse gefordert ist', () => {
    expect(() =>
      generatePassword({ ...base, digits: false, minDigits: 2 }),
    ).toThrow(GeneratorError)
    expect(() =>
      generatePassword({ ...base, special: false, minSpecial: 2 }),
    ).toThrow(GeneratorError)
  })
})

describe('generatePassword – Ausschluesse', () => {
  it('mehrdeutige Zeichen tauchen bei excludeAmbiguous nie auf', () => {
    const o: PasswordOptions = { ...base, excludeAmbiguous: true, length: 64 }
    for (let run = 0; run < 100; run++) {
      const { value } = generatePassword(o)
      for (const ch of AMBIGUOUS) expect(value).not.toContain(ch)
    }
  })

  it('frei ausgeschlossene Zeichen tauchen nie auf', () => {
    const o: PasswordOptions = { ...base, excludeChars: 'aeiouAEIOU159!@', length: 64 }
    for (let run = 0; run < 100; run++) {
      const { value } = generatePassword(o)
      for (const ch of o.excludeChars) expect(value).not.toContain(ch)
    }
  })

  it('nutzt nur den benutzerdefinierten Sonderzeichensatz', () => {
    const o: PasswordOptions = {
      ...base,
      upper: false,
      lower: false,
      digits: false,
      minDigits: 0,
      specialChars: '_-.',
      minSpecial: 1,
      length: 20,
    }
    const { value } = generatePassword(o)
    for (const ch of value) expect('_-.').toContain(ch)
  })

  it('bereinigt Basisklassen-Zeichen aus dem Sonderzeichensatz', () => {
    const sets = buildSets({ ...base, specialChars: 'a1!B' })
    expect(sets.special).toBe('!')
  })
})

describe('generatePassword – keine Wiederholungen', () => {
  it('kein Zeichen kommt doppelt vor', () => {
    const o: PasswordOptions = { ...base, noRepeats: true, length: 40 }
    for (let run = 0; run < 100; run++) {
      const { value } = generatePassword(o)
      expect(new Set([...value]).size).toBe(value.length)
    }
  })

  it('wirft, wenn das Alphabet fuer die Laenge zu klein ist', () => {
    // Nur Ziffern (10 Zeichen) ohne Wiederholung, aber Laenge 11 → unmoeglich.
    expect(() =>
      generatePassword({
        ...base,
        upper: false,
        lower: false,
        special: false,
        minSpecial: 0,
        minDigits: 0,
        noRepeats: true,
        length: 11,
      }),
    ).toThrow(GeneratorError)
  })

  it('funktioniert am Limit (alle 10 Ziffern bei Laenge 10)', () => {
    const { value } = generatePassword({
      ...base,
      upper: false,
      lower: false,
      special: false,
      minSpecial: 0,
      minDigits: 0,
      noRepeats: true,
      length: 10,
    })
    expect([...value].sort().join('')).toBe(DIGITS)
  })
})

describe('generatePassword – Entropie-Metadaten', () => {
  it('meldet Alphabetgroesse und rohe Entropie', () => {
    const o: PasswordOptions = {
      ...base,
      minDigits: 0,
      minSpecial: 0,
      requireEachClass: false,
    }
    const result = generatePassword(o)
    // 26+26+10+8 = 70 Zeichen; 20 * log2(70) ≈ 122,6 Bit
    expect(result.poolSize).toBe(70)
    expect(result.entropyBits).toBeCloseTo(20 * Math.log2(70), 5)
    expect(result.constrained).toBe(false)
  })

  it('markiert Regel-Einschraenkungen als constrained', () => {
    expect(generatePassword({ ...base, minDigits: 2 }).constrained).toBe(true)
    expect(generatePassword({ ...base, noRepeats: true }).constrained).toBe(true)
  })

  it('noRepeats: exakte Entropie sum(log2(N-i)) statt der L*log2(N)-Obergrenze', () => {
    // Nur Ziffern (N=10), Laenge 10 ohne Wiederholung → log2(10!) ≈ 21,79 Bit
    const r = generatePassword({
      ...base,
      upper: false,
      lower: false,
      special: false,
      minSpecial: 0,
      minDigits: 0,
      noRepeats: true,
      length: 10,
    })
    let expected = 0
    for (let i = 0; i < 10; i++) expected += Math.log2(10 - i)
    expect(r.entropyBits).toBeCloseTo(expected, 5)
    expect(r.entropyBits).toBeLessThan(10 * Math.log2(10))
  })
})

describe('generatePassword – Vertragspruefungen und Sonderfaelle', () => {
  it('weist negative oder nicht-ganzzahlige Minima zurueck', () => {
    expect(() => generatePassword({ ...base, minDigits: -1 })).toThrow(RangeError)
    expect(() => generatePassword({ ...base, minSpecial: 2.5 })).toThrow(RangeError)
    expect(() => generatePassword({ ...base, minDigits: 10 })).toThrow(RangeError)
  })

  it('zaehlt Nicht-BMP-Sonderzeichen (Emoji) als EIN Zeichen und liefert gueltige Strings', () => {
    const o = {
      ...base,
      upper: false,
      lower: false,
      digits: false,
      minDigits: 0,
      specialChars: '😀😁😂🤖🔒',
      minSpecial: 1,
      length: 8,
    }
    for (let run = 0; run < 50; run++) {
      const r = generatePassword(o)
      const chars = [...r.value]
      expect(chars).toHaveLength(8) // 8 Codepoints, nicht 16 UTF-16-Einheiten
      expect(r.poolSize).toBe(5)
      // kein halbes Surrogat-Paar: jeder Codepoint ist eines der 5 Emoji
      for (const ch of chars) expect([...'😀😁😂🤖🔒']).toContain(ch)
    }
  })
})
