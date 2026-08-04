/**
 * Diceware-Wortlisten: Laden + Registry.
 *
 * Alle Listen liegen lokal unter /wordlists/*.txt (eine Zeile = ein Wort),
 * werden vom Service Worker praecached und NIE aus dem Netz nachgeladen.
 * 'auto' waehlt die zur UI-Sprache passende Liste; gibt es keine, faellt die
 * Auswahl sichtbar auf die EFF-Langliste (Englisch, 7776 Woerter) zurueck.
 */

export interface WordlistInfo {
  id: string
  /** Anzeigename (Eigenname, nicht uebersetzt) */
  label: string
  file: string
  /** Erwartete Wortanzahl (Integritaets-Check beim Laden) */
  size: number
  /** UI-Sprachen, fuer die diese Liste die Muttersprach-Wahl ist */
  languages: string[]
}

export const WORDLISTS: WordlistInfo[] = [
  {
    id: 'eff-en',
    label: 'EFF Large Wordlist (English)',
    file: 'eff-en.txt',
    size: 7776,
    languages: ['en'],
  },
  {
    id: 'de',
    label: 'Deutsche Diceware-Liste (dys2p)',
    file: 'de.txt',
    size: 7776,
    languages: ['de'],
  },
]

export function resolveListId(preferred: string, uiLang: string): string {
  if (preferred !== 'auto' && WORDLISTS.some((w) => w.id === preferred)) return preferred
  const match = WORDLISTS.find((w) => w.languages.includes(uiLang))
  return match ? match.id : 'eff-en'
}

export function wordlistInfo(id: string): WordlistInfo {
  return WORDLISTS.find((w) => w.id === id) ?? WORDLISTS[0]
}

const cache = new Map<string, Promise<string[]>>()

export function loadWordlist(id: string): Promise<string[]> {
  const info = wordlistInfo(id)
  const cached = cache.get(info.id)
  if (cached) return cached

  const promise = (async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}wordlists/${info.file}`)
    if (!res.ok) throw new Error(`Wortliste ${info.id} nicht ladbar (${res.status})`)
    const words = (await res.text())
      .split('\n')
      .map((w) => w.trim())
      .filter(Boolean)
    // Integritaets-Check: eine verstuemmelte Liste wuerde die ausgewiesene
    // Entropie verfaelschen — dann lieber harter Fehler.
    if (words.length !== info.size) {
      throw new Error(`Wortliste ${info.id}: ${words.length} statt ${info.size} Woerter`)
    }
    return words
  })()

  cache.set(info.id, promise)
  promise.catch(() => cache.delete(info.id)) // Fehlversuche nicht einfrieren
  return promise
}
