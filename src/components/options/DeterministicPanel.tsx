import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deriveDeterministicPassword } from '../../generator/deterministic'
import { GeneratorError } from '../../generator/errors'
import { useSession } from '../../state/session'
import { Icon } from '../Icon'
import { clampInt } from './clamp'
import { Check, LengthControl } from './controls'
import styles from './Options.module.css'

/**
 * Deterministischer Modus: alle Eingaben leben NUR im lokalen
 * Komponenten-Zustand — nichts davon wird gespeichert oder versendet.
 */
export function DeterministicPanel() {
  const { t } = useTranslation()
  const setResult = useSession((s) => s.setResult)
  const setError = useSession((s) => s.setError)

  const [master, setMaster] = useState('')
  const [masterVisible, setMasterVisible] = useState(false)
  const [site, setSite] = useState('')
  const [login, setLogin] = useState('')
  const [counter, setCounter] = useState(1)
  const [length, setLength] = useState(20)
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [digits, setDigits] = useState(true)
  const [special, setSpecial] = useState(true)
  const [busy, setBusy] = useState(false)

  const canGenerate = master.length > 0 && site.length > 0 && !busy

  const generate = async () => {
    setBusy(true)
    try {
      const result = await deriveDeterministicPassword(
        { master, site: site.trim().toLowerCase(), login: login.trim(), counter },
        { length, upper, lower, digits, special, specialChars: '!@#$%^&*' },
      )
      setResult(result)
    } catch (e) {
      if (e instanceof GeneratorError) setError(e.code)
      else throw e
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.grid}>
      <div className={styles.warningBox} role="note">
        <Icon name="alert" size={18} />
        <div>
          <strong>{t('deterministic.warningTitle')}</strong>
          <p>{t('deterministic.warningBody')}</p>
        </div>
      </div>

      <div className={styles.textField}>
        <label htmlFor="det-master">{t('deterministic.master')}</label>
        <div className={styles.masterRow}>
          <input
            id="det-master"
            type={masterVisible ? 'text' : 'password'}
            value={master}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setMaster(e.target.value)}
          />
          <button
            type="button"
            className={styles.inlineIconBtn}
            aria-pressed={masterVisible}
            aria-label={masterVisible ? t('actions.hide') : t('actions.reveal')}
            onClick={() => setMasterVisible((v) => !v)}
          >
            <Icon name={masterVisible ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </div>
        <p className={styles.note}>{t('deterministic.masterHint')}</p>
      </div>

      <div className={styles.textField}>
        <label htmlFor="det-site">{t('deterministic.site')}</label>
        <input
          id="det-site"
          type="text"
          value={site}
          placeholder="example.com"
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setSite(e.target.value)}
        />
      </div>

      <div className={styles.textField}>
        <label htmlFor="det-login">{t('deterministic.login')}</label>
        <input
          id="det-login"
          type="text"
          value={login}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setLogin(e.target.value)}
        />
      </div>

      <div className={styles.minField}>
        <label htmlFor="det-counter">{t('deterministic.counter')}</label>
        <input
          id="det-counter"
          type="number"
          min={1}
          max={999}
          value={counter}
          inputMode="numeric"
          onChange={(e) => setCounter(clampInt(Number(e.target.value), 1, 999))}
        />
      </div>

      <LengthControl label={t('options.length')} min={4} max={64} value={length} onChange={setLength} />

      <fieldset className={styles.fieldset}>
        <legend>{t('options.classes')}</legend>
        <Check label={t('options.upper')} checked={upper} onChange={setUpper} />
        <Check label={t('options.lower')} checked={lower} onChange={setLower} />
        <Check label={t('options.digits')} checked={digits} onChange={setDigits} />
        <Check label={t('options.special')} checked={special} onChange={setSpecial} />
      </fieldset>

      <button
        type="button"
        className={styles.primaryBtn}
        disabled={!canGenerate}
        onClick={() => void generate()}
      >
        {busy ? t('deterministic.deriving') : t('deterministic.generateBtn')}
      </button>
    </div>
  )
}
