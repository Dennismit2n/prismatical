import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from '../../state/history'
import { useSettings } from '../../state/settings'
import { useClipboard } from '../../hooks/useClipboard'
import { Icon } from '../Icon'
import { Modal } from './Modal'
import styles from './Dialogs.module.css'

export function HistoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const entries = useHistory((h) => h.entries)
  const removeAt = useHistory((h) => h.removeAt)
  const clear = useHistory((h) => h.clear)
  const historyEnabled = useSettings((s) => s.historyEnabled)
  const clearSec = useSettings((s) => s.clipboardClearSec)
  const { copy, countdown } = useClipboard(clearSec)
  const [revealedIdx, setRevealedIdx] = useState<number | null>(null)

  return (
    <Modal open={open} onClose={onClose} title={t('history.title')} wide>
      {!historyEnabled && <p className={styles.note}>{t('history.disabledHint')}</p>}
      {historyEnabled && entries.length === 0 && (
        <p className={styles.note}>{t('history.empty')}</p>
      )}
      {countdown !== null && (
        <p className={styles.note} role="status">
          {t('clipboard.countdown', { s: countdown })}
        </p>
      )}
      {entries.length > 0 && (
        <>
          <ul className={styles.historyList}>
            {entries.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className={styles.historyItem}>
                <code className={styles.historyValue}>
                  {revealedIdx === i ? entry.value : '•'.repeat(Math.min(entry.value.length, 24))}
                </code>
                <span className={styles.historyMeta}>
                  {t(`modes.${entry.mode}`)} ·{' '}
                  {new Date(entry.at).toLocaleTimeString(i18n.language)}
                </span>
                <span className={styles.historyActions}>
                  <button
                    type="button"
                    aria-pressed={revealedIdx === i}
                    aria-label={revealedIdx === i ? t('actions.hide') : t('actions.reveal')}
                    onClick={() => setRevealedIdx(revealedIdx === i ? null : i)}
                  >
                    <Icon name={revealedIdx === i ? 'eyeOff' : 'eye'} size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('actions.copy')}
                    onClick={() => void copy(entry.value)}
                  >
                    <Icon name="copy" size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('actions.delete')}
                    onClick={() => removeAt(i)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.dangerBtn} onClick={clear}>
            {t('history.clearAll')}
          </button>
        </>
      )}
    </Modal>
  )
}
