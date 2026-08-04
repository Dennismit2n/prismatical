/**
 * i18n-Setup: react-i18next + i18next-resources-to-backend.
 * Namespaces werden lazy aus /locales/{lng}/{ns}.json geladen (same-origin,
 * vom Service Worker praecached → offline verfuegbar). fallbackLng: 'de'.
 */

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import resourcesToBackend from 'i18next-resources-to-backend'
import { LANGUAGE_CODES } from './languages'

export async function initI18n(initialLanguage: string): Promise<typeof i18n> {
  await i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend(async (lng: string, ns: string) => {
        const res = await fetch(`${import.meta.env.BASE_URL}locales/${lng}/${ns}.json`)
        if (!res.ok) throw new Error(`i18n: ${lng}/${ns} nicht ladbar (${res.status})`)
        return res.json()
      }),
    )
    .init({
      lng: initialLanguage,
      fallbackLng: 'de',
      supportedLngs: LANGUAGE_CODES,
      ns: ['common'],
      defaultNS: 'common',
      interpolation: { escapeValue: false }, // React escapt selbst
      react: { useSuspense: true },
    })
  return i18n
}

/** Sprache wechseln und <html lang> nachziehen. */
export async function changeLanguage(lng: string): Promise<void> {
  await i18n.changeLanguage(lng)
  document.documentElement.lang = lng
}
