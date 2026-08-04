/**
 * Fluechtiger Sitzungszustand — wird NIE persistiert.
 * Hier lebt das aktuell erzeugte Passwort samt Staerke-Analyse.
 */

import { create } from 'zustand'
import type { GeneratorErrorCode } from '../generator/errors'
import type { GeneratorResult } from '../generator/types'
import type { ZxcvbnResult } from '../strength/zxcvbn'

export type HibpState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'found'; count: number }
  | { kind: 'notFound' }
  | { kind: 'error' }

export interface SessionState {
  result: GeneratorResult | null
  error: GeneratorErrorCode | null
  strength: ZxcvbnResult | null
  revealed: boolean
  /** Zaehler; Erhoehung stoesst eine Neu-Generierung an (Button/Shortcut) */
  regenTick: number
  hibp: HibpState

  setResult: (r: GeneratorResult) => void
  setError: (code: GeneratorErrorCode) => void
  setStrength: (s: ZxcvbnResult | null) => void
  setRevealed: (v: boolean) => void
  regenerate: () => void
  setHibp: (s: HibpState) => void
}

export const useSession = create<SessionState>()((set) => ({
  result: null,
  error: null,
  strength: null,
  revealed: true,
  regenTick: 0,
  hibp: { kind: 'idle' },

  setResult: (result) => set({ result, error: null }),
  setError: (error) => set({ error, result: null, strength: null }),
  setStrength: (strength) => set({ strength }),
  setRevealed: (revealed) => set({ revealed }),
  regenerate: () => set((s) => ({ regenTick: s.regenTick + 1 })),
  setHibp: (hibp) => set({ hibp }),
}))
