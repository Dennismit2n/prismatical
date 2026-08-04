/**
 * Username-Generator: Adjektiv + Substantiv (+ optional 2 Ziffern),
 * optional "leetified". Lokale, neutrale Wortlisten — keine Netz-Zugriffe.
 */

import { pickItem, randomDigits } from '../crypto/random'
import type { GeneratorResult, UsernameOptions } from './types'

const ADJECTIVES = [
  'agile', 'amber', 'aqua', 'arctic', 'atomic', 'azure', 'bold', 'brave',
  'bright', 'bronze', 'calm', 'chill', 'clever', 'cobalt', 'coral', 'cosmic',
  'crimson', 'curious', 'daring', 'deep', 'dusty', 'eager', 'electric', 'epic',
  'fancy', 'fast', 'fearless', 'fluffy', 'frosty', 'gentle', 'gold', 'grand',
  'happy', 'hidden', 'humble', 'indigo', 'ivory', 'jade', 'jolly', 'keen',
  'lively', 'lucky', 'lunar', 'magic', 'mellow', 'mighty', 'misty', 'neon',
  'nimble', 'noble', 'olive', 'onyx', 'polar', 'proud', 'quick', 'quiet',
  'rapid', 'royal', 'ruby', 'rustic', 'scarlet', 'sharp', 'silent', 'silver',
  'sleek', 'smart', 'solar', 'sonic', 'stellar', 'stormy', 'sunny', 'swift',
  'teal', 'tidal', 'tiny', 'topaz', 'turbo', 'velvet', 'vivid', 'wild',
  'wise', 'witty', 'zesty', 'zippy',
] as const

const NOUNS = [
  'anchor', 'archer', 'badger', 'beacon', 'bison', 'breeze', 'canyon', 'cedar',
  'comet', 'compass', 'condor', 'coyote', 'crane', 'crystal', 'cypress', 'delta',
  'dolphin', 'dragon', 'eagle', 'ember', 'falcon', 'fern', 'finch', 'fjord',
  'flame', 'forest', 'fox', 'galaxy', 'glacier', 'harbor', 'hawk', 'heron',
  'horizon', 'island', 'jaguar', 'koala', 'lagoon', 'lantern', 'lark', 'lemur',
  'lynx', 'maple', 'meadow', 'meteor', 'moose', 'nebula', 'ocean', 'orbit',
  'orca', 'otter', 'owl', 'panda', 'panther', 'pebble', 'penguin', 'phoenix',
  'pine', 'prism', 'puffin', 'quartz', 'raven', 'reef', 'ridge', 'river',
  'robin', 'rocket', 'sequoia', 'sparrow', 'spruce', 'summit', 'thunder', 'tiger',
  'trail', 'tundra', 'valley', 'viper', 'walrus', 'willow', 'wolf', 'zephyr',
] as const

// Klassische Leet-Ersetzungen; bewusst klein gehalten, damit Namen lesbar bleiben.
const LEET_MAP: Record<string, string> = {
  a: '4',
  e: '3',
  i: '1',
  o: '0',
  s: '5',
  t: '7',
}

export const DEFAULT_USERNAME_OPTIONS: UsernameOptions = {
  style: 'camel',
  leetify: false,
  appendDigits: true,
}

function leetify(word: string): string {
  return [...word].map((c) => LEET_MAP[c.toLowerCase()] ?? c).join('')
}

export function generateUsername(o: UsernameOptions): GeneratorResult {
  let adj = pickItem(ADJECTIVES) as string
  let noun = pickItem(NOUNS) as string

  if (o.style === 'camel') {
    adj = adj.charAt(0).toUpperCase() + adj.slice(1)
    noun = noun.charAt(0).toUpperCase() + noun.slice(1)
  }
  if (o.leetify) {
    adj = leetify(adj)
    noun = leetify(noun)
  }

  let value = adj + noun
  let bits = Math.log2(ADJECTIVES.length) + Math.log2(NOUNS.length)
  if (o.appendDigits) {
    value += randomDigits(2)
    bits += 2 * Math.log2(10)
  }

  // Leetify ist eine deterministische Abbildung — kein Entropiegewinn.
  return {
    value,
    entropyBits: bits,
    poolSize: ADJECTIVES.length * NOUNS.length,
    warnings: ['usernamePurpose'],
    constrained: false,
  }
}
