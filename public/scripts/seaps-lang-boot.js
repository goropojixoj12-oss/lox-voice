/**
 * Local-only language boot (no external network).
 * Picks manual override or browser/OS locale among supported site languages.
 */
(function () {
  var KEY = "seaps-lang";
  var supported = { en: 1, km: 1, zh: 1, ja: 1 };

  function mapBrowser(locale) {
    if (!locale) return "en";
    var l = String(locale).toLowerCase();
    if (l.indexOf("km") === 0) return "km";
    if (l.indexOf("zh") === 0) return "zh";
    if (l.indexOf("ja") === 0) return "ja";
    if (l.indexOf("en") === 0) return "en";
    return "en";
  }

  function readForced() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  var forced = readForced();
  var lang;
  if (forced && supported[forced]) {
    lang = forced;
  } else {
    var nav =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      navigator.userLanguage ||
      "en";
    lang = mapBrowser(nav);
  }

  window.__SEAPS_LANG__ = lang;
  try {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  } catch (e) {
    /* ignore */
  }
})();
