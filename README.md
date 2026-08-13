# Prismatical – Passwort-Generator

**Live: https://dennismit2n.github.io/prismatical/**

Ein Passwort-Generator mit Live-Stärke-Spektrum: Die Akzentfarbe der gesamten
Oberfläche IST die Stärke-Anzeige und wandert mit dem zxcvbn-Score von Rot
(schwach) bis Violett (episch). Installierbare, offline-fähige PWA für Handy
und Desktop. 12 Sprachen, Standardsprache Deutsch.

## Sicherheitsprinzipien

1. **100 % lokal.** Erzeugung, Stärke-Analyse (zxcvbn-ts) und QR-Code laufen
   vollständig auf dem Gerät. Im Standardzustand macht die App **keinerlei
   externe Netzwerk-Requests** – kein Tracking, keine Analytics, keine CDNs.
2. **Kryptografisch sicherer Zufall.** Alle Zufälle stammen aus
   `crypto.getRandomValues()`. `Math.random()` ist per ESLint-Regel verboten.
3. **Kein Modulo-Bias.** Zufallswerte werden per **Rejection-Sampling** auf
   Alphabete abgebildet (Werte ≥ 256 − (256 mod n) bzw. ≥ 2³² − (2³² mod n)
   werden verworfen und neu gezogen). Ein Chi-Quadrat-Test in der Testsuite
   belegt die Gleichverteilung – und dass naives Modulo durchfallen würde.
4. **Nichts wird ungefragt gespeichert.** Passwörter existieren nur im
   Arbeitsspeicher. Der Verlauf ist ein doppeltes Opt-in: erst „aufzeichnen“
   (Sitzung, beim Schließen weg), dann optional „dauerhaft speichern“.
   Jederzeit löschbar. Der deterministische Modus speichert nichts – auch
   nicht Domain oder Login.
5. **Leak-Check nur per Opt-in.** Der optionale HaveIBeenPwned-Check nutzt
   k-Anonymity: SHA-1 wird lokal gebildet, nur die **ersten 5 Hex-Zeichen**
   gehen an `api.pwnedpasswords.com/range/…` (mit Add-Padding). Passwort und
   voller Hash verlassen das Gerät nie.
6. **Strikte CSP.** `default-src 'self'`, keine Inline-Skripte, keine
   Inline-Styles; `connect-src` erlaubt neben `'self'` ausschließlich die
   HIBP-API (deren Nutzung allein das Opt-in im Code steuert).
7. **Clipboard-Auto-Clear.** Nach dem Kopieren wird die Zwischenablage nach
   einstellbarer Zeit (10/20/30/60 s oder nie, Default 30 s) mit sichtbarem
   Countdown überschrieben. Ehrlicher Hinweis in der App: System-Verläufe wie
   Windows Win+V kann eine Web-App nicht garantiert leeren.

## Modi

- **Passwort** – Zeichenklassen, Länge 4–128 (Slider + Zahlenfeld), Ausschluss
  mehrdeutiger Zeichen, „mind. X Ziffern/Sonderzeichen“, „jede Klasse mindestens
  einmal“, „keine Wiederholungen“, anpassbarer Sonderzeichensatz, Ausschlussliste.
- **Passphrase (Diceware)** – EFF-Langliste (7.776 Wörter) + deutsche Liste
  (dys2p, CC0); 3–12 Wörter, Trennzeichen (auch Zufallsziffer), Großschreibung,
  Ziffer/Sonderzeichen einstreuen. Entropie = Wörter × log₂(Listengröße).
- **PIN** – 3–12 Stellen, mit ehrlichem Hinweis zur Sperren-Abhängigkeit.
- **Aussprechbar** – Konsonant-Vokal-Silben, mit sichtbarer Entropie-Warnung.
- **Nutzername** – Adjektiv + Substantiv, optional Leetify und Ziffern.
- **Deterministisch** – LessPass-Prinzip: Master-Passwort + Domain + Login +
  Zähler → reproduzierbares Passwort via PBKDF2-SHA-256 (310.000 Iterationen).
  Deutlicher Hinweis: kein Recovery.

## USP-Features

- **Stärke-Spektrum**: kontinuierliche Akzentfarbe = f(Score, guessesLog10),
  oklch-interpoliert mit sRGB-Fallback; Score immer zusätzlich als Text + Bits
  + Knackzeiten (WCAG 1.4.1).
- **Zeichen-Typ-Färbung** im Ausgabefeld (Buchstaben/Ziffern/Sonderzeichen).
- **Spectrum-Flow**: animierter Regenbogen-Ring (`linear-gradient(in oklch
  longer hue, …)`), respektiert `prefers-reduced-motion`.
- **Website-Regel-Presets** (Standard, NIST-lang, nur Buchstaben+Ziffern,
  max. 16, Bank-typisch) – erweiterbar in `src/features/presets/presets.ts`.
- **Krypto-Transparenz-Panel**: Alphabetgröße, Entropieformel, Zufallsquelle,
  zxcvbn-Details, alle 4 Knackzeit-Szenarien.
- **Merk-Trainer** für Passphrasen (blendet Wörter rundenweise aus, rein lokal).
- **Bulk-Generierung** und **QR-Export** (lokal gerendert).

## Themes

3 Themes × Hell/Dunkel, unabhängig wählbar, `prefers-color-scheme` als Default:

- **Classic Rainbow** – warmes Creme / tiefes Anthrazit, volles Spektrum.
- **Cyber** – Neon-Prisma mit Glow, maximale Sättigung.
- **Aurora** – Nordlicht-Pastell, gedämpfte Chroma.

Alle Farbtoken liegen in `src/styles/themes.css`; die WCAG-AA-Konformität
(Text ≥ 4.5:1, Grafik ≥ 3:1) prüft `node tools/check-contrast.mjs` rechnerisch
für alle 6 Varianten. Text auf Akzentflächen ist zur Laufzeit garantiert
kontrastsicher: `applyAccent()` hebt die Helligkeit an, bis 4.5:1 erreicht ist.

## Entwicklung

```bash
npm install
npm run dev        # Dev-Server (Port 5199)
npm test           # Vitest: Bias-, Regel-, Entropie-, HIBP-, Determinismus-Tests
npm run lint       # ESLint (inkl. Math.random-Verbot)
npm run build      # Produktions-Build inkl. Service Worker (Precache)
node tools/check-locales.mjs    # Schlüssel-/Platzhalter-Parität aller 12 Sprachen
node tools/check-contrast.mjs   # WCAG-Kontraste aller 6 Theme-Varianten
```

Stack: Vite + React + TypeScript (strict) · vite-plugin-pwa (Workbox,
`autoUpdate`, kompletter Offline-Precache) · zustand · react-i18next mit lazy
geladenen Namespaces · @zxcvbn-ts/core 4 (klassenbasierte API, Sprachpakete
lazy; ru/zh fallen dokumentiert auf en zurück).

## Lizenz-Hinweise

- EFF Large Wordlist: CC-BY 3.0, © Electronic Frontier Foundation.
- Deutsche Diceware-Liste: CC0, dys2p (`wordlists-de`).
