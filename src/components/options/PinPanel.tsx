import { useTranslation } from 'react-i18next'
import { PIN_MAX, PIN_MIN } from '../../generator/pin'
import { useSettings } from '../../state/settings'
import { LengthControl } from './controls'
import styles from './Options.module.css'

export function PinPanel() {
  const { t } = useTranslation()
  const o = useSettings((s) => s.pin)
  const patchPin = useSettings((s) => s.patchPin)

  return (
    <div className={styles.grid}>
      <LengthControl
        label={t('options.digitsCount')}
        min={PIN_MIN}
        max={PIN_MAX}
        value={o.digits}
        onChange={(digits) => patchPin({ digits })}
      />
      <p className={styles.note}>{t('options.pinNote')}</p>
    </div>
  )
}
