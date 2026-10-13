export const SITE_SOURCE_LANG = "en" as const;

declare global {
  interface Window {
    __SEAPS_LANG__?: string;
  }
}

/** Manual site language versions (header picker). */
export const siteLanguages = [
  { code: "en", label: "English", short: "EN" },
  { code: "km", label: "ខ្មែរ", short: "KH" },
  { code: "zh", label: "中文", short: "中文" },
  { code: "ja", label: "日本語", short: "JP" },
] as const;

export type SiteLangCode = (typeof siteLanguages)[number]["code"];

export const LANG_STORAGE_KEY = "seaps-lang";

export function isSiteLangCode(value: string | null | undefined): value is SiteLangCode {
  return siteLanguages.some((l) => l.code === value);
}

/** Map browser / system locale to one of the four local site languages. */
export function mapBrowserToSiteLang(locale: string | undefined | null): SiteLangCode {
  if (!locale) return "en";
  const l = locale.toLowerCase();
  if (l.startsWith("km")) return "km";
  if (l.startsWith("zh")) return "zh";
  if (l.startsWith("ja")) return "ja";
  if (l.startsWith("en")) return "en";
  return "en";
}
