"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LANG_AUTO_SELECT_VALUE,
  LANG_STORAGE_KEY,
  googleCodeFor,
  googleLangToSiteLang,
  isSiteLangCode,
  preferredBrowserGoogleLang,
  siteLanguages,
  type SiteLangCode,
} from "@/config/languages";
import { cn } from "@/lib/utils";

function cookieRootDomain(hostname: string): string | null {
  if (!hostname.includes(".")) return null;
  const parts = hostname.split(".");
  if (parts.length < 2) return null;
  return `.${parts.slice(-2).join(".")}`;
}

function clearGoogTransCookies() {
  const host = window.location.hostname;
  const expire = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=; expires=${expire}; path=/`;
  const root = cookieRootDomain(host);
  if (root) {
    document.cookie = `googtrans=; expires=${expire}; path=/; domain=${root}`;
  }
}

function setGoogTransCookie(googleTarget: string) {
  const value = `/en/${googleTarget}`;
  const maxAge = "; max-age=31536000; SameSite=Lax";
  document.cookie = `googtrans=${value}; path=/${maxAge}`;
  const root = cookieRootDomain(window.location.hostname);
  if (root) {
    document.cookie = `googtrans=${value}; path=/; domain=${root}${maxAge}`;
  }
}

function browserGoogleLang(): string {
  if (typeof window === "undefined") return "en";
  if (window.__SEAPS_GOOGLE_LANG__) return window.__SEAPS_GOOGLE_LANG__;
  return preferredBrowserGoogleLang();
}

function displayNameForGoogleLang(code: string): string {
  try {
    const dn = new Intl.DisplayNames([code, "en"], { type: "language" });
    return dn.of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

type LanguageSwitcherState = {
  selectValue: string;
  autoGoogle: string;
  onChange: (next: string) => void;
};

const LanguageSwitcherContext = createContext<LanguageSwitcherState | null>(null);

function useLanguageSwitcherState(): LanguageSwitcherState {
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
  const selectValue = manual ?? autoAsSite ?? LANG_AUTO_SELECT_VALUE;

  const onChange = (next: string) => {
    if (next === LANG_AUTO_SELECT_VALUE) {
      setManual(null);
      try {
        localStorage.removeItem(LANG_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      const google = preferredBrowserGoogleLang();
      if (google === "en") {
        clearGoogTransCookies();
      } else {
        setGoogTransCookie(google);
      }
      window.location.reload();
      return;
    }

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

  return { selectValue, autoGoogle, onChange };
}

export function LanguageSwitcherProvider({ children }: { children: ReactNode }) {
  const state = useLanguageSwitcherState();
  return (
    <LanguageSwitcherContext.Provider value={state}>{children}</LanguageSwitcherContext.Provider>
  );
}

function useLanguageSwitcherContext(): LanguageSwitcherState {
  const ctx = useContext(LanguageSwitcherContext);
  if (!ctx) {
    throw new Error("LanguageSwitcherSelect must be used within LanguageSwitcherProvider");
  }
  return ctx;
}

function LanguageSelect({
  id,
  className,
  selectValue,
  autoGoogle,
  onChange,
}: {
  id: string;
  className?: string;
} & LanguageSwitcherState) {
  const autoLabel =
    autoGoogle === "en"
      ? "Auto · browser (English)"
      : `Auto · ${displayNameForGoogleLang(autoGoogle)}`;

  return (
    <label htmlFor={id} className={cn("notranslate inline-flex items-center", className)}>
      <span className="sr-only">Language</span>
      <select
        id={id}
        className="h-10 max-w-[11.5rem] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
        value={selectValue}
        aria-label="Language"
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={LANG_AUTO_SELECT_VALUE}>{autoLabel}</option>
        {siteLanguages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LanguageSwitcherSelect({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const state = useLanguageSwitcherContext();
  return <LanguageSelect id={id} className={className} {...state} />;
}

/** Standalone switcher (single instance, own state). */
export function LanguageSwitcher({ className }: { className?: string }) {
  const state = useLanguageSwitcherState();
  const uid = useId();
  return <LanguageSelect id={`${uid}-lang`} className={className} {...state} />;
}
