/**
 * Kopieren mit Auto-Clear.
 *
 * Nach dem Kopieren laeuft ein sichtbarer Countdown (Einstellung: 10/20/30/60 s
 * oder nie); danach wird die Zwischenablage mit einem Leer-String
 * ueberschrieben. Grenzen des Verfahrens (in der UI dokumentiert):
 *  - Systemweite Clipboard-Historien (z. B. Windows Win+V) koennen von einer
 *    Web-App nicht geleert werden.
 *  - Das Ueberschreiben kann fehlschlagen, wenn das Fenster beim Ablauf nicht
 *    fokussiert ist — das zeigen wir dann ehrlich an.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Modulweite Kopier-Generation: Es gibt mehrere Hook-Instanzen (Passwort-
 * Karte, Verlauf, Bulk). Nur die Instanz, die zuletzt kopiert hat, darf die
 * Zwischenablage leeren — sonst wuerde ein aelterer Countdown eine neuere
 * Kopie (oder fremden Inhalt) vorzeitig vernichten.
 */
let globalCopyGeneration = 0

export interface ClipboardApi {
  copy: (text: string) => Promise<boolean>
  /** Restsekunden bis zum Leeren, null = kein Countdown aktiv */
  countdown: number | null
  /** Kurzes "Kopiert!"-Feedback */
  justCopied: boolean
  /** true, wenn das automatische Leeren fehlgeschlagen ist */
  clearFailed: boolean
}

export function useClipboard(clearAfterSec: number): ClipboardApi {
  const [deadline, setDeadline] = useState<number | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [justCopied, setJustCopied] = useState(false)
  const [clearFailed, setClearFailed] = useState(false)
  const copyToken = useRef(0)
  const myGeneration = useRef(0)

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        return false
      }
      const token = ++copyToken.current
      myGeneration.current = ++globalCopyGeneration
      setClearFailed(false)
      setJustCopied(true)
      setTimeout(() => {
        if (token === copyToken.current) setJustCopied(false)
      }, 1500)
      // Countdown-Startwert wird HIER gesetzt (nicht im Effekt), das Interval
      // uebernimmt danach nur noch die Ticks.
      if (clearAfterSec > 0) {
        setCountdown(clearAfterSec)
        setDeadline(Date.now() + clearAfterSec * 1000)
      } else {
        setCountdown(null)
        setDeadline(null)
      }
      return true
    },
    [clearAfterSec],
  )

  useEffect(() => {
    if (deadline === null) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((deadline - Date.now()) / 1000)
      if (remaining > 0) {
        setCountdown(remaining)
        return
      }
      setDeadline(null)
      setCountdown(null)
      // Nur leeren, wenn seitdem niemand anderes (andere Instanz) kopiert hat.
      if (myGeneration.current !== globalCopyGeneration) return
      // Countdown abgelaufen: Zwischenablage ueberschreiben. Schlaegt das fehl
      // (Fenster nicht fokussiert), holen wir es beim naechsten Fokus nach.
      navigator.clipboard.writeText('').catch(() => {
        setClearFailed(true)
        const retry = () => {
          window.removeEventListener('focus', retry)
          if (myGeneration.current !== globalCopyGeneration) return
          navigator.clipboard
            .writeText('')
            .then(() => setClearFailed(false))
            .catch(() => {
              /* endgueltig fehlgeschlagen — Hinweis bleibt sichtbar */
            })
        }
        window.addEventListener('focus', retry)
      })
    }, 250)
    return () => clearInterval(interval)
  }, [deadline])

  return { copy, countdown, justCopied, clearFailed }
}
