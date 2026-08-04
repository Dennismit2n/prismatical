/**
 * Staerke-Analyse: zxcvbn-Check des aktuellen Ergebnisses + Live-Update des
 * Staerke-Spektrums (Akzentfarbe der gesamten UI).
 */

import { useEffect } from 'react'
import { accentForBits, accentForScore, applyAccent } from '../strength/spectrum'
import { checkStrength, ensureChecker } from '../strength/zxcvbn'
import { useSession } from '../state/session'
import { useSettings } from '../state/settings'

export function useStrengthAnalysis(): void {
  const language = useSettings((s) => s.language)
  const value = useSession((s) => s.result?.value ?? '')
  const bits = useSession((s) => s.result?.entropyBits ?? 0)
  const setStrength = useSession((s) => s.setStrength)

  useEffect(() => {
    if (!value) {
      setStrength(null)
      return
    }
    // Sofortiges Feedback aus der Roh-Entropie, bis die Woerterbuecher da sind.
    applyAccent(accentForBits(bits), null)

    let cancelled = false
    ensureChecker(language).then(() => {
      if (cancelled) return
      const result = checkStrength(value)
      setStrength(result)
      if (result) {
        applyAccent(accentForScore(result.score, result.guessesLog10), result.score)
      }
    })
    return () => {
      cancelled = true
    }
  }, [value, bits, language, setStrength])
}
