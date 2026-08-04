import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { classOfChar } from '../generator/charsets'
import { useSession } from '../state/session'
import { useSettings } from '../state/settings'
import { useClipboard } from '../hooks/useClipboard'
import type { DialogId } from '../App'
import { Icon } from './Icon'
import { StrengthMeter } from './StrengthMeter'
import styles from './PasswordCard.module.css'

const CLASS_TO_TOKEN = { upper: 'l', lower: 'l', digit: 'd', special: 's' } as const

export function PasswordCard({ onOpenDialog }: { onOpenDialog: (d: DialogId) => void }) {
  const { t } = useTranslation()
  const result = useSession((s) => s.result)
  const error = useSession((s) => s.error)
  const revealed = useSession((s) => s.revealed)
  const setRevealed = useSession((s) => s.setRevealed)
  const regenerate = useSession((s) => s.regenerate)
  const regenTick = useSession((s) => s.regenTick)
  const mode = useSettings((s) => s.mode)
  const clearSec = useSettings((s) => s.clipboardClearSec)
  const { copy, countdown, justCopied, clearFailed } = useClipboard(clearSec)

  const value = result?.value ?? ''

  // Tastatur-Shortcuts: Strg/Cmd+Enter = neu generieren,
  // Strg/Cmd+C ohne Textauswahl/Eingabefeld = aktuelles Passwort kopieren.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 'Enter') {
        e.preventDefault()
        regenerate()
        return
      }
      if (e.key.toLowerCase() === 'c') {
        const selection = window.getSelection()?.toString()
        const target = e.target as HTMLElement | null
        const inField =
          target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
        if (!selection && !inField && value) {
          e.preventDefault()
          void copy(value)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [regenerate, copy, value])

  // Zeichen-Typ-Faerbung: Buchstaben neutral, Ziffern blau, Sonderzeichen magenta.
  const coloredChars = useMemo(
    () =>
      [...value].map((ch, i) => (
        <span key={i} data-t={CLASS_TO_TOKEN[classOfChar(ch)]}>
          {ch}
        </span>
      )),
    [value],
  )

  // aria-live-Ansage bei jeder Generierung; das Zero-Width-Space wechselt,
  // damit auch gleichlautende Ansagen erneut vorgelesen werden.
  const announcement = value ? t('display.announceNew') + (regenTick % 2 ? '​' : '') : ''

  return (
    <section className={styles.card} aria-label={t('display.label')}>
      <div className={styles.pwRow}>
        <output className={styles.pw} aria-label={t('display.label')}>
          {value === '' && !error ? (
            <span className={styles.empty}>…</span>
          ) : revealed ? (
            coloredChars
          ) : (
            <span aria-hidden="true">{'•'.repeat(Math.min(value.length, 64))}</span>
          )}
        </output>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-pressed={!revealed}
            onClick={() => setRevealed(!revealed)}
            title={revealed ? t('actions.hide') : t('actions.reveal')}
            aria-label={revealed ? t('actions.hide') : t('actions.reveal')}
          >
            <Icon name={revealed ? 'eyeOff' : 'eye'} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => void copy(value)}
            disabled={!value}
            title={t('actions.copy')}
            aria-label={t('actions.copy')}
          >
            <Icon name={justCopied ? 'check' : 'copy'} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onOpenDialog('qr')}
            disabled={!value}
            title={t('qr.title')}
            aria-label={t('qr.title')}
          >
            <Icon name="qr" />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => onOpenDialog('bulk')}
            disabled={mode === 'deterministic'}
            title={t('bulk.title')}
            aria-label={t('bulk.title')}
          >
            <Icon name="layers" />
          </button>
          {mode === 'passphrase' && (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => onOpenDialog('trainer')}
              disabled={!value}
              title={t('trainer.title')}
              aria-label={t('trainer.title')}
            >
              <Icon name="book" />
            </button>
          )}
          <button
            type="button"
            className={`${styles.generateBtn} flow`}
            onClick={regenerate}
            disabled={mode === 'deterministic'}
          >
            <Icon name="refresh" size={18} />
            <span>{t('actions.generate')}</span>
          </button>
        </div>
      </div>

      <div className="visually-hidden" aria-live="polite">
        {announcement}
      </div>

      {countdown !== null && (
        <p className={styles.countdown} role="status">
          <Icon name="clock" size={14} /> {t('clipboard.countdown', { s: countdown })}
        </p>
      )}
      {clearFailed && (
        <p className={styles.warning} role="status">
          <Icon name="alert" size={14} /> {t('clipboard.clearFailed')}
        </p>
      )}
      {error && (
        <p className={styles.error} role="alert">
          <Icon name="alert" size={14} /> {t(`errors.${error}`)}
        </p>
      )}
      {result?.warnings.map((w) => (
        <p key={w} className={styles.warning}>
          <Icon name="alert" size={14} /> {t(`warnings.${w}`)}
        </p>
      ))}

      <StrengthMeter />
    </section>
  )
}
