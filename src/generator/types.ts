/** Gemeinsame Typen aller Generator-Modi. */

export type GeneratorMode =
  | 'password'
  | 'passphrase'
  | 'pin'
  | 'pronounceable'
  | 'username'
  | 'deterministic'

export interface PasswordOptions {
  /** 4–128, Default 20 */
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  special: boolean
  /** Mehrdeutige Zeichen (l 1 I | 0 O) ausschliessen */
  excludeAmbiguous: boolean
  /** Kein Zeichen darf doppelt vorkommen */
  noRepeats: boolean
  /** Jede gewaehlte Klasse mindestens einmal */
  requireEachClass: boolean
  /** 0–9 */
  minDigits: number
  /** 0–9 */
  minSpecial: number
  /** Anpassbarer Sonderzeichensatz */
  specialChars: string
  /** Zusaetzlich auszuschliessende Zeichen */
  excludeChars: string
}

export type SeparatorKind = 'dash' | 'dot' | 'space' | 'digit' | 'custom'

export interface PassphraseOptions {
  /** 3–12, Default 6 */
  wordCount: number
  separator: SeparatorKind
  customSeparator: string
  capitalizeWords: boolean
  /** Eine Zufallsziffer an ein zufaelliges Wort anhaengen */
  includeDigit: boolean
  /** Ein Sonderzeichen an ein zufaelliges Wort anhaengen */
  includeSpecial: boolean
  /** Wortlisten-Kennung, z. B. 'eff-en' oder 'de' */
  listId: string
}

export interface PinOptions {
  /** 3–12 Stellen */
  digits: number
}

export interface PronounceableOptions {
  /** Zeichenlaenge 6–32 */
  length: number
  capitalize: boolean
  appendDigits: boolean
}

export interface UsernameOptions {
  style: 'lower' | 'camel'
  leetify: boolean
  appendDigits: boolean
}

export interface GeneratorResult {
  value: string
  /**
   * Rohe kombinatorische Entropie in Bits (Basis der Anzeige; zxcvbn liefert
   * zusaetzlich eine realistischere Schaetzung ueber guessesLog10).
   */
  entropyBits: number
  /** Groesse des effektiven Alphabets bzw. der Wortliste */
  poolSize: number
  /** i18n-Schluessel fuer Hinweise (z. B. geringere Entropie im Aussprechbar-Modus) */
  warnings: string[]
  /**
   * True, wenn Zusatzregeln (Minima, keine Wiederholungen, Klassenzwang) aktiv
   * waren — die rohe Entropieformel ist dann eine leichte Obergrenze.
   */
  constrained: boolean
}
