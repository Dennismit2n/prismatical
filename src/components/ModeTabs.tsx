import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { GeneratorMode } from '../generator/types'
import { useSettings } from '../state/settings'
import styles from './ModeTabs.module.css'

const MODES: GeneratorMode[] = [
  'password',
  'passphrase',
  'pin',
  'pronounceable',
  'username',
  'deterministic',
]

/** Modus-Tabs mit Pfeiltasten-Navigation (Roving Tabindex). */
export function ModeTabs() {
  const { t } = useTranslation()
  const mode = useSettings((s) => s.mode)
  const patch = useSettings((s) => s.patch)
  const listRef = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const idx = MODES.indexOf(mode)
    const next =
      e.key === 'ArrowRight'
        ? MODES[(idx + 1) % MODES.length]
        : MODES[(idx - 1 + MODES.length) % MODES.length]
    patch({ mode: next })
    // Fokus auf den neu aktiven Tab verschieben
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLButtonElement>(`[data-mode="${next}"]`)
        ?.focus()
    })
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t('modes.label')}
      className={styles.tabs}
      onKeyDown={onKeyDown}
    >
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          data-mode={m}
          aria-selected={mode === m}
          aria-controls="options-panel"
          tabIndex={mode === m ? 0 : -1}
          className={styles.tab}
          onClick={() => patch({ mode: m })}
        >
          {t(`modes.${m}`)}
        </button>
      ))}
    </div>
  )
}
