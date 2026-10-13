"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LANG_STORAGE_KEY,
  googleCodeFor,
  googleLangToSiteLang,
  isSiteLangCode,
  mapBrowserToGoogleLang,
  siteLanguages,
  type SiteLangCode,
} from "@/config/languages";
import { cn } from "@/lib/utils";

function clearGoogTransCookies() {
  const host = window.location.hostname;
  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=; expires=${expire}; path=/`;
  document.cookie = `googtrans=; expires=${expire}; path=/; domain=${host}`;
  if (host.includes(".")) {
    document.cookie = `googtrans=; expires=${expire}; path=/; domain=.${host.replace(/^www\./, "")}`;
  }
}

function setGoogTransCookie(googleTarget: string) {
  const value = `/en/${googleTarget}`;
  const maxAge = "; max-age=31536000";
  const host = window.location.hostname;
  document.cookie = `googtrans=${value}; path=/${maxAge}`;
  document.cookie = `googtrans=${value}; path=/; domain=${host}${maxAge}`;
  if (host.includes(".")) {
    document.cookie = `googtrans=${value}; path=/; domain=.${host.replace(/^www\./, "")}${maxAge}`;
  }
}

function browserGoogleLang(): string {
  if (typeof window === "undefined") return "en";
  if (window.__SEAPS_GOOGLE_LANG__) return window.__SEAPS_GOOGLE_LANG__;
  return mapBrowserToGoogleLang(
    navigator.languages?.[0] || navigator.language || "en",
  );
}

function displayNameForGoogleLang(code: string): string {
  try {
    const dn = new Intl.DisplayNames([code, "en"], { type: "language" });
    return dn.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const [manual, setManual] = useState<SiteLangCode | null>(null);
  const [autoGoogle, setAutoGoogle] = useState("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      setManual(isSiteLangCode(stored) ? stored : null);
    } catch {
      setManual(null);
    }
    setAutoGoogle(browserGoogleLang());
  }, []);

  const autoAsSite = useMemo(() => googleLangToSiteLang(autoGoogle), [autoGoogle]);
  const selectValue = manual ?? autoAsSite ?? "__auto__";
  const showAutoOption = !manual && !autoAsSite && autoGoogle !== "en";

  const onChange = (next: string) => {
    if (!isSiteLangCode(next)) return;

    setManual(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }

    if (next === "en") {
      clearGoogTransCookies();
    } else {
      setGoogTransCookie(googleCodeFor(next));
    }

    window.location.reload();
  };

  return (
    <label className={cn("notranslate inline-flex items-center", className)}>
      <span className="sr-only">Language</span>
      <select
        id="lang"
        className="h-10 max-w-[10.5rem] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
        value={selectValue}
        aria-label="Language"
        onChange={(e) => onChange(e.target.value)}
      >
        {showAutoOption ? (
          <option value="__auto__">
            {displayNameForGoogleLang(autoGoogle)}
          </option>
        ) : null}
        {siteLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
