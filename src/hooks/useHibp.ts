/**
 * HIBP-Leak-Check-Hook.
 *
 * Laeuft AUSSCHLIESSLICH bei aktiviertem Opt-in (Default AUS). Debounce von
 * 700 ms, damit beim schnellen Durchschalten von Optionen nicht pro
 * Zwischenschritt ein Request entsteht; laufende Requests werden abgebrochen.
 */

import { useEffect } from 'react'
import { checkHibp } from '../features/hibp/hibp'
import { useSession } from '../state/session'
import { useSettings } from '../state/settings'

export function useHibp(): void {
  const enabled = useSettings((s) => s.hibpEnabled)
  const mode = useSettings((s) => s.mode)
  const value = useSession((s) => s.result?.value ?? '')
  const setHibp = useSession((s) => s.setHibp)

  useEffect(() => {
    // Usernames sind keine Passwoerter — kein Check.
    if (!enabled || !value || mode === 'username') {
      setHibp({ kind: 'idle' })
      return
    }
    setHibp({ kind: 'checking' })
    const controller = new AbortController()
    const timer = setTimeout(() => {
      checkHibp(value, controller.signal)
        .then((count) =>
          setHibp(count > 0 ? { kind: 'found', count } : { kind: 'notFound' }),
        )
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === 'AbortError') return
          setHibp({ kind: 'error' })
        })
    }, 700)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [enabled, value, mode, setHibp])
}
