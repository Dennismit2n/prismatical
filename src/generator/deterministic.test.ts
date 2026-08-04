import { describe, expect, it } from 'vitest'
import { deriveDeterministicPassword } from './deterministic'
import { buildSets, DEFAULT_PASSWORD_OPTIONS } from './password'

const input = { master: 'korrekt-pferd-batterie', site: 'example.com', login: 'dennis', counter: 1 }
const options = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  special: true,
  specialChars: '!@#$%^&*',
}

describe('Deterministischer Modus (PBKDF2)', () => {
  it('gleiche Eingaben ⇒ exakt gleiches Passwort', async () => {
    const a = await deriveDeterministicPassword(input, options)
    const b = await deriveDeterministicPassword(input, options)
    expect(a.value).toBe(b.value)
    expect(a.value).toHaveLength(20)
  })

  it('jede Eingabeaenderung (auch nur der Zaehler) aendert das Ergebnis', async () => {
    const base = await deriveDeterministicPassword(input, options)
    for (const variant of [
      { ...input, counter: 2 },
      { ...input, site: 'example.org' },
      { ...input, login: 'denise' },
      { ...input, master: 'korrekt-pferd-batterie!' },
    ]) {
      const other = await deriveDeterministicPassword(variant, options)
      expect(other.value).not.toBe(base.value)
    }
  })

  it('Feldtrenner verhindert Kollisionen bei verschobenen Grenzen', async () => {
    const a = await deriveDeterministicPassword({ ...input, site: 'ab', login: 'c' }, options)
    const b = await deriveDeterministicPassword({ ...input, site: 'a', login: 'bc' }, options)
    expect(a.value).not.toBe(b.value)
  })

  it('nutzt nur Zeichen aus dem gewaehlten Alphabet', async () => {
    const { value } = await deriveDeterministicPassword(input, options)
    const sets = buildSets({ ...DEFAULT_PASSWORD_OPTIONS, ...options })
    for (const ch of value) expect(sets.all).toContain(ch)
  })

  it('traegt den Kein-Recovery-Warnhinweis', async () => {
    const r = await deriveDeterministicPassword(input, options)
    expect(r.warnings).toContain('deterministicNoRecovery')
  })
})
