/**
 * Prueft alle Sprachdateien gegen die deutsche Referenz:
 *  - JSON parsebar?
 *  - Schluessel-Paritaet (fehlende/ueberzaehlige Schluessel; Plural-Suffixe
 *    _zero/_one/_two/_few/_many/_other gelten als Varianten desselben Schluessels)
 *  - Platzhalter-Paritaet ({{s}}, {{bits}} …)
 * Aufruf: node tools/check-locales.mjs [lng ...]   (ohne Argumente: alle)
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const localesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'locales')
const NAMESPACES = ['common', 'transparency']
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object') flatten(value, path, out)
    else out[path] = String(value)
  }
  return out
}

/** Plural-Varianten auf einen Basis-Schluessel normalisieren. */
function baseKeys(flat) {
  return new Set(Object.keys(flat).map((k) => k.replace(PLURAL_SUFFIX, '')))
}

function placeholders(s) {
  return [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort().join(',')
}

const requested = process.argv.slice(2)
const langs = (requested.length ? requested : readdirSync(localesDir)).filter(
  (l) => l !== 'de',
)

let problems = 0
for (const lng of langs) {
  for (const ns of NAMESPACES) {
    const refPath = join(localesDir, 'de', `${ns}.json`)
    const path = join(localesDir, lng, `${ns}.json`)
    if (!existsSync(path)) {
      console.error(`FEHLT: ${lng}/${ns}.json`)
      problems++
      continue
    }
    let ref, data
    try {
      ref = flatten(JSON.parse(readFileSync(refPath, 'utf8')))
      data = flatten(JSON.parse(readFileSync(path, 'utf8')))
    } catch (e) {
      console.error(`PARSE-FEHLER: ${lng}/${ns}.json – ${e.message}`)
      problems++
      continue
    }
    const refBase = baseKeys(ref)
    const dataBase = baseKeys(data)
    for (const k of refBase) {
      if (!dataBase.has(k)) {
        console.error(`FEHLENDER SCHLUESSEL: ${lng}/${ns} → ${k}`)
        problems++
      }
    }
    for (const k of dataBase) {
      if (!refBase.has(k)) {
        console.error(`UEBERZAEHLIGER SCHLUESSEL: ${lng}/${ns} → ${k}`)
        problems++
      }
    }
    // Platzhalter: fuer jeden exakt uebereinstimmenden Schluessel vergleichen
    for (const [k, v] of Object.entries(data)) {
      const refVal = ref[k] ?? ref[k.replace(PLURAL_SUFFIX, '_other')] ?? ref[k.replace(PLURAL_SUFFIX, '_one')]
      if (refVal !== undefined && placeholders(refVal) !== placeholders(v)) {
        console.error(
          `PLATZHALTER-ABWEICHUNG: ${lng}/${ns} → ${k} (erwartet: ${placeholders(refVal) || '–'}, gefunden: ${placeholders(v) || '–'})`,
        )
        problems++
      }
    }
  }
}

if (problems === 0) {
  console.log(`OK: ${langs.join(', ') || '(keine)'} – alle Schluessel und Platzhalter stimmen.`)
} else {
  console.error(`${problems} Problem(e) gefunden.`)
  process.exit(1)
}
