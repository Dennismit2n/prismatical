import { useTranslation } from 'react-i18next'
import { useHistory } from '../../state/history'
import { useSettings } from '../../state/settings'
import { Check } from '../options/controls'
import { Modal } from './Modal'
import styles from './Dialogs.module.css'

const CLIPBOARD_CHOICES = [10, 20, 30, 60, 0]

export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const s = useSettings()
  const clearHistory = useHistory((h) => h.clear)
  const historyCount = useHistory((h) => h.entries.length)

  return (
    <Modal open={open} onClose={onClose} title={t('settings.title')}>
      <section className={styles.section}>
        <h3>{t('settings.clipboardTimer')}</h3>
        <label className={styles.selectRow}>
          <span>{t('settings.clipboardTimerLabel')}</span>
          <select
            value={s.clipboardClearSec}
            onChange={(e) => s.patch({ clipboardClearSec: Number(e.target.value) })}
          >
            {CLIPBOARD_CHOICES.map((sec) => (
              <option key={sec} value={sec}>
                {sec === 0 ? t('settings.timerNever') : t('settings.timerSeconds', { s: sec })}
              </option>
            ))}
          </select>
        </label>
        <p className={styles.note}>{t('settings.clipboardHint')}</p>
      </section>

      <section className={styles.section}>
        <h3>{t('settings.history')}</h3>
        <Check
          label={t('settings.historyEnabled')}
          checked={s.historyEnabled}
          onChange={(historyEnabled) => s.patch({ historyEnabled })}
        />
        <Check
          label={t('settings.historyPersist')}
          hint={t('settings.historyPersistHint')}
          checked={s.historyPersist && s.historyEnabled}
          onChange={(historyPersist) => s.patch({ historyPersist })}
        />
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={clearHistory}
          disabled={historyCount === 0}
        >
          {t('settings.clearHistory', { count: historyCount })}
        </button>
      </section>

      <section className={styles.section}>
        <h3>{t('settings.hibp')}</h3>
        <Check
          label={t('settings.hibpEnabled')}
          checked={s.hibpEnabled}
          onChange={(hibpEnabled) => s.patch({ hibpEnabled })}
        />
        <p className={styles.note}>{t('settings.hibpExplain')}</p>
        <p className={styles.note}>
          <strong>{t('settings.hibpPrivacy')}</strong>
        </p>
      </section>
    </Modal>
  )
}
