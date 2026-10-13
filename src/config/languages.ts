export const SITE_SOURCE_LANG = "en" as const;

declare global {
  interface Window {
    __SEAPS_LANG__?: string;
    __SEAPS_GOOGLE_LANG__?: string;
  }
}

/** Manual site language versions (header picker only). */
export const siteLanguages = [
  { code: "en", label: "English", short: "EN", google: "en" },
  { code: "km", label: "ខ្មែរ", short: "KH", google: "km" },
  { code: "zh", label: "中文", short: "中文", google: "zh-CN" },
  { code: "ja", label: "日本語", short: "JP", google: "ja" },
] as const;

export type SiteLangCode = (typeof siteLanguages)[number]["code"];

export const LANG_STORAGE_KEY = "seaps-lang";

export function googleCodeFor(siteCode: SiteLangCode): string {
  const row = siteLanguages.find((l) => l.code === siteCode);
  return row?.google ?? "en";
}

export function isSiteLangCode(value: string | null | undefined): value is SiteLangCode {
  return siteLanguages.some((l) => l.code === value);
}

/**
 * Map any browser/OS locale to a Google Translate language code.
 * Not limited to the four menu languages.
 */
export function mapBrowserToGoogleLang(locale: string | undefined | null): string {
  if (!locale) return "en";
  const raw = locale.replace(/_/g, "-");
  const lower = raw.toLowerCase();

  if (lower === "zh" || lower.startsWith("zh-cn") || lower.includes("hans")) return "zh-CN";
  if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower.includes("hant")) {
    return "zh-TW";
  }
  if (lower.startsWith("pt-br")) return "pt";
  if (lower.startsWith("nb") || lower.startsWith("nn") || lower === "no") return "no";

  const primary = lower.split("-")[0] ?? "en";
  const aliases: Record<string, string> = {
    he: "iw",
    jv: "jw",
    nb: "no",
    nn: "no",
  };
  return aliases[primary] ?? primary;
}

/** If a Google code matches one of the four menu entries, return that site code. */
export function googleLangToSiteLang(google: string): SiteLangCode | null {
  const g = google.toLowerCase();
  if (g === "en") return "en";
  if (g === "km") return "km";
  if (g === "zh-cn" || g === "zh") return "zh";
  if (g === "ja") return "ja";
  return null;
}

/** Active Google target: manual menu choice wins, otherwise browser/OS locale. */
export function resolveGoogleTargetLang(): string {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isSiteLangCode(stored)) return googleCodeFor(stored);
  } catch {
    /* ignore */
  }
  if (typeof window.__SEAPS_GOOGLE_LANG__ === "string" && window.__SEAPS_GOOGLE_LANG__) {
    return window.__SEAPS_GOOGLE_LANG__;
  }
  return mapBrowserToGoogleLang(
    navigator.languages?.[0] || navigator.language || "en",
  );
}
