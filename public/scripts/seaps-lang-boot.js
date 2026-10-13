/**
 * Runs before paint: pick language (manual override or browser/OS)
 * and set googtrans so Google Translate can apply immediately.
 */
(function () {
  var KEY = "seaps-lang";
  var SOURCE = "en";

  function mapBrowser(locale) {
    if (!locale) return "en";
    var l = String(locale).toLowerCase();
    if (l.indexOf("km") === 0) return "km";
    if (l.indexOf("zh") === 0) return "zh-CN";
    if (l.indexOf("ja") === 0) return "ja";
    if (l.indexOf("en") === 0) return "en";
    return "en";
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

  function clearGoogTrans() {
    var host = location.hostname;
    var expire = "Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "googtrans=; expires=" + expire + "; path=/";
    document.cookie = "googtrans=; expires=" + expire + "; path=/; domain=" + host;
    if (host.indexOf(".") !== -1) {
      document.cookie =
        "googtrans=; expires=" + expire + "; path=/; domain=." + host.replace(/^www\./, "");
    }
  }

  function setGoogTrans(target) {
    var value = "/" + SOURCE + "/" + target;
    var maxAge = "; max-age=31536000";
    var host = location.hostname;
    document.cookie = "googtrans=" + value + "; path=/" + maxAge;
    document.cookie = "googtrans=" + value + "; path=/; domain=" + host + maxAge;
    if (host.indexOf(".") !== -1) {
      document.cookie =
        "googtrans=" +
        value +
        "; path=/; domain=." +
        host.replace(/^www\./, "") +
        maxAge;
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
    googleLang = mapBrowser(nav);
    window.__SEAPS_LANG__ =
      googleLang === "zh-CN" ? "zh" : googleLang === "en" ? "en" : googleLang;
  }

  if (!googleLang || googleLang === "en") {
    clearGoogTrans();
  } else {
    setGoogTrans(googleLang);
  }
})();
