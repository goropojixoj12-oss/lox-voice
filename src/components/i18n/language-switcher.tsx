"use client";

import { useEffect, useState } from "react";
import {
  LANG_STORAGE_KEY,
  googleCodeFor,
  isSiteLangCode,
  mapBrowserToSiteLang,
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

export function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState<SiteLangCode>("en");

  useEffect(() => {
    setLang(resolveInitialLang());
  }, []);

  const onChange = (next: SiteLangCode) => {
    setLang(next);
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

    // Hard reload so every page node is translated consistently.
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
