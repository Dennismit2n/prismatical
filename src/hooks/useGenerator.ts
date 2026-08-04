/**
 * Zentrale Generierungs-Logik: erzeugt bei jeder Options-/Modusaenderung und
 * bei jedem Regenerate-Tick sofort ein neues Ergebnis (Live-Feedback).
 * Der deterministische Modus ist ausgenommen — er laeuft nur auf Knopfdruck
 * (er braucht das Master-Passwort und ist per PBKDF2 bewusst langsam).
 */

import { useEffect } from 'react'
import { GeneratorError } from '../generator/errors'
import { generatePassword } from '../generator/password'
import { generatePassphrase } from '../generator/passphrase'
import { generatePin } from '../generator/pin'
import { generatePronounceable } from '../generator/pronounceable'
import { generateUsername } from '../generator/username'
import type { GeneratorResult } from '../generator/types'
import { loadWordlist, resolveListId } from '../features/wordlists/wordlists'
import { useHistory } from '../state/history'
import { useSession } from '../state/session'
import { useSettings } from '../state/settings'

export function useGenerator(): void {
  const mode = useSettings((s) => s.mode)
  const password = useSettings((s) => s.password)
  const passphrase = useSettings((s) => s.passphrase)
  const pin = useSettings((s) => s.pin)
  const pronounceable = useSettings((s) => s.pronounceable)
  const username = useSettings((s) => s.username)
  const language = useSettings((s) => s.language)
  const historyEnabled = useSettings((s) => s.historyEnabled)
  const regenTick = useSession((s) => s.regenTick)
  const setResult = useSession((s) => s.setResult)
  const setError = useSession((s) => s.setError)

  useEffect(() => {
    if (mode === 'deterministic') return

    let cancelled = false
    const commit = (result: GeneratorResult) => {
      if (cancelled) return
      setResult(result)
      // Verlauf NUR bei aktiviertem Opt-in (Default aus).
      if (historyEnabled && result.value) {
        useHistory.getState().add({ value: result.value, mode, at: Date.now() })
      }
    }
    const fail = (e: unknown) => {
      if (cancelled) return
      if (e instanceof GeneratorError) setError(e.code)
      else throw e
    }

    try {
      switch (mode) {
        case 'password':
          commit(generatePassword(password))
          break
        case 'pin':
          commit(generatePin(pin))
          break
        case 'pronounceable':
          commit(generatePronounceable(pronounceable))
          break
        case 'username':
          commit(generateUsername(username))
          break
        case 'passphrase': {
          const listId = resolveListId(passphrase.listId, language)
          loadWordlist(listId)
            .then((words) => {
              try {
                commit(generatePassphrase(passphrase, words))
              } catch (e) {
                fail(e)
              }
            })
            .catch(() => {
              if (!cancelled) setError('wordlistUnavailable')
            })
          break
        }
      }
    } catch (e) {
      fail(e)
    }

    return () => {
      cancelled = true
    }
  }, [
    mode,
    password,
    passphrase,
    pin,
    pronounceable,
    username,
    language,
    historyEnabled,
    regenTick,
    setResult,
    setError,
  ])
}
