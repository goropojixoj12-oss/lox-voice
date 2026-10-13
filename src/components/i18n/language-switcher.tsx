"use client";

import { useEffect, useState } from "react";
import {
  LANG_STORAGE_KEY,
  isSiteLangCode,
  mapBrowserToSiteLang,
  siteLanguages,
  type SiteLangCode,
} from "@/config/languages";
import { cn } from "@/lib/utils";

function resolveInitialLang(): SiteLangCode {
  if (typeof window === "undefined") return "en";
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isSiteLangCode(stored)) return stored;
  } catch {
    /* ignore */
  }
  if (isSiteLangCode(window.__SEAPS_LANG__)) return window.__SEAPS_LANG__;
  return mapBrowserToSiteLang(
    navigator.languages?.[0] || navigator.language || "en",
  );
}

function htmlLangFor(code: SiteLangCode): string {
  if (code === "zh") return "zh-CN";
  return code;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState<SiteLangCode>("en");

  useEffect(() => {
    const initial = resolveInitialLang();
    setLang(initial);
    document.documentElement.lang = htmlLangFor(initial);
  }, []);

  const onChange = (next: SiteLangCode) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = htmlLangFor(next);
    window.__SEAPS_LANG__ = next;
    // Reload so server-rendered copy and client trees stay in sync with preference.
    window.location.reload();
  };

  return (
    <label className={cn("notranslate inline-flex items-center", className)}>
      <span className="sr-only">Language</span>
      <select
        id="lang"
        className="h-10 max-w-[9.5rem] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
        value={lang}
        aria-label="Language"
        onChange={(e) => onChange(e.target.value as SiteLangCode)}
      >
        {siteLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
