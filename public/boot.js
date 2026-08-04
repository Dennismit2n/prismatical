/*
 * Boot-Skript: laeuft synchron im <head>, bevor irgendetwas gerendert wird.
 * Liest die gespeicherten Einstellungen und setzt Theme, Hell/Dunkel und Sprache
 * auf <html>, damit es beim Laden nicht hell aufblitzt (FOUC).
 *
 * Bewusst eine eigene Datei statt Inline-Skript: die CSP des Builds erlaubt
 * nur `script-src 'self'`.
 */
(function () {
  var root = document.documentElement;
  var theme = 'classic';
  var scheme = 'system';
  try {
    var raw = localStorage.getItem('prisma.settings');
    if (raw) {
      var parsed = JSON.parse(raw);
      var state = parsed && parsed.state ? parsed.state : parsed;
      if (state) {
        if (typeof state.theme === 'string') theme = state.theme;
        if (typeof state.scheme === 'string') scheme = state.scheme;
        if (typeof state.language === 'string') root.lang = state.language;
      }
    }
  } catch (e) {
    /* kaputte Einstellungen ignorieren – Defaults gelten */
  }
  if (scheme !== 'light' && scheme !== 'dark') {
    scheme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  root.dataset.theme = theme;
  root.dataset.scheme = scheme;
})();
