import { useTranslation } from 'react-i18next'
import { useSession } from '../state/session'
import { useSettings } from '../state/settings'
import { Icon } from './Icon'
import styles from './TransparencyPanel.module.css'

/**
 * Krypto-Transparenz-Panel: legt offen, WIE das aktuelle Ergebnis entstanden
 * ist — Zufallsquelle, Alphabetgroesse, Entropieformel, zxcvbn-Details und
 * alle vier Knackzeit-Szenarien. Lange Texte liegen im lazy geladenen
 * i18n-Namespace "transparency".
 */
export function TransparencyPanel() {
  const { t } = useTranslation('transparency')
  const result = useSession((s) => s.result)
  const strength = useSession((s) => s.strength)
  const mode = useSettings((s) => s.mode)

  if (!result) return null

  const isWordMode = mode === 'passphrase'
  const scenarios = strength
    ? ([
        ['onlineThrottled', strength.crackTimes.onlineThrottlingXPerHour.display],
        ['onlineFast', strength.crackTimes.onlineNoThrottlingXPerSecond.display],
        ['offlineSlow', strength.crackTimes.offlineSlowHashingXPerSecond.display],
        ['offlineFast', strength.crackTimes.offlineFastHashingXPerSecond.display],
      ] as const)
    : []

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>
        <Icon name="info" size={18} />
        <span>{t('title')}</span>
      </summary>
      <div className={styles.body}>
        <p>{t('intro')}</p>

        <h3>{t('randomSourceTitle')}</h3>
        <p>
          <code>crypto.getRandomValues()</code> — {t('randomSourceBody')}
        </p>

        <h3>{t('entropyTitle')}</h3>
        <p>
          {isWordMode
            ? t('entropyWords', {
                pool: result.poolSize,
                bits: result.entropyBits.toFixed(1),
              })
            : mode === 'username' || mode === 'pronounceable'
              ? // Kein Zeichen-Alphabet: die length×log2-Formel waere hier falsch.
                t('entropyGeneric', { bits: result.entropyBits.toFixed(1) })
              : t('entropyChars', {
                  pool: result.poolSize,
                  length: result.value.length,
                  bits: result.entropyBits.toFixed(1),
                })}
        </p>
        {result.constrained && <p className={styles.note}>{t('constrainedNote')}</p>}

        <h3>{t('zxcvbnTitle')}</h3>
        {strength ? (
          <>
            <p>
              {t('zxcvbnBody', {
                score: strength.score,
                guesses: strength.guessesLog10.toFixed(2),
              })}
            </p>
            <table className={styles.table}>
              <caption>{t('scenariosTitle')}</caption>
              <tbody>
                {scenarios.map(([key, display]) => (
                  <tr key={key}>
                    <th scope="row">{t(`scenario.${key}`)}</th>
                    <td>{display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p>{t('zxcvbnLoading')}</p>
        )}

        <h3>{t('privacyTitle')}</h3>
        <p>{t('privacyBody')}</p>
      </div>
    </details>
  )
}
