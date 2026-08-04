/** PIN-Modus: n-stellige Zufallszahl (fuehrende Nullen erlaubt). */

import { randomDigits } from '../crypto/random'
import { pinEntropyBits } from './entropy'
import { GeneratorError } from './errors'
import type { GeneratorResult, PinOptions } from './types'

export const PIN_MIN = 3
export const PIN_MAX = 12

export const DEFAULT_PIN_OPTIONS: PinOptions = { digits: 6 }

export function generatePin(o: PinOptions): GeneratorResult {
  if (!Number.isInteger(o.digits) || o.digits < PIN_MIN || o.digits > PIN_MAX) {
    throw new GeneratorError('lengthOutOfRange')
  }
  return {
    value: randomDigits(o.digits),
    entropyBits: pinEntropyBits(o.digits),
    poolSize: 10,
    warnings: ['pinEntropy'],
    constrained: false,
  }
}
