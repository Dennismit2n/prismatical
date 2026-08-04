import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GeneratorError } from '../../generator/errors'
import { generatePassword } from '../../generator/password'
import { generatePassphrase } from '../../generator/passphrase'
import { generatePin } from '../../generator/pin'
import { generatePronounceable } from '../../generator/pronounceable'
import { generateUsername } from '../../generator/username'
import { loadWordlist, resolveListId } from '../../features/wordlists/wordlists'
import { useSettings } from '../../state/settings'
import { useClipboard } from '../../hooks/useClipboard'
import { clampInt } from '../options/clamp'
import { Modal } from './Modal'
import styles from './Dialogs.module.css'

/**
 * Bulk-Generierung: N Ergebnisse auf einmal. Kopieren und Datei-Export
 * passieren AUSSCHLIESSLICH auf Nutzeraktion; beim Schliessen wird die Liste
 * verworfen (kein heimliches Speichern).
 */
export function BulkDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const settings = useSettings()
  const clearSec = useSettings((s) => s.clipboardClearSec)
  const { copy, countdown, justCopied } = useClipboard(clearSec)
  const [count, setCount] = useState(10)
  const [items, setItems] = useState<string[]>([])
  const [error, setError] = useState(false)

  const generate = async () => {
    setError(false)
    try {
      const out: string[] = []
      if (settings.mode === 'passphrase') {
        const listId = resolveListId(settings.passphrase.listId, settings.language)
        const words = await loadWordlist(listId)
        for (let i = 0; i < count; i++) {
          out.push(generatePassphrase(settings.passphrase, words).value)
        }
      } else {
        for (let i = 0; i < count; i++) {
          switch (settings.mode) {
            case 'password':
              out.push(generatePassword(settings.password).value)
              break
            case 'pin':
              out.push(generatePin(settings.pin).value)
              break
            case 'pronounceable':
              out.push(generatePronounceable(settings.pronounceable).value)
              break
            case 'username':
              out.push(generateUsername(settings.username).value)
              break
            default:
              return
          }
        }
      }
      setItems(out)
    } catch (e) {
      if (e instanceof GeneratorError) setError(true)
      else throw e
    }
  }

  const download = () => {
    // Datei-Export nur auf Klick: Blob → temporaerer Objekt-Link → sofort widerrufen.
    const blob = new Blob([items.join('\r\n') + '\r\n'], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prisma-passwoerter.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const close = () => {
    setItems([]) // Liste beim Schliessen verwerfen
    onClose()
  }

  return (
    <Modal open={open} onClose={close} title={t('bulk.title')} wide>
      <div className={styles.bulkControls}>
        <label className={styles.selectRow}>
          <span>{t('bulk.count')}</span>
          <input
            type="number"
            min={1}
            max={100}
            value={count}
            inputMode="numeric"
            onChange={(e) => setCount(clampInt(Number(e.target.value), 1, 100))}
          />
        </label>
        <button type="button" className={styles.primaryBtn} onClick={() => void generate()}>
          {t('bulk.generate')}
        </button>
      </div>
      {error && <p className={styles.warningNote}>{t('bulk.error')}</p>}
      {countdown !== null && (
        <p className={styles.note} role="status">
          {t('clipboard.countdown', { s: countdown })}
        </p>
      )}
      {items.length > 0 && (
        <>
          <textarea
            className={styles.bulkOutput}
            readOnly
            rows={Math.min(12, items.length)}
            value={items.join('\n')}
            aria-label={t('bulk.listLabel')}
          />
          <div className={styles.bulkControls}>
            <button type="button" onClick={() => void copy(items.join('\n'))}>
              {justCopied ? t('actions.copied') : t('bulk.copyAll')}
            </button>
            <button type="button" onClick={download}>
              {t('bulk.downloadFile')}
            </button>
          </div>
          <p className={styles.note}>{t('bulk.hint')}</p>
        </>
      )}
    </Modal>
  )
}
