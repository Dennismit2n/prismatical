/**
 * Koppelt Theme, Hell/Dunkel und Sprache an <html> bzw. i18next.
 * "System" folgt prefers-color-scheme live (Media-Query-Listener).
 */

import { useEffect } from 'react'
import { changeLanguage } from '../i18n'
import { useSettings } from '../state/settings'

export function useAppearance(): void {
  const theme = useSettings((s) => s.theme)
  const scheme = useSettings((s) => s.scheme)
  const language = useSettings((s) => s.language)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      root.dataset.scheme = scheme === 'system' ? (media.matches ? 'dark' : 'light') : scheme
    }
    apply()
    if (scheme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [scheme])

  useEffect(() => {
    void changeLanguage(language)
  }, [language])
}
