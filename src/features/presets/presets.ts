/**
 * Website-Regel-Presets: vorkonfigurierte Regelsaetze, die Laenge,
 * Zeichenklassen und Minima passend setzen. Erweiterbar — einfach einen
 * Eintrag ergaenzen (Label kommt aus i18n: presets.<id>).
 */

import type { PasswordOptions } from '../../generator/types'

export interface RulePreset {
  id: string
  patch: Partial<PasswordOptions>
}

export const PRESETS: RulePreset[] = [
  {
    // Empfehlung: lang und ohne Sperren (NIST SP 800-63B: Laenge schlaegt Komplexitaetszwang)
    id: 'standard',
    patch: {
      length: 20,
      upper: true,
      lower: true,
      digits: true,
      special: true,
      specialChars: '!@#$%^&*',
      excludeAmbiguous: false,
      noRepeats: false,
      requireEachClass: true,
      minDigits: 1,
      minSpecial: 1,
      excludeChars: '',
    },
  },
  {
    id: 'nistLong',
    patch: {
      length: 32,
      upper: true,
      lower: true,
      digits: true,
      special: true,
      specialChars: '!@#$%^&*',
      excludeAmbiguous: false,
      noRepeats: false,
      requireEachClass: false,
      minDigits: 0,
      minSpecial: 0,
      excludeChars: '',
    },
  },
  {
    id: 'lettersDigits',
    patch: {
      length: 16,
      upper: true,
      lower: true,
      digits: true,
      special: false,
      excludeAmbiguous: false,
      noRepeats: false,
      requireEachClass: true,
      minDigits: 1,
      minSpecial: 0,
      excludeChars: '',
    },
  },
  {
    // Viele Altsysteme: hoechstens 16 Zeichen, eingeschraenkter Sonderzeichensatz
    id: 'max16',
    patch: {
      length: 16,
      upper: true,
      lower: true,
      digits: true,
      special: true,
      specialChars: '!$%&*',
      excludeAmbiguous: true,
      noRepeats: false,
      requireEachClass: true,
      minDigits: 1,
      minSpecial: 1,
      excludeChars: '',
    },
  },
  {
    // Bank-typisch: kurz, nur Buchstaben+Ziffern, mehrere Ziffern Pflicht
    id: 'bank',
    patch: {
      length: 10,
      upper: true,
      lower: true,
      digits: true,
      special: false,
      excludeAmbiguous: true,
      noRepeats: false,
      requireEachClass: true,
      minDigits: 2,
      minSpecial: 0,
      excludeChars: '',
    },
  },
]

export function findPreset(id: string | null): RulePreset | undefined {
  return PRESETS.find((p) => p.id === id)
}
