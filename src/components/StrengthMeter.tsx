import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import { useSettings } from '../state/settings'
import { Icon } from './Icon'
import styles from './StrengthMeter.module.css'

/**
 * Staerke-Anzeige: Spektrum-Balken + IMMER Text-Label, Bits und Knackzeiten
 * (WCAG 1.4.1 — Staerke nie nur ueber Farbe). Der Balken nutzt die globale
 * Akzentfarbe, die useStrengthAnalysis live mit dem Score wandern laesst.
 */
export function StrengthMeter() {
  const { t } = useTranslation()
  const result = useSession((s) => s.result)
  const strength = useSession((s) => s.strength)
  const hibp = useSession((s) => s.hibp)
  const hibpEnabled = useSettings((s) => s.hibpEnabled)

  if (!result) return null

  const bits = result.entropyBits
  const bitsText = t('strength.bits', { bits: bits.toFixed(1) })
  const label = strength ? t(`strength.score${strength.score}`) : t('strength.computing')
  // Balkenfuellung: kontinuierlich aus guessesLog10 (Deckel bei 10^14),
  // solange zxcvbn laedt naeherungsweise aus der Roh-Entropie.
  const fraction = strength
    ? Math.min(1, strength.guessesLog10 / 14)
    : Math.min(1, bits / 128)

  return (
    <div className={styles.meterBlock}>
      <div
        className={styles.track}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={strength?.score ?? 0}
        aria-valuetext={`${label} – ${bitsText}`}
        aria-label={t('strength.title')}
      >
        <div className={styles.fill} style={{ width: `${(fraction * 100).toFixed(1)}%` }} />
      </div>

      <p className={styles.summary}>
        <strong className={styles.scoreLabel}>{label}</strong>
        <span className={styles.bits}>{bitsText}</span>
        {result.constrained && <span className={styles.approx}>≈</span>}
      </p>

      {strength && (
        <dl className={styles.crackTimes}>
          <div>
            <dt>{t('strength.crackOnline')}</dt>
            <dd>{strength.crackTimes.onlineThrottlingXPerHour.display}</dd>
          </div>
          <div>
            <dt>{t('strength.crackOffline')}</dt>
            <dd>{strength.crackTimes.offlineFastHashingXPerSecond.display}</dd>
          </div>
        </dl>
      )}

      {strength?.feedback.warning && (
        <p className={styles.feedbackWarning}>
          <Icon name="alert" size={14} /> {strength.feedback.warning}
        </p>
      )}
      {strength && strength.feedback.suggestions.length > 0 && (
        <ul className={styles.suggestions}>
          {strength.feedback.suggestions.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}

      {hibpEnabled && hibp.kind !== 'idle' && (
        <p
          className={`${styles.hibp} ${hibp.kind === 'found' ? styles.hibpFound : ''}`}
          role="status"
        >
          <Icon name="shield" size={14} />{' '}
          {hibp.kind === 'checking' && t('hibp.checking')}
          {hibp.kind === 'found' && t('hibp.found', { count: hibp.count })}
          {hibp.kind === 'notFound' && t('hibp.notFound')}
          {hibp.kind === 'error' && t('hibp.error')}
        </p>
      )}
    </div>
  )
}
