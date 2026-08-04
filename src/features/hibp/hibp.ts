/**
 * HaveIBeenPwned-Leak-Check per k-Anonymity.
 *
 * SICHERHEITSKRITISCH — Datenschutz-Garantien dieses Moduls:
 *  1. Wird NUR aufgerufen, wenn die Nutzerin den Check in den Einstellungen
 *     aktiviert hat (Opt-in, Standard AUS). Im Standardzustand macht die App
 *     keinerlei externe Requests.
 *  2. Der SHA-1-Hash des Passworts wird LOKAL gebildet (Web Crypto
 *     subtle.digest). Nur die ERSTEN 5 Hex-Zeichen des Hashs gehen an
 *     https://api.pwnedpasswords.com/range/{prefix} — das sind 2^-20 des
 *     Hashraums, dahinter stehen jeweils Hunderte Kandidaten.
 *  3. Die Antwort (alle Hash-Suffixe dieses Praefix-Bereichs) wird lokal mit
 *     unserem Suffix verglichen. Passwort und voller Hash verlassen das
 *     Geraet NIE. Zusaetzlich fordern wir per Add-Padding-Header
 *     verrauschte Antwortgroessen an, damit auch die Antwortlaenge nichts
 *     verraet.
 */

export const HIBP_API_BASE = 'https://api.pwnedpasswords.com/range/'

/** SHA-1 lokal bilden und in Praefix (5 Hex-Zeichen) + Suffix (35) teilen. */
export async function sha1PrefixSuffix(
  password: string,
): Promise<{ prefix: string; suffix: string }> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-1', data)
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  return { prefix: hex.slice(0, 5), suffix: hex.slice(5) }
}

/** Baut die Range-URL. Nimmt bewusst NUR den 5-Zeichen-Praefix entgegen. */
export function buildRangeUrl(prefix: string): string {
  if (!/^[0-9A-F]{5}$/.test(prefix)) {
    throw new Error('HIBP: Praefix muss exakt 5 Hex-Zeichen sein.')
  }
  return HIBP_API_BASE + prefix
}

/**
 * Prueft ein Passwort gegen HIBP. Rueckgabe: Anzahl bekannter Leaks (0 = kein
 * Treffer). Wirft bei Netzwerk-/HTTP-Fehlern.
 */
export async function checkHibp(password: string, signal?: AbortSignal): Promise<number> {
  const { prefix, suffix } = await sha1PrefixSuffix(password)
  const res = await fetch(buildRangeUrl(prefix), {
    signal,
    headers: { 'Add-Padding': 'true' },
  })
  if (!res.ok) throw new Error(`HIBP: HTTP ${res.status}`)
  const text = await res.text()
  for (const line of text.split('\n')) {
    const [candidate, count] = line.trim().split(':')
    if (candidate === suffix) {
      const n = Number.parseInt(count ?? '0', 10)
      // Add-Padding fuellt mit ":0"-Eintraegen auf — 0 Treffer = kein Leak.
      return Number.isFinite(n) ? n : 0
    }
  }
  return 0
}
