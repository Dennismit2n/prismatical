import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../state/session'
import { Icon } from '../Icon'
import { Modal } from './Modal'
import styles from './Dialogs.module.css'

/**
 * Merk-Trainer fuer Passphrasen (rein lokal): blendet pro Runde ein weiteres
 * Wort aus; die Nutzerin tippt die vollstaendige Phrase nach, bis alle Woerter
 * aus dem Gedaechtnis kommen. Eingaben verlassen die Komponente nie.
 */
export function TrainerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const value = useSession((s) => s.result?.value ?? '')

  // Phrase in Woerter zerlegen (alle Trenner-Varianten abdecken).
  const words = useMemo(() => value.split(/[\s.\-·]+|\d+/).filter(Boolean), [value])

  const [hiddenCount, setHiddenCount] = useState(1)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong' | 'done'>('none')

  const masked = words
    .map((w, i) => (i < words.length - hiddenCount ? w : '▁'.repeat(Math.max(3, w.length))))
    .join(' ')

  const check = () => {
    const normalize = (s: string) => s.trim().replace(/[\s.\-·]+|\d+/g, ' ').replace(/ +/g, ' ')
    if (normalize(input) === normalize(words.join(' '))) {
      if (hiddenCount >= words.length) {
        setFeedback('done')
      } else {
        setFeedback('correct')
        setHiddenCount((c) => c + 1)
        setInput('')
      }
    } else {
      setFeedback('wrong')
    }
  }

  const reset = () => {
    setHiddenCount(1)
    setInput('')
    setFeedback('none')
  }

  const close = () => {
    reset()
    onClose()
  }

  if (words.length < 2) return null

  return (
    <Modal open={open} onClose={close} title={t('trainer.title')}>
      <p className={styles.note}>{t('trainer.intro')}</p>
      <p className={styles.trainerPhrase} aria-label={t('trainer.phraseLabel')}>
        {masked}
      </p>
      <p className={styles.note}>
        {t('trainer.round', { n: hiddenCount, total: words.length })}
      </p>
      <div className={styles.trainerRow}>
        <input
          type="text"
          value={input}
          autoComplete="off"
          spellCheck={false}
          aria-label={t('trainer.typeHere')}
          placeholder={t('trainer.typeHere')}
          onChange={(e) => {
            setInput(e.target.value)
            if (feedback === 'wrong') setFeedback('none')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') check()
          }}
        />
        <button type="button" className={styles.primaryBtn} onClick={check}>
          {t('trainer.checkBtn')}
        </button>
      </div>
      {feedback === 'correct' && (
        <p className={styles.successNote} role="status">
          <Icon name="check" size={14} /> {t('trainer.correct')}
        </p>
      )}
      {feedback === 'wrong' && (
        <p className={styles.warningNote} role="status">
          <Icon name="alert" size={14} /> {t('trainer.wrong')}
        </p>
      )}
      {feedback === 'done' && (
        <p className={styles.successNote} role="status">
          <Icon name="check" size={14} /> {t('trainer.done')}
        </p>
      )}
      <button type="button" className={styles.subtleBtn} onClick={reset}>
        {t('trainer.restart')}
      </button>
    </Modal>
  )
}
