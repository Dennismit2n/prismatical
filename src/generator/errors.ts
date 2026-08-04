/**
 * Fachliche Generator-Fehler. `code` ist zugleich der i18n-Schluessel
 * (Namespace common, Prefix "errors.").
 */
export type GeneratorErrorCode =
  | 'noClasses'
  | 'emptyAlphabet'
  | 'lengthOutOfRange'
  | 'minDigitsWithoutDigits'
  | 'minSpecialWithoutSpecial'
  | 'minimaExceedLength'
  | 'notEnoughUniqueChars'
  | 'wordlistUnavailable'

export class GeneratorError extends Error {
  readonly code: GeneratorErrorCode

  constructor(code: GeneratorErrorCode) {
    super(`GeneratorError: ${code}`)
    this.name = 'GeneratorError'
    this.code = code
  }
}
