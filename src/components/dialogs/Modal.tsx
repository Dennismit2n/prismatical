import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '../Icon'
import styles from './Dialogs.module.css'

/**
 * Wrapper um das native <dialog>-Element: Fokus-Falle, ESC und ::backdrop
 * kommen vom Browser; wir ergaenzen Kopfzeile + Schliessen-Knopf.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  const { t } = useTranslation()

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      onClose={onClose}
      aria-label={title}
    >
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label={t('actions.close')}
        >
          <Icon name="x" />
        </button>
      </div>
      {open && <div className={styles.body}>{children}</div>}
    </dialog>
  )
}
