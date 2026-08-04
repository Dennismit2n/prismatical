import { useTranslation } from 'react-i18next'
import {
  PASSPHRASE_WORDS_MAX,
  PASSPHRASE_WORDS_MIN,
} from '../../generator/passphrase'
import type { SeparatorKind } from '../../generator/types'
import { WORDLISTS, resolveListId, wordlistInfo } from '../../features/wordlists/wordlists'
import { useSettings } from '../../state/settings'
import { Check, LengthControl, SelectField, TextField } from './controls'
import styles from './Options.module.css'

export function PassphrasePanel() {
  const { t } = useTranslation()
  const o = useSettings((s) => s.passphrase)
  const language = useSettings((s) => s.language)
  const patchPassphrase = useSettings((s) => s.patchPassphrase)

  const resolvedId = resolveListId(o.listId, language)
  const info = wordlistInfo(resolvedId)
  const bitsPerWord = Math.log2(info.size).toFixed(2)

  return (
    <div className={styles.grid}>
      <LengthControl
        label={t('options.wordCount')}
        min={PASSPHRASE_WORDS_MIN}
        max={PASSPHRASE_WORDS_MAX}
        value={o.wordCount}
        onChange={(wordCount) => patchPassphrase({ wordCount })}
      />

      <SelectField
        label={t('options.wordlist')}
        value={o.listId}
        onChange={(listId) => patchPassphrase({ listId })}
      >
        <option value="auto">{t('options.wordlistAuto')}</option>
        {WORDLISTS.map((w) => (
          <option key={w.id} value={w.id}>
            {w.label}
          </option>
        ))}
      </SelectField>
      <p className={styles.note}>
        {t('options.wordlistInfo', { label: info.label, size: info.size, bits: bitsPerWord })}
      </p>

      <SelectField
        label={t('options.separator')}
        value={o.separator}
        onChange={(separator) => patchPassphrase({ separator: separator as SeparatorKind })}
      >
        <option value="dash">{t('options.sepDash')}</option>
        <option value="dot">{t('options.sepDot')}</option>
        <option value="space">{t('options.sepSpace')}</option>
        <option value="digit">{t('options.sepDigit')}</option>
        <option value="custom">{t('options.sepCustom')}</option>
      </SelectField>
      {o.separator === 'custom' && (
        <TextField
          label={t('options.sepCustomLabel')}
          value={o.customSeparator}
          onChange={(customSeparator) =>
            patchPassphrase({ customSeparator: customSeparator.slice(0, 3) })
          }
        />
      )}

      <fieldset className={styles.fieldset}>
        <legend>{t('options.extras')}</legend>
        <Check
          label={t('options.capitalizeWords')}
          checked={o.capitalizeWords}
          onChange={(capitalizeWords) => patchPassphrase({ capitalizeWords })}
        />
        <Check
          label={t('options.includeDigit')}
          checked={o.includeDigit}
          onChange={(includeDigit) => patchPassphrase({ includeDigit })}
        />
        <Check
          label={t('options.includeSpecial')}
          checked={o.includeSpecial}
          onChange={(includeSpecial) => patchPassphrase({ includeSpecial })}
        />
      </fieldset>
    </div>
  )
}
