import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../i18n/languages'
import { useSettings } from '../state/settings'
import type { SchemeSetting, ThemeId } from '../state/settings'
import type { DialogId } from '../App'
import { Icon } from './Icon'
import styles from './TopBar.module.css'

type InstallFenster = Window & {
  /** beforeinstallprompt-Ereignis, aufgehoben von public/boot.js. */
  deferredInstall?: (Event & { prompt(): Promise<unknown> }) | null
  onInstallReady?: () => void
}
const fenster = window as InstallFenster

/** Der Browser bietet die Installation an, und die Seite laeuft nicht schon als App. */
function kannInstallieren(): boolean {
  const alsApp =
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return !!fenster.deferredInstall && !alsApp
}

/** Oeffnet den Installationsdialog des Browsers. Ein Ereignis reicht fuer einen Dialog. */
function installieren(): void {
  const evt = fenster.deferredInstall
  fenster.deferredInstall = null
  if (!evt) return
  try {
    void evt.prompt().catch(() => {})
  } catch {
    /* kein Dialog verfuegbar */
  }
}

/** Knopf „Installieren“: sichtbar, sobald das Ereignis da ist, nie in der installierten App. */
function useInstallierbar(): [boolean, () => void] {
  const [installierbar, setInstallierbar] = useState(kannInstallieren)
  useEffect(() => {
    const pruefen = () => setInstallierbar(kannInstallieren())
    const installiert = () => {
      fenster.deferredInstall = null
      pruefen()
    }
    fenster.onInstallReady = pruefen
    window.addEventListener('appinstalled', installiert)
    pruefen()
    return () => {
      fenster.onInstallReady = undefined
      window.removeEventListener('appinstalled', installiert)
    }
  }, [])
  return [installierbar, () => setInstallierbar(kannInstallieren())]
}

export function TopBar({ onOpenDialog }: { onOpenDialog: (d: DialogId) => void }) {
  const { t } = useTranslation()
  const language = useSettings((s) => s.language)
  const theme = useSettings((s) => s.theme)
  const scheme = useSettings((s) => s.scheme)
  const patch = useSettings((s) => s.patch)
  const [installierbar, nachInstallieren] = useInstallierbar()

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <svg
          className={styles.logo}
          viewBox="0 0 32 32"
          width="28"
          height="28"
          aria-hidden="true"
        >
          <path d="M16 4 4 26h24z" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <path d="M16 12v14" stroke="var(--accent)" strokeWidth="2.5" />
        </svg>
        <h1 className={styles.title}>Prismatical</h1>
      </div>

      <div className={styles.controls}>
        {installierbar && (
          <button
            type="button"
            id="installBtn"
            className={styles.installBtn}
            onClick={() => {
              installieren()
              nachInstallieren()
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t('settings.install')}
          </button>
        )}

        <label className={styles.selectWrap}>
          <span className="visually-hidden">{t('settings.languageLabel')}</span>
          <Icon name="globe" size={16} />
          <select
            className={styles.select}
            value={language}
            onChange={(e) => patch({ language: e.target.value })}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.selectWrap}>
          <span className="visually-hidden">{t('settings.theme')}</span>
          <select
            className={styles.select}
            value={theme}
            onChange={(e) => patch({ theme: e.target.value as ThemeId })}
          >
            <option value="classic">{t('settings.themeClassic')}</option>
            <option value="cyber">{t('settings.themeCyber')}</option>
            <option value="aurora">{t('settings.themeAurora')}</option>
          </select>
        </label>

        <label className={styles.selectWrap}>
          <span className="visually-hidden">{t('settings.scheme')}</span>
          <select
            className={styles.select}
            value={scheme}
            onChange={(e) => patch({ scheme: e.target.value as SchemeSetting })}
          >
            <option value="system">{t('settings.schemeSystem')}</option>
            <option value="light">{t('settings.schemeLight')}</option>
            <option value="dark">{t('settings.schemeDark')}</option>
          </select>
        </label>

        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => onOpenDialog('history')}
          title={t('history.title')}
          aria-label={t('history.title')}
        >
          <Icon name="clock" />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => onOpenDialog('settings')}
          title={t('settings.title')}
          aria-label={t('settings.title')}
        >
          <Icon name="sliders" />
        </button>
      </div>
    </header>
  )
}
