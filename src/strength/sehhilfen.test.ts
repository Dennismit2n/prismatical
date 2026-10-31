/**
 * Sehhilfen der Werkstatt (31.10.2026): Farbenblind-Spektrum und Aufloesung der
 * acht Darstellungen. Die Staerke steht immer als Text daneben; das Spektrum
 * soll im Farbenblind-Modus trotzdem ohne Rot-Gruen-Strecke auskommen.
 */
import { describe, expect, it } from 'vitest'
import { cvdHue, SCORE_STOPS } from './spectrum'
import { resolveScheme, toScheme } from '../hooks/useAppearance'

describe('cvdHue', () => {
  it('bildet die fuenf Stopps auf Zinnober, Orange, Gelb, Himmelblau und Blau ab', () => {
    expect(SCORE_STOPS.map((s) => cvdHue(s.hue))).toEqual([40, 70, 95, 230, 260])
  })

  it('laeuft nie durch Gruen (Farbton 100 bis 200 nur zwischen Gelb und Himmelblau)', () => {
    for (let h = 0; h <= 320; h += 1) {
      const c = cvdHue(h)
      expect(c).toBeGreaterThanOrEqual(40)
      expect(c).toBeLessThanOrEqual(265)
      if (h <= 110) expect(c).toBeLessThanOrEqual(95)
    }
  })

  it('ist monoton steigend wie das Original', () => {
    let prev = -1
    for (let h = 0; h <= 320; h += 5) {
      const c = cvdHue(h)
      expect(c).toBeGreaterThanOrEqual(prev)
      prev = c
    }
  })
})

describe('Darstellung', () => {
  it('loest die acht Werte in data-scheme und data-vision auf', () => {
    expect(resolveScheme('light', true, true)).toEqual({ scheme: 'light', vision: null })
    expect(resolveScheme('hc-dark', false, false)).toEqual({ scheme: 'dark', vision: 'contrast' })
    expect(resolveScheme('hc-light', true, false)).toEqual({ scheme: 'light', vision: 'contrast' })
    expect(resolveScheme('cvd-dark', false, false)).toEqual({ scheme: 'dark', vision: 'cvd' })
    expect(resolveScheme('cvd-light', true, false)).toEqual({ scheme: 'light', vision: 'cvd' })
    expect(resolveScheme('invert', true, false)).toEqual({ scheme: 'dark', vision: 'invert' })
    expect(resolveScheme('system', false, true)).toEqual({ scheme: 'light', vision: 'contrast' })
    expect(resolveScheme('system', true, false)).toEqual({ scheme: 'dark', vision: null })
  })

  it('liest Werte anderer Werkzeuge als ihre Familie', () => {
    expect(toScheme('hc-light')).toBe('hc-light')
    expect(toScheme('soft-dark')).toBe('dark')
    expect(toScheme('pink')).toBe('system')
    expect(toScheme(null)).toBeNull()
    expect(toScheme('')).toBeNull()
  })
})
