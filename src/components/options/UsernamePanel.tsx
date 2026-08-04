import { useTranslation } from 'react-i18next'
import { useSettings } from '../../state/settings'
import { Check, SelectField } from './controls'
import styles from './Options.module.css'

export function UsernamePanel() {
  const { t } = useTranslation()
  const o = useSettings((s) => s.username)
  const patchUsername = useSettings((s) => s.patchUsername)

  return (
    <div className={styles.grid}>
      <SelectField
        label={t('options.style')}
        value={o.style}
        onChange={(style) => patchUsername({ style: style as 'lower' | 'camel' })}
      >
        <option value="camel">{t('options.styleCamel')}</option>
        <option value="lower">{t('options.styleLower')}</option>
      </SelectField>
      <fieldset className={styles.fieldset}>
        <legend>{t('options.extras')}</legend>
        <Check
          label={t('options.leetify')}
          hint="a→4, e→3, o→0 …"
          checked={o.leetify}
          onChange={(leetify) => patchUsername({ leetify })}
        />
        <Check
          label={t('options.appendDigits')}
          checked={o.appendDigits}
          onChange={(appendDigits) => patchUsername({ appendDigits })}
        />
      </fieldset>
    </div>
  )
}
