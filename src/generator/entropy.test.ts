import { describe, expect, it } from 'vitest'
import { charEntropyBits, pinEntropyBits, wordEntropyBits } from './entropy'
import { DEFAULT_PASSPHRASE_OPTIONS, generatePassphrase } from './passphrase'
import { generatePronounceable } from './pronounceable'

describe('Entropie-Berechnung', () => {
  it('Zeichen-Passwoerter: length * log2(alphabet)', () => {
    // Referenzwerte von Hand nachgerechnet:
    expect(charEntropyBits(20, 70)).toBeCloseTo(122.586, 2)
    expect(charEntropyBits(16, 94)).toBeCloseTo(104.873, 2)
    expect(charEntropyBits(0, 70)).toBe(0)
    expect(charEntropyBits(20, 1)).toBe(0)
  })

  it('Passphrasen: 6 Woerter aus EFF-Liste (7776) ≈ 77,5 Bit', () => {
    expect(wordEntropyBits(6, 7776)).toBeCloseTo(77.549, 2)
    expect(wordEntropyBits(1, 7776)).toBeCloseTo(12.925, 2)
  })

  it('PIN: n * log2(10)', () => {
    expect(pinEntropyBits(6)).toBeCloseTo(19.93, 2)
    expect(pinEntropyBits(4)).toBeCloseTo(13.29, 2)
  })
})

describe('Passphrase-Extras erhoehen die Entropie exakt', () => {
  const list = Array.from({ length: 7776 }, (_, i) => `wort${i}`)

  it('Basis: wordCount * log2(listSize)', () => {
    const r = generatePassphrase({ ...DEFAULT_PASSPHRASE_OPTIONS }, list)
    expect(r.entropyBits).toBeCloseTo(6 * Math.log2(7776), 5)
    expect(r.value.split('-')).toHaveLength(6)
  })

  it('Ziffern-Trenner: + (n-1) * log2(10)', () => {
    const r = generatePassphrase(
      { ...DEFAULT_PASSPHRASE_OPTIONS, separator: 'digit' },
      list,
    )
    expect(r.entropyBits).toBeCloseTo(6 * Math.log2(7776) + 5 * Math.log2(10), 5)
    expect(r.value).toMatch(/^(?:wort\d+\d){5}wort\d+$/)
  })

  it('angehaengte Ziffer: + log2(wortAnzahl) + log2(10)', () => {
    const r = generatePassphrase(
      { ...DEFAULT_PASSPHRASE_OPTIONS, includeDigit: true },
      list,
    )
    expect(r.entropyBits).toBeCloseTo(
      6 * Math.log2(7776) + Math.log2(6) + Math.log2(10),
      5,
    )
  })
})

describe('Aussprechbar-Modus: ehrliche (geringere) Entropie + Warnhinweis', () => {
  it('berechnet Entropie aus den echten Set-Groessen pro Position', () => {
    const r = generatePronounceable({ length: 14, capitalize: false, appendDigits: false })
    // 7 Konsonanten-Positionen (17er-Set) + 7 Vokal-Positionen (4er-Set)
    expect(r.entropyBits).toBeCloseTo(7 * Math.log2(17) + 7 * Math.log2(4), 5)
    expect(r.warnings).toContain('pronounceableEntropy')
  })

  it('haengt bei appendDigits genau 2 Ziffern an und zaehlt sie', () => {
    const r = generatePronounceable({ length: 14, capitalize: true, appendDigits: true })
    expect(r.value).toMatch(/^[A-Za-z]{12}\d{2}$/)
    expect(r.entropyBits).toBeCloseTo(
      6 * Math.log2(17) + 6 * Math.log2(4) + 2 * Math.log2(10),
      5,
    )
  })
})
