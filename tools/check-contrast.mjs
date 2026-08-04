/**
 * WCAG-2.1-Kontrastpruefung fuer alle 6 Theme-Varianten (3 Themes × Hell/Dunkel).
 *
 * Prueft:
 *  - Textfarben (text, muted, warn, error, ok, char-digit, char-special,
 *    accent-text) gegen ihre Hintergruende → Ziel ≥ 4.5:1 (AA Text)
 *  - on-accent gegen die Akzentfarbe an allen 5 Score-Stopps → ≥ 4.5:1
 *  - Akzent (Meter-Fuellung) gegen surface2 → ≥ 3:1 (AA Grafik), informativ
 *
 * Die Werte hier MUESSEN mit src/styles/themes.css und
 * src/strength/spectrum.ts uebereinstimmen. Aufruf: node tools/check-contrast.mjs
 */

// ── Farbmathematik ────────────────────────────────────────────────────────
function hexToLinear(hex) {
  const n = hex.replace('#', '')
  const v = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
  return v.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
}

function oklchToLinearSrgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return rgb.map((c) => Math.min(1, Math.max(0, c))) // ins Gamut clampen (wie Browser)
}

const luminance = (lin) => 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
const lumHex = (hex) => luminance(hexToLinear(hex))
const lumOklch = (L, C, H) => luminance(oklchToLinearSrgb(L, C, H))
const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

// ── Muss mit themes.css uebereinstimmen ──────────────────────────────────
const THEMES = {
  'classic-light': {
    bg: '#f7f3ec', surface: '#fffdf8', surface2: '#f3eee2',
    text: '#2b2a28', muted: '#6b6862',
    digit: '#2456d6', special: '#a92180',
    warn: '#8a5500', error: '#b3261e', ok: '#1c7c33',
    cScale: 1, accentTextL: 0.44, dark: false,
  },
  'classic-dark': {
    bg: '#1c1b1f', surface: '#26252b', surface2: '#2d2c33',
    text: '#f2efe9', muted: '#a9a49b',
    digit: '#60a5fa', special: '#f472b6',
    warn: '#f0c34e', error: '#ff8a80', ok: '#6fd388',
    cScale: 1, accentTextL: 0.78, dark: true,
  },
  'cyber-light': {
    bg: '#ece9f5', surface: '#ffffff', surface2: '#f3f0fb',
    text: '#1a1730', muted: '#55506e',
    digit: '#2145d4', special: '#a51e8c',
    warn: '#8a5500', error: '#b3261e', ok: '#1c7c33',
    cScale: 1.18, accentTextL: 0.42, dark: false,
  },
  'cyber-dark': {
    bg: '#0d0b14', surface: '#141020', surface2: '#1b1530',
    text: '#eafcff', muted: '#a49ecf',
    digit: '#7dd3fc', special: '#f77ad0',
    warn: '#f0c34e', error: '#ff8a80', ok: '#6fd388',
    cScale: 1.3, accentTextL: 0.8, dark: true,
  },
  'aurora-light': {
    bg: '#f2f6f4', surface: '#fbfffe', surface2: '#e9f1ed',
    text: '#24302c', muted: '#57675f',
    digit: '#2b649c', special: '#96437f',
    warn: '#8a5500', error: '#b3261e', ok: '#1c7c33',
    cScale: 0.55, accentTextL: 0.44, dark: false,
  },
  'aurora-dark': {
    bg: '#10161a', surface: '#172026', surface2: '#1d2933',
    text: '#eaf6f2', muted: '#9db0a8',
    digit: '#93c1eb', special: '#dfa3cd',
    warn: '#f0c34e', error: '#ff8a80', ok: '#6fd388',
    cScale: 0.55, accentTextL: 0.78, dark: true,
  },
}

// Muss mit SCORE_STOPS in src/strength/spectrum.ts uebereinstimmen
const SCORE_STOPS = [
  { hue: 25, l: 0.63, c: 0.24 },
  { hue: 60, l: 0.72, c: 0.2 },
  { hue: 110, l: 0.85, c: 0.19 },
  { hue: 190, l: 0.7, c: 0.17 },
  { hue: 285, l: 0.58, c: 0.22 },
]

let fails = 0
function check(label, r, min) {
  const status = r >= min ? 'ok  ' : 'FAIL'
  if (r < min) fails++
  const line = `  ${status} ${label}: ${r.toFixed(2)}:1 (Ziel ≥ ${min})`
  if (r < min) console.error(line)
  else if (process.argv.includes('--verbose')) console.log(line)
}

for (const [name, t] of Object.entries(THEMES)) {
  console.log(`\n■ ${name}`)
  const surfaces = { bg: lumHex(t.bg), surface: lumHex(t.surface), surface2: lumHex(t.surface2) }

  for (const [sName, sLum] of Object.entries(surfaces)) {
    check(`text auf ${sName}`, ratio(lumHex(t.text), sLum), 4.5)
  }
  for (const sName of ['surface', 'surface2']) {
    check(`muted auf ${sName}`, ratio(lumHex(t.muted), surfaces[sName]), 4.5)
  }
  // Zeichen-Typ-Faerbung liegt auf surface2 (Passwortfeld)
  check('char-digit auf surface2', ratio(lumHex(t.digit), surfaces.surface2), 4.5)
  check('char-special auf surface2', ratio(lumHex(t.special), surfaces.surface2), 4.5)
  for (const key of ['warn', 'error', 'ok']) {
    check(`${key}-text auf surface`, ratio(lumHex(t[key]), surfaces.surface), 4.5)
  }

  // Spiegel der Laufzeit-Logik aus applyAccent(): L-Boost, bis Anthrazit-Text passt
  const darkLum = lumHex('#1c1b1f')
  const minAccentLum = 4.5 * (darkLum + 0.05) - 0.05
  for (const [i, stop] of SCORE_STOPS.entries()) {
    const c = stop.c * t.cScale
    let l = stop.l
    while (lumOklch(l, c, stop.hue) < minAccentLum && l < 0.92) l += 0.01
    const accLum = lumOklch(l, c, stop.hue)
    check(`on-accent auf Akzent (Score ${i})`, ratio(darkLum, accLum), 4.5)
    // accent-text: L pro Schema fixiert, Chroma gedeckelt
    const atLum = lumOklch(t.accentTextL, Math.min(stop.c, 0.17) * t.cScale, stop.hue)
    check(`accent-text auf surface (Score ${i})`, ratio(atLum, surfaces.surface), 4.5)
    check(`accent-text auf bg (Score ${i})`, ratio(atLum, surfaces.bg), 4.5)
    // Meter-Fuellung: die 3:1-Abgrenzung liefert der Innenring in accent-text
    check(`Fuellungs-Ring auf surface2 (Score ${i})`, ratio(atLum, surfaces.surface2), 3)
  }
}

console.log(fails === 0 ? '\nAlle Kontraste AA-konform.' : `\n${fails} Verstoss/Verstoesse.`)
process.exit(fails === 0 ? 0 : 1)
