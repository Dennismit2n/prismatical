/**
 * Koppelt Theme, Hell/Dunkel und Sprache an <html> bzw. i18next.
 * "System" folgt prefers-color-scheme live (Media-Query-Listener).
 *
 * Sehhilfen der Werkstatt (31.10.2026): Die Darstellung gilt in allen Werkzeugen
 * auf diesem Ursprung und liegt als roher Text unter werkstatt.darstellung. Sie
 * geht beim Start vor der eigenen Einstellung, und jede Wahl hier landet dort.
 * data-scheme traegt hell/dunkel, data-vision Hoher Kontrast (contrast),
 * Farbenblind (cvd) und Umkehr (invert). "System" folgt auch "Kontrast erhoehen".
 */

import { useEffect } from 'react'
import { changeLanguage } from '../i18n'
import { useSettings, type SchemeSetting } from '../state/settings'
import { reapplyAccent } from '../strength/spectrum'

const SHARED_KEY = 'werkstatt.darstellung'
const SCHEMES: readonly SchemeSetting[] = [
  'system',
  'light',
  'dark',
  'hc-dark',
  'hc-light',
  'cvd-dark',
  'cvd-light',
  'invert',
]

/** Werte anderer Werkzeuge (Spectroton "soft-dark") zaehlen als ihre Familie. */
export function toScheme(value: string | null): SchemeSetting | null {
  if (value === null || value === '') return null
  if ((SCHEMES as readonly string[]).includes(value)) return value as SchemeSetting
  if (value.includes('dark')) return 'dark'
  if (value.includes('light')) return 'light'
  return 'system'
}

function readShared(): SchemeSetting | null {
  try {
    return toScheme(localStorage.getItem(SHARED_KEY))
  } catch {
    return null
  }
}

/** Wahl -> data-scheme und data-vision; "dark"/"light" gelten fuer das Geraet. */
export function resolveScheme(
  scheme: SchemeSetting,
  dark: boolean,
  more: boolean,
): { scheme: 'light' | 'dark'; vision: 'contrast' | 'cvd' | 'invert' | null } {
  const device = dark ? 'dark' : 'light'
  switch (scheme) {
    case 'light':
    case 'dark':
      return { scheme, vision: null }
    case 'hc-dark':
      return { scheme: 'dark', vision: 'contrast' }
    case 'hc-light':
      return { scheme: 'light', vision: 'contrast' }
    case 'cvd-dark':
      return { scheme: 'dark', vision: 'cvd' }
    case 'cvd-light':
      return { scheme: 'light', vision: 'cvd' }
    case 'invert':
      return { scheme: device, vision: 'invert' }
    default:
      return { scheme: device, vision: more ? 'contrast' : null }
  }
}

export function useAppearance(): void {
  const theme = useSettings((s) => s.theme)
  const scheme = useSettings((s) => s.scheme)
  const language = useSettings((s) => s.language)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Beim Start und bei einer Wahl in einem anderen Werkzeug (anderer Tab) gilt die
  // gemeinsame Darstellung
  useEffect(() => {
    const shared = readShared()
    if (shared && shared !== useSettings.getState().scheme) useSettings.getState().patch({ scheme: shared })
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SHARED_KEY) return
      const next = toScheme(e.newValue)
      if (next && next !== useSettings.getState().scheme) useSettings.getState().patch({ scheme: next })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const dark = window.matchMedia('(prefers-color-scheme: dark)')
    const more = window.matchMedia('(prefers-contrast: more)')
    const apply = () => {
      const r = resolveScheme(scheme, dark.matches, more.matches)
      root.dataset.scheme = r.scheme
      if (r.vision) root.dataset.vision = r.vision
      else delete root.dataset.vision
      // Farbenblind und Hoher Kontrast aendern die Staerkefarbe: neu anwenden
      reapplyAccent()
    }
    apply()
    // Eine echte Wahl geht in den gemeinsamen Schluessel (roh, wie die anderen Werkzeuge)
    try {
      if (readShared() !== scheme) localStorage.setItem(SHARED_KEY, scheme)
    } catch {
      /* gesperrter Speicher: die Wahl gilt nur in dieser Sitzung */
    }
    if (scheme === 'system' || scheme === 'invert') {
      dark.addEventListener('change', apply)
      more.addEventListener('change', apply)
      return () => {
        dark.removeEventListener('change', apply)
        more.removeEventListener('change', apply)
      }
    }
  }, [scheme])

  useEffect(() => {
    void changeLanguage(language)
  }, [language])
}
