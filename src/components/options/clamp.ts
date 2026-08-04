/** Eingaben aus Zahlenfeldern auf ganzzahlige Grenzen bringen. */
export function clampInt(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}
