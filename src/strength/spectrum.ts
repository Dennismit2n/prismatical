/**
 * Stärke-Spektrum: bildet die zxcvbn-Staerke auf eine Regenbogen-Position ab
 * (Rot → Orange → Gelb/Gruen → Gruen/Blau → Blau/Violett).
 *
 * Die Akzentfarbe der GESAMTEN UI haengt an diesem Modul: es setzt die
 * CSS-Custom-Properties --accent-h/-l/-c auf <html> (per CSSOM, kein
 * Inline-Style-Attribut — vertraegt sich mit der strikten CSP).
 *
 * Barrierefreiheit: Farbe ist NIE der einzige Kanal — Score-Label, Bits und
 * Knackzeiten stehen immer als Text daneben (WCAG 1.4.1).
 */

/**
 * Referenz-Stopps aus dem Farbkonzept (oklch: Lightness, Chroma, Hue + HEX-Fallback):
 * Score 0 Rot, 1 Orange, 2 Gelb/Gruen, 3 Gruen/Blau, 4 Blau/Violett.
 */
export const SCORE_STOPS = [
  { hue: 25, l: 0.63, c: 0.24, hex: '#e5484d' },
  { hue: 60, l: 0.72, c: 0.2, hex: '#f76b15' },
  { hue: 110, l: 0.85, c: 0.19, hex: '#6fbf3b' },
  { hue: 190, l: 0.7, c: 0.17, hex: '#22a2a2' },
  { hue: 285, l: 0.58, c: 0.22, hex: '#7a5cff' },
] as const

/** zxcvbn-Score-Grenzen in guessesLog10 (10^3, 10^6, 10^8, 10^10). */
const SCORE_BOUNDS = [0, 3, 6, 8, 10, 14]

export interface AccentColor {
  h: number
  l: number
  c: number
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Kontinuierliche Spektrum-Position: interpoliert zwischen den Score-Stopps
 * entlang des Fortschritts von guessesLog10 innerhalb des aktuellen
 * Score-Bandes. Ergebnis-Hue ist bei ~300 (Violett) gedeckelt.
 */
export function accentForScore(score: number, guessesLog10: number): AccentColor {
  const s = Math.max(0, Math.min(4, Math.floor(score)))
  const from = SCORE_STOPS[s]
  const to = SCORE_STOPS[Math.min(4, s + 1)]
  const lower = SCORE_BOUNDS[s]
  const upper = SCORE_BOUNDS[s + 1]
  const t = Math.max(0, Math.min(1, (guessesLog10 - lower) / (upper - lower)))
  const h = Math.min(s === 4 ? lerp(from.hue, 300, t) : lerp(from.hue, to.hue, t), 300)
  return { h, l: lerp(from.l, to.l, s === 4 ? 0 : t), c: lerp(from.c, to.c, s === 4 ? 0 : t) }
}

/**
 * Fallback ohne zxcvbn (z. B. waehrend die Woerterbuecher noch laden):
 * Akzent-Hue = 25 + normalisierteEntropie × 260, gedeckelt bei 300.
 */
export function accentForBits(bits: number): AccentColor {
  const norm = Math.min(bits / 128, 1)
  const h = Math.min(25 + norm * 260, 300)
  // L/C entlang der Stopp-Kurve interpolieren, damit z. B. Gelb heller ist.
  let idx = 0
  while (idx < SCORE_STOPS.length - 1 && SCORE_STOPS[idx + 1].hue < h) idx++
  const from = SCORE_STOPS[idx]
  const to = SCORE_STOPS[Math.min(SCORE_STOPS.length - 1, idx + 1)]
  const span = to.hue - from.hue || 1
  const t = Math.max(0, Math.min(1, (h - from.hue) / span))
  return { h, l: lerp(from.l, to.l, t), c: lerp(from.c, to.c, t) }
}

/** Relative sRGB-Luminanz einer oklch-Farbe (fuer Kontrast-Garantien). */
function oklchLuminance(L: number, C: number, Hdeg: number): number {
  const h = (Hdeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

/** Luminanz von #1c1b1f (Anthrazit-Text auf Akzentflaechen). */
const ON_ACCENT_DARK_LUM = 0.0117
/** Ziel-Luminanz, ab der Anthrazit-Text auf dem Akzent 4.5:1 erreicht. */
const MIN_ACCENT_LUM = 4.5 * (ON_ACCENT_DARK_LUM + 0.05) - 0.05

/**
 * Schreibt die Akzentfarbe als Design-Tokens auf <html>.
 *  - --accent-h/-l/-c: kontinuierliche oklch-Komponenten
 *  - WCAG-Garantie: Die Helligkeit wird (unter Beruecksichtigung des
 *    Theme-Chromas) so weit angehoben, dass Anthrazit-Text (--on-accent)
 *    auf der Akzentflaeche IMMER >= 4.5:1 erreicht — fuer jeden Farbton
 *    des Spektrums und in allen drei Themes.
 *  - data-score: HEX-Fallback-Anker fuer Browser ohne oklch()
 */
export function applyAccent(accent: AccentColor, score: number | null): void {
  const root = document.documentElement
  const scaleRaw = getComputedStyle(root).getPropertyValue('--accent-c-scale')
  const scale = Number.parseFloat(scaleRaw) || 1
  const effectiveC = accent.c * scale

  let l = accent.l
  while (oklchLuminance(l, effectiveC, accent.h) < MIN_ACCENT_LUM && l < 0.92) {
    l += 0.01
  }

  root.style.setProperty('--accent-h', accent.h.toFixed(1))
  root.style.setProperty('--accent-l', l.toFixed(3))
  root.style.setProperty('--accent-c', accent.c.toFixed(3))
  if (score === null) delete root.dataset.score
  else root.dataset.score = String(Math.max(0, Math.min(4, score)))
}
