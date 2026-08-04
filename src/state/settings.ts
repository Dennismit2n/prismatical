/**
 * Persistierte Einstellungen + Generator-Optionen (zustand + persist).
 *
 * Datenschutz-Regeln dieses Stores:
 *  - Es werden NIE Passwoerter oder Ergebnisse gespeichert (die leben im
 *    Session-Store bzw. im separaten, opt-in Verlauf).
 *  - Die Eingaben des deterministischen Modus (Master, Domain, Login) werden
 *    bewusst NICHT persistiert.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  GeneratorMode,
  PassphraseOptions,
  PasswordOptions,
  PinOptions,
  PronounceableOptions,
  UsernameOptions,
} from '../generator/types'
import { DEFAULT_PASSWORD_OPTIONS } from '../generator/password'
import { DEFAULT_PASSPHRASE_OPTIONS } from '../generator/passphrase'
import { DEFAULT_PIN_OPTIONS } from '../generator/pin'
import { DEFAULT_PRONOUNCEABLE_OPTIONS } from '../generator/pronounceable'
import { DEFAULT_USERNAME_OPTIONS } from '../generator/username'

export type ThemeId = 'classic' | 'cyber' | 'aurora'
export type SchemeSetting = 'system' | 'light' | 'dark'

export interface SettingsState {
  language: string
  theme: ThemeId
  scheme: SchemeSetting
  /** Sekunden bis zum Leeren der Zwischenablage; 0 = nie */
  clipboardClearSec: number
  /** Verlauf aufzeichnen? (explizites Opt-in, Default AUS) */
  historyEnabled: boolean
  /** true = dauerhaft (localStorage); false = nur diese Sitzung (beim Schliessen weg) */
  historyPersist: boolean
  /** HIBP-Leak-Check (explizites Opt-in, Default AUS → keinerlei externe Requests) */
  hibpEnabled: boolean

  mode: GeneratorMode
  password: PasswordOptions
  passphrase: PassphraseOptions
  pin: PinOptions
  pronounceable: PronounceableOptions
  username: UsernameOptions
  /** Aktives Website-Regel-Preset (null = benutzerdefiniert) */
  presetId: string | null

  patch: (p: Partial<SettingsState>) => void
  patchPassword: (p: Partial<PasswordOptions>) => void
  patchPassphrase: (p: Partial<PassphraseOptions>) => void
  patchPin: (p: Partial<PinOptions>) => void
  patchPronounceable: (p: Partial<PronounceableOptions>) => void
  patchUsername: (p: Partial<UsernameOptions>) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'de',
      theme: 'classic',
      scheme: 'system',
      clipboardClearSec: 30,
      historyEnabled: false,
      historyPersist: false,
      hibpEnabled: false,

      mode: 'password',
      password: { ...DEFAULT_PASSWORD_OPTIONS },
      passphrase: { ...DEFAULT_PASSPHRASE_OPTIONS },
      pin: { ...DEFAULT_PIN_OPTIONS },
      pronounceable: { ...DEFAULT_PRONOUNCEABLE_OPTIONS },
      username: { ...DEFAULT_USERNAME_OPTIONS },
      presetId: 'standard',

      patch: (p) => set(p),
      // Jede Handaenderung an den Passwort-Optionen verlaesst das Preset.
      patchPassword: (p) => set((s) => ({ password: { ...s.password, ...p }, presetId: null })),
      patchPassphrase: (p) => set((s) => ({ passphrase: { ...s.passphrase, ...p } })),
      patchPin: (p) => set((s) => ({ pin: { ...s.pin, ...p } })),
      patchPronounceable: (p) =>
        set((s) => ({ pronounceable: { ...s.pronounceable, ...p } })),
      patchUsername: (p) => set((s) => ({ username: { ...s.username, ...p } })),
    }),
    {
      name: 'prisma.settings',
      version: 1,
      partialize: (s) => ({
        language: s.language,
        theme: s.theme,
        scheme: s.scheme,
        clipboardClearSec: s.clipboardClearSec,
        historyEnabled: s.historyEnabled,
        historyPersist: s.historyPersist,
        hibpEnabled: s.hibpEnabled,
        mode: s.mode,
        password: s.password,
        passphrase: s.passphrase,
        pin: s.pin,
        pronounceable: s.pronounceable,
        username: s.username,
        presetId: s.presetId,
      }),
    },
  ),
)
