/**
 * Entropie-Berechnung (rohe Kombinatorik).
 *
 * "Rohe" Entropie heisst: Annahme eines Angreifers, der das Verfahren kennt
 * (Alphabet/Wortliste und Laenge), aber jede Kombination durchprobieren muss.
 * zxcvbn liefert daneben die musterbasierte Schaetzung — beide werden in der
 * UI ausgewiesen.
 */

/** Zeichen-Passwoerter: length * log2(alphabetSize). */
export function charEntropyBits(length: number, alphabetSize: number): number {
  if (length <= 0 || alphabetSize <= 1) return 0
  return length * Math.log2(alphabetSize)
}

/** Passphrasen: wordCount * log2(listSize) — z. B. 6 × log2(7776) ≈ 77,5 Bit. */
export function wordEntropyBits(wordCount: number, listSize: number): number {
  if (wordCount <= 0 || listSize <= 1) return 0
  return wordCount * Math.log2(listSize)
}

/** PIN: digits * log2(10). */
export function pinEntropyBits(digits: number): number {
  return charEntropyBits(digits, 10)
}
