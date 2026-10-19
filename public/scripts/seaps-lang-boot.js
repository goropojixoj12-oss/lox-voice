/**
 * Runs before paint: manual menu override OR any browser/OS language,
 * then set googtrans so Google Translate can apply immediately.
 */
(function () {
  var KEY = "seaps-lang";
  var SOURCE = "en";

  /** Any locale → Google Translate code (ru, fr, th, zh-CN, …). */
  function mapBrowserToGoogle(locale) {
    if (!locale) return "en";
    var raw = String(locale).replace(/_/g, "-");
    var lower = raw.toLowerCase();

    if (lower === "zh" || lower.indexOf("zh-cn") === 0 || lower.indexOf("hans") !== -1) {
      return "zh-CN";
    }
    if (
      lower.indexOf("zh-tw") === 0 ||
      lower.indexOf("zh-hk") === 0 ||
      lower.indexOf("hant") !== -1
    ) {
      return "zh-TW";
    }
    if (lower.indexOf("pt-br") === 0) return "pt";
    if (lower.indexOf("nb") === 0 || lower.indexOf("nn") === 0 || lower === "no") return "no";

    var primary = lower.split("-")[0] || "en";
    var aliases = { he: "iw", jv: "jw", nb: "no", nn: "no" };
    return aliases[primary] || primary;
  }

  function siteToGoogle(code) {
    if (code === "zh") return "zh-CN";
    if (code === "km") return "km";
    if (code === "ja") return "ja";
    return "en";
  }

  function readForced() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function cookieRootDomain(hostname) {
    if (hostname.indexOf(".") === -1) return null;
    var parts = hostname.split(".");
    if (parts.length < 2) return null;
    return "." + parts.slice(-2).join(".");
  }

  function clearGoogTrans() {
    var expire = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "googtrans=; expires=" + expire + "; path=/";
    var root = cookieRootDomain(location.hostname);
    if (root) {
      document.cookie = "googtrans=; expires=" + expire + "; path=/; domain=" + root;
    }
  }

  function setGoogTrans(target) {
    var value = "/" + SOURCE + "/" + target;
    var maxAge = "; max-age=31536000; SameSite=Lax";
    document.cookie = "googtrans=" + value + "; path=/" + maxAge;
    var root = cookieRootDomain(location.hostname);
    if (root) {
      document.cookie = "googtrans=" + value + "; path=/; domain=" + root + maxAge;
    }
  }

  var forced = readForced();
  var googleLang;

  if (forced === "en" || forced === "km" || forced === "zh" || forced === "ja") {
    googleLang = siteToGoogle(forced);
    window.__SEAPS_LANG__ = forced;
  } else {
    var nav =
      (navigator.languages && navigator.languages[0]) ||
      navigator.language ||
      navigator.userLanguage ||
      "en";
    googleLang = mapBrowserToGoogle(nav);
    window.__SEAPS_LANG__ = "auto";
  }

  window.__SEAPS_GOOGLE_LANG__ = googleLang;

  if (!googleLang || googleLang === "en") {
    clearGoogTrans();
  } else {
    setGoogTrans(googleLang);
  }

  try {
    document.documentElement.lang =
      googleLang === "zh-CN" ? "zh-CN" : googleLang === "en" ? "en" : googleLang;
  } catch (e) {
    /* ignore */
  }
})();
