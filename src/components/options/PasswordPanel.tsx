import { useTranslation } from 'react-i18next'
import { PASSWORD_LENGTH_MAX, PASSWORD_LENGTH_MIN } from '../../generator/password'
import { PRESETS, findPreset } from '../../features/presets/presets'
import { useSettings } from '../../state/settings'
import { Check, LengthControl, MinField, SelectField, TextField } from './controls'
import styles from './Options.module.css'

export function PasswordPanel() {
  const { t } = useTranslation()
  const o = useSettings((s) => s.password)
  const presetId = useSettings((s) => s.presetId)
  const patchPassword = useSettings((s) => s.patchPassword)
  const patch = useSettings((s) => s.patch)

  const applyPreset = (id: string) => {
    if (id === 'custom') {
      patch({ presetId: null })
      return
    }
    const preset = findPreset(id)
    if (preset) {
      // patchPassword wuerde presetId nullen — deshalb direkt patchen.
      patch({ password: { ...o, ...preset.patch }, presetId: id })
    }
  }

  return (
    <div className={styles.grid}>
      <SelectField
        label={t('options.preset')}
        value={presetId ?? 'custom'}
        onChange={applyPreset}
      >
        <option value="custom">{t('options.presetCustom')}</option>
        {PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {t(`presets.${p.id}`)}
          </option>
        ))}
      </SelectField>

      <LengthControl
        label={t('options.length')}
        min={PASSWORD_LENGTH_MIN}
        max={PASSWORD_LENGTH_MAX}
        value={o.length}
        onChange={(length) => patchPassword({ length })}
      />

      <fieldset className={styles.fieldset}>
        <legend>{t('options.classes')}</legend>
        <Check
          label={t('options.upper')}
          checked={o.upper}
          onChange={(upper) => patchPassword({ upper })}
        />
        <Check
          label={t('options.lower')}
          checked={o.lower}
          onChange={(lower) => patchPassword({ lower })}
        />
        <Check
          label={t('options.digits')}
          checked={o.digits}
          onChange={(digits) => patchPassword({ digits })}
        />
        <Check
          label={t('options.special')}
          checked={o.special}
          onChange={(special) => patchPassword({ special })}
        />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>{t('options.rules')}</legend>
        <Check
          label={t('options.excludeAmbiguous')}
          hint="l 1 I | 0 O"
          checked={o.excludeAmbiguous}
          onChange={(excludeAmbiguous) => patchPassword({ excludeAmbiguous })}
        />
        <Check
          label={t('options.requireEachClass')}
          checked={o.requireEachClass}
          onChange={(requireEachClass) => patchPassword({ requireEachClass })}
        />
        <Check
          label={t('options.noRepeats')}
          checked={o.noRepeats}
          onChange={(noRepeats) => patchPassword({ noRepeats })}
        />
        <div className={styles.minRow}>
          <MinField
            label={t('options.minDigits')}
            value={o.minDigits}
            onChange={(minDigits) => patchPassword({ minDigits })}
          />
          <MinField
            label={t('options.minSpecial')}
            value={o.minSpecial}
            onChange={(minSpecial) => patchPassword({ minSpecial })}
          />
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend>{t('options.charsets')}</legend>
        <TextField
          label={t('options.specialChars')}
          value={o.specialChars}
          onChange={(specialChars) => patchPassword({ specialChars })}
          placeholder="!@#$%^&*"
        />
        <TextField
          label={t('options.excludeChars')}
          value={o.excludeChars}
          onChange={(excludeChars) => patchPassword({ excludeChars })}
        />
      </fieldset>
    </div>
  )
}
