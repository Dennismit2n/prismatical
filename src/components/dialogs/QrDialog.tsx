import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSession } from '../../state/session'
import { Icon } from '../Icon'
import { Modal } from './Modal'
import styles from './Dialogs.module.css'

/**
 * QR-Export: der Code wird LOKAL im Canvas gerendert (qrcode-Bibliothek),
 * es gibt keinerlei Netzwerk-Aufrufe. Feste Schwarz/Weiss-Farben, damit jeder
 * Scanner ihn liest — unabhaengig vom Theme.
 */
export function QrDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const value = useSession((s) => s.result?.value ?? '')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open || !value || !canvasRef.current) return
    let cancelled = false
    // Lazy Import: die QR-Bibliothek gehoert nicht ins Start-Bundle.
    void import('qrcode').then(({ toCanvas }) => {
      if (cancelled || !canvasRef.current) return
      toCanvas(canvasRef.current, value, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 240,
        color: { dark: '#000000', light: '#ffffff' },
      }).catch(() => {
        /* Canvas nicht verfuegbar — Dialog bleibt leer */
      })
    })
    return () => {
      cancelled = true
    }
  }, [open, value])

  return (
    <Modal open={open} onClose={onClose} title={t('qr.title')}>
      <div className={styles.qrWrap}>
        <canvas ref={canvasRef} className={styles.qrCanvas} aria-label={t('qr.canvasLabel')} />
      </div>
      <p className={styles.warningNote}>
        <Icon name="alert" size={14} /> {t('qr.warning')}
      </p>
    </Modal>
  )
}
