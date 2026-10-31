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
/** Im Hohen Kontrast der Werkstatt (data-vision="contrast") 7:1. */
const MIN_ACCENT_LUM_HC = 7 * (ON_ACCENT_DARK_LUM + 0.05) - 0.05
/**
 * Umgekehrte Farben der Werkstatt (data-vision="invert"): Die Seite wird per
 * filter: invert(1) gedreht, und WCAG-Kontrast bleibt dabei nicht erhalten. Umgedreht
 * wird der Anthrazit-Text hell (#e3e4e0, Luminanz 0.772); der umgedrehte Akzent muss
 * dann dunkel genug fuer 4.5:1 sein.
 */
const INV_ON_ACCENT_LUM = 0.772
const MAX_INV_ACCENT_LUM = (INV_ON_ACCENT_LUM + 0.05) / 4.5 - 0.05

/** Luminanz der per invert(1) umgedrehten oklch-Farbe (Kanaele im sRGB-Raum gespiegelt). */
function invertedLuminance(L: number, C: number, Hdeg: number): number {
  const h = (Hdeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (v: number) => Math.min(1, Math.max(0, v))
  const enc = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)
  const dec = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const inv = (v: number) => dec(1 - enc(clamp(v)))
  const r = inv(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = inv(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const bl = inv(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

/**
 * Farbenblind-Modus der Werkstatt (data-vision="cvd", 31.10.2026): Das Spektrum laeuft
 * dann ohne die Rot-Gruen-Strecke, von Zinnober ueber Orange und Gelb zu Himmelblau und
 * Blau (Okabe-Ito). Stueckweise lineare Abbildung der fuenf Stopp-Farbtoene; die Staerke
 * steht ohnehin immer als Text daneben.
 */
const CVD_HUES: readonly [number, number][] = [
  [25, 40],
  [60, 70],
  [110, 95],
  [190, 230],
  [285, 260],
  [300, 265],
]
export function cvdHue(h: number): number {
  if (h <= CVD_HUES[0][0]) return CVD_HUES[0][1]
  for (let i = 1; i < CVD_HUES.length; i++) {
    const [h0, c0] = CVD_HUES[i - 1]
    const [h1, c1] = CVD_HUES[i]
    if (h <= h1) return c0 + ((h - h0) / (h1 - h0)) * (c1 - c0)
  }
  return CVD_HUES[CVD_HUES.length - 1][1]
}

let last: { accent: AccentColor; score: number | null } | null = null

/** Nach einem Wechsel der Sehhilfe die zuletzt gesetzte Staerkefarbe neu anwenden. */
export function reapplyAccent(): void {
  if (last) applyAccent(last.accent, last.score)
}

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
  last = { accent, score }
  const root = document.documentElement
  const scaleRaw = getComputedStyle(root).getPropertyValue('--accent-c-scale')
  const scale = Number.parseFloat(scaleRaw) || 1
  const effectiveC = accent.c * scale
  const h = root.dataset.vision === 'cvd' ? cvdHue(accent.h) : accent.h
  const minLum = root.dataset.vision === 'contrast' ? MIN_ACCENT_LUM_HC : MIN_ACCENT_LUM

  let l = accent.l
  while (oklchLuminance(l, effectiveC, h) < minLum && l < 0.95) {
    l += 0.01
  }
  // bei Umkehr zusaetzlich: umgedreht dunkel genug unter dem hellen umgedrehten Text
  if (root.dataset.vision === 'invert') {
    while (invertedLuminance(l, effectiveC, h) > MAX_INV_ACCENT_LUM && l < 0.97) {
      l += 0.01
    }
  }

  root.style.setProperty('--accent-h', h.toFixed(1))
  root.style.setProperty('--accent-l', l.toFixed(3))
  root.style.setProperty('--accent-c', accent.c.toFixed(3))
  if (score === null) delete root.dataset.score
  else root.dataset.score = String(Math.max(0, Math.min(4, score)))
}
