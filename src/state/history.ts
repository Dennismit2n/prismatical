/**
 * Lokaler Verlauf erzeugter Passwoerter.
 *
 * Datenschutz-Design:
 *  - Aufzeichnung NUR bei aktiviertem Opt-in (historyEnabled, Default AUS).
 *  - Standard-Speicherort ist sessionStorage → "Verlauf beim Schliessen
 *    leeren" ist der Normalfall. Erst ein zweites, ausdrueckliches Opt-in
 *    (historyPersist) verschiebt ihn nach localStorage.
 *  - Jederzeit einzeln oder komplett loeschbar; beim Deaktivieren wird alles
 *    sofort aus beiden Speichern entfernt.
 */

import { create } from 'zustand'
import type { GeneratorMode } from '../generator/types'

export interface HistoryEntry {
  value: string
  mode: GeneratorMode
  at: number
}

const KEY = 'prisma.history'
const MAX_ENTRIES = 50

function readStore(storage: Storage): HistoryEntry[] {
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === 'object' && e !== null && typeof (e as HistoryEntry).value === 'string',
    )
  } catch {
    return []
  }
}

function writeStore(storage: Storage, entries: HistoryEntry[]): void {
  try {
    if (entries.length === 0) storage.removeItem(KEY)
    else storage.setItem(KEY, JSON.stringify(entries))
  } catch {
    /* Speicher voll / privater Modus: Verlauf ist verzichtbar */
  }
}

function loadInitial(): HistoryEntry[] {
  // Sitzung hat Vorrang; localStorage nur, wenn dauerhaftes Speichern aktiv war.
  const session = readStore(sessionStorage)
  if (session.length > 0) return session
  return readStore(localStorage)
}

export interface HistoryState {
  entries: HistoryEntry[]
  add: (entry: HistoryEntry) => void
  removeAt: (index: number) => void
  clear: () => void
}

export const useHistory = create<HistoryState>()((set) => ({
  entries: loadInitial(),
  add: (entry) =>
    set((s) => {
      if (s.entries[0]?.value === entry.value) return s // Doppel-Generierung nicht doppelt listen
      return { entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }
    }),
  removeAt: (index) => set((s) => ({ entries: s.entries.filter((_, i) => i !== index) })),
  clear: () => set({ entries: [] }),
}))

/**
 * Persistenz-Router: schreibt den Verlauf in den zur Einstellung passenden
 * Speicher und raeumt den jeweils anderen leer. Wird von App.tsx an die
 * Settings gekoppelt.
 */
export function syncHistoryStorage(historyEnabled: boolean, historyPersist: boolean): void {
  const entries = useHistory.getState().entries
  if (!historyEnabled) {
    writeStore(sessionStorage, [])
    writeStore(localStorage, [])
    // Auch den In-Memory-Verlauf leeren: sonst kaemen "geloeschte" Eintraege
    // beim Re-Aktivieren wieder in den Speicher zurueck.
    if (entries.length > 0) useHistory.getState().clear()
    return
  }
  if (historyPersist) {
    writeStore(localStorage, entries)
    writeStore(sessionStorage, [])
  } else {
    writeStore(sessionStorage, entries)
    writeStore(localStorage, [])
  }
}
