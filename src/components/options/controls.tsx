/** Kleine, wiederverwendbare Formular-Bausteine der Options-Panels. */

import { useId } from 'react'
import type { ReactNode } from 'react'
import { clampInt } from './clamp'
import styles from './Options.module.css'

/** Slider + synchronisiertes Zahlenfeld (beide beschriftet, gleiche Grenzen). */
export function LengthControl({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: number
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className={styles.lengthControl}>
      <label htmlFor={id} className={styles.lengthLabel}>
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        className={styles.slider}
        onChange={(e) => onChange(clampInt(Number(e.target.value), min, max))}
      />
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        inputMode="numeric"
        className={styles.number}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(clampInt(n, min, max))
        }}
        onBlur={(e) => onChange(clampInt(Number(e.target.value), min, max))}
      />
    </div>
  )
}

export function Check({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  const id = useId()
  return (
    <label className={styles.check} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        {label}
        {hint && <small className={styles.hint}>{hint}</small>}
      </span>
    </label>
  )
}

/** Zahlenfeld 0–9 fuer die Minima-Regeln. */
export function MinField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const id = useId()
  return (
    <div className={styles.minField}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        min={0}
        max={9}
        value={value}
        inputMode="numeric"
        onChange={(e) => onChange(clampInt(Number(e.target.value), 0, 9))}
      />
    </div>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className={styles.textField}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className={styles.textField}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  )
}
