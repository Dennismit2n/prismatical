import { useTranslation } from 'react-i18next'
import { PRONOUNCEABLE_MAX, PRONOUNCEABLE_MIN } from '../../generator/pronounceable'
import { useSettings } from '../../state/settings'
import { Check, LengthControl } from './controls'
import styles from './Options.module.css'

export function PronounceablePanel() {
  const { t } = useTranslation()
  const o = useSettings((s) => s.pronounceable)
  const patchPronounceable = useSettings((s) => s.patchPronounceable)

  return (
    <div className={styles.grid}>
      <LengthControl
        label={t('options.length')}
        min={PRONOUNCEABLE_MIN}
        max={PRONOUNCEABLE_MAX}
        value={o.length}
        onChange={(length) => patchPronounceable({ length })}
      />
      <fieldset className={styles.fieldset}>
        <legend>{t('options.extras')}</legend>
        <Check
          label={t('options.capitalize')}
          checked={o.capitalize}
          onChange={(capitalize) => patchPronounceable({ capitalize })}
        />
        <Check
          label={t('options.appendDigits')}
          checked={o.appendDigits}
          onChange={(appendDigits) => patchPronounceable({ appendDigits })}
        />
      </fieldset>
    </div>
  )
}
