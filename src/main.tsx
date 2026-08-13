import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import { initI18n } from './i18n'
import { LANGUAGE_CODES } from './i18n/languages'
import { useSettings } from './state/settings'
import App from './App.tsx'
import './styles/tokens.css'
import './styles/themes.css'
import './styles/base.css'

/**
 * Startsprache: gespeicherte Einstellung → Browsersprache (falls unterstuetzt)
 * → Deutsch (App-Standardsprache).
 */
function initialLanguage(): string {
  try {
    const raw = localStorage.getItem('prismatical.settings')
    if (raw) {
      const lang: unknown = JSON.parse(raw)?.state?.language
      if (typeof lang === 'string' && LANGUAGE_CODES.includes(lang)) return lang
    }
  } catch {
    /* Defaults gelten */
  }
  const nav = navigator.language?.slice(0, 2).toLowerCase()
  if (nav && LANGUAGE_CODES.includes(nav)) return nav
  return 'de'
}

async function bootstrap(): Promise<void> {
  const lang = initialLanguage()
  if (useSettings.getState().language !== lang) {
    useSettings.setState({ language: lang })
  }
  await initI18n(lang)
  document.documentElement.lang = lang

  // Service-Worker-Registrierung ueber das virtuelle Modul (kein Inline-Skript,
  // vertraegt sich mit der strikten CSP). autoUpdate laedt neue Versionen selbst.
  registerSW({ immediate: true })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Suspense fallback={null}>
        <App />
      </Suspense>
    </StrictMode>,
  )
}

void bootstrap()
