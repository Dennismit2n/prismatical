import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildRangeUrl, checkHibp, sha1PrefixSuffix } from './hibp'

// Bekannter Referenzwert: SHA-1("password") = 5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8
const KNOWN_PREFIX = '5BAA6'
const KNOWN_SUFFIX = '1E4C9B93F3F0682250B6CF8331B7EE68FD8'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('HIBP k-Anonymity – es verlaesst NUR der 5-Zeichen-Praefix das Geraet', () => {
  it('sha1PrefixSuffix teilt den lokal gebildeten Hash korrekt', async () => {
    const { prefix, suffix } = await sha1PrefixSuffix('password')
    expect(prefix).toBe(KNOWN_PREFIX)
    expect(suffix).toBe(KNOWN_SUFFIX)
    expect(prefix).toHaveLength(5)
    expect(suffix).toHaveLength(35)
  })

  it('buildRangeUrl akzeptiert ausschliesslich 5 Hex-Zeichen', () => {
    expect(buildRangeUrl('5BAA6')).toBe('https://api.pwnedpasswords.com/range/5BAA6')
    expect(() => buildRangeUrl(KNOWN_PREFIX + KNOWN_SUFFIX)).toThrow()
    expect(() => buildRangeUrl('5BAA')).toThrow()
    expect(() => buildRangeUrl('zzzzz')).toThrow()
  })

  it('checkHibp sendet nur den Praefix, nie Passwort oder vollen Hash', async () => {
    const calls: string[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: RequestInfo | URL) => {
        calls.push(String(url))
        return new Response(`ABCDEF0123456789ABCDEF0123456789ABC:0\n${KNOWN_SUFFIX}:42`, {
          status: 200,
        })
      }),
    )

    const count = await checkHibp('password')
    expect(count).toBe(42)
    expect(calls).toHaveLength(1)
    const url = new URL(calls[0])
    expect(url.href).toBe(`https://api.pwnedpasswords.com/range/${KNOWN_PREFIX}`)
    // Negativ-Garantien: der Pfad enthaelt exakt den Praefix, keine Query,
    // und weder Suffix noch Vollhash. (Ein naiver Substring-Check auf
    // "password" wuerde an der Domain pwnedpasswords.com scheitern.)
    expect(url.pathname).toBe(`/range/${KNOWN_PREFIX}`)
    expect(url.search).toBe('')
    expect(url.href).not.toContain(KNOWN_SUFFIX)
  })

  it('liefert 0, wenn der Suffix nicht in der Antwort steht', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:7', { status: 200 })),
    )
    expect(await checkHibp('password')).toBe(0)
  })

  it('wirft bei HTTP-Fehlern', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })))
    await expect(checkHibp('password')).rejects.toThrow('HIBP')
  })
})
