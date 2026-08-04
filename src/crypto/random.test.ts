import { describe, expect, it } from 'vitest'
import { pickChar, randomBelow, randomDigits, shuffleInPlace } from './random'

/**
 * Chi-Quadrat-Statistik ueber beobachtete Klassenhaeufigkeiten
 * gegen die Gleichverteilung.
 */
function chiSquared(counts: number[], totalSamples: number): number {
  const expected = totalSamples / counts.length
  return counts.reduce((sum, obs) => sum + ((obs - expected) ** 2) / expected, 0)
}

describe('randomBelow – Rejection-Sampling ohne Modulo-Bias', () => {
  it('8-Bit-Pfad: Chi-Quadrat-Test ist fuer n=61 unauffaellig', () => {
    // n=61 ist ein harter Fall: 256 % 61 = 12, naives Modulo waere klar biased.
    const n = 61
    const samplesPerClass = 3000
    const total = n * samplesPerClass
    const counts = new Array<number>(n).fill(0)
    for (let i = 0; i < total; i++) counts[randomBelow(n)]++
    const chi2 = chiSquared(counts, total)
    // df=60; Schwelle ~ df + 5*sqrt(2*df) entspricht p < 1e-4 → praktisch nie flaky.
    expect(chi2).toBeLessThan(115)
  })

  it('32-Bit-Pfad: Chi-Quadrat-Test ist fuer n=300 unauffaellig', () => {
    const n = 300 // > 256 erzwingt den Uint32-Pfad (wie bei Wortlisten)
    const samplesPerClass = 1000
    const total = n * samplesPerClass
    const counts = new Array<number>(n).fill(0)
    for (let i = 0; i < total; i++) counts[randomBelow(n)]++
    const chi2 = chiSquared(counts, total)
    expect(chi2).toBeLessThan(425) // df=299, gleiche Logik
  })

  it('Gegenprobe: naives Modulo OHNE Rejection faellt im selben Test durch', () => {
    // Beweist, dass unser Testaufbau Bias ueberhaupt erkennen kann.
    const n = 61
    const samplesPerClass = 3000
    const total = n * samplesPerClass
    const counts = new Array<number>(n).fill(0)
    const buf = new Uint8Array(4096)
    let produced = 0
    while (produced < total) {
      crypto.getRandomValues(buf)
      for (const b of buf) {
        if (produced >= total) break
        counts[b % n]++ // absichtlich der fehlerhafte, biased Weg
        produced++
      }
    }
    const chi2 = chiSquared(counts, total)
    expect(chi2).toBeGreaterThan(400)
  })

  it('deckt den gesamten Wertebereich ab und bleibt in den Grenzen', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const v = randomBelow(7)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(7)
      seen.add(v)
    }
    expect(seen.size).toBe(7)
  })

  it('weist ungueltige Obergrenzen zurueck', () => {
    expect(() => randomBelow(0)).toThrow(RangeError)
    expect(() => randomBelow(-5)).toThrow(RangeError)
    expect(() => randomBelow(1.5)).toThrow(RangeError)
    expect(() => randomBelow(2 ** 32 + 1)).toThrow(RangeError)
    expect(randomBelow(1)).toBe(0)
  })
})

describe('shuffleInPlace – Fisher-Yates', () => {
  it('erzeugt alle Permutationen annaehernd gleich haeufig', () => {
    const runs = 6000
    const counts = new Map<string, number>()
    for (let i = 0; i < runs; i++) {
      const key = shuffleInPlace([0, 1, 2]).join('')
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    expect(counts.size).toBe(6)
    const chi2 = chiSquared([...counts.values()], runs)
    expect(chi2).toBeLessThan(30) // df=5, sehr grosszuegige Schwelle
  })

  it('erhaelt alle Elemente', () => {
    const arr = [...'abcdefghij']
    const shuffled = shuffleInPlace([...arr])
    expect([...shuffled].sort()).toEqual([...arr].sort())
  })
})

describe('pickChar / randomDigits', () => {
  it('pickChar liefert nur Zeichen aus dem Alphabet', () => {
    for (let i = 0; i < 500; i++) expect('xyz').toContain(pickChar('xyz'))
    expect(() => pickChar('')).toThrow(RangeError)
  })

  it('randomDigits liefert exakt n Dezimalziffern (fuehrende Nullen erlaubt)', () => {
    for (let i = 0; i < 200; i++) expect(randomDigits(6)).toMatch(/^\d{6}$/)
  })
})
