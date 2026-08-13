import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Content-Security-Policy (nur im Production-Build injiziert).
 *
 * Warum nicht auch im Dev-Modus: Vite injiziert waehrend der Entwicklung
 * Styles ueber <style>-Elemente (HMR) — das wuerde `style-src 'self'` brechen.
 * Der Production-Build hat ausschliesslich externe Assets, keine Inline-Skripte
 * und keine Inline-Styles, daher kommt er ohne 'unsafe-inline' und ohne Nonces aus.
 *
 * connect-src: api.pwnedpasswords.com steht hier, weil eine Meta-CSP zur Laufzeit
 * nicht umschaltbar ist. Ob die App dorthin verbindet, entscheidet ausschliesslich
 * das HIBP-Opt-in im Code (Standard: AUS, kein einziger externer Request).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://api.pwnedpasswords.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join('; ')

function cspPlugin(): Plugin {
  return {
    name: 'prisma-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

export default defineConfig({
  // GitHub Pages Projekt-Seite: https://dennismit2n.github.io/prismatical/
  base: '/prismatical/',
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      // Service Worker aktualisiert sich selbst, sobald ein neuer Build online ist.
      registerType: 'autoUpdate',
      // Registrierung passiert in main.tsx ueber das virtuelle Modul —
      // so landet kein Inline-Skript im HTML (CSP!).
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        id: '/prismatical/',
        name: 'Prismatical – Passwort-Generator',
        short_name: 'Prismatical',
        description:
          'Passwort-Generator mit Live-Stärke-Spektrum. 100 % offline, ohne Tracking – deine Passwörter bleiben auf deinem Gerät.',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#1c1b1f',
        theme_color: '#1c1b1f',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Kompletter App-Shell-Precache inkl. aller Sprach-JSONs und Wortlisten:
        // echtes Offline-First, nichts wird zur Laufzeit aus dem Netz nachgeladen.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,json,txt}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  server: { port: 5199 },
  preview: { port: 5199 },
  build: {
    // zxcvbn-Woerterbuecher sind bewusst eigene Lazy-Chunks; 1 MB-Warnung waere Rauschen.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
