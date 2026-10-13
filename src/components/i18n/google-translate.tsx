"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LANG_STORAGE_KEY,
  SITE_SOURCE_LANG,
  googleCodeFor,
  isSiteLangCode,
  mapBrowserToSiteLang,
  siteLanguages,
  type SiteLangCode,
} from "@/config/languages";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: Record<string, unknown>,
          elementId: string,
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
    __SEAPS_LANG__?: string;
  }
}

const included = siteLanguages.map((l) => l.google).join(",");

function resolveLang(): SiteLangCode {
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

function applyGoogleCombo(siteLang: SiteLangCode) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;
  const target = siteLang === "en" ? SITE_SOURCE_LANG : googleCodeFor(siteLang);
  if (combo.value === target) return true;
  combo.value = target;
  combo.dispatchEvent(new Event("change"));
  return true;
}

/**
 * Invisible Google Website Translator.
 * UI chrome is fully CSS-hidden; language is driven by googtrans + our picker.
 */
export function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: SITE_SOURCE_LANG,
          includedLanguages: included,
          autoDisplay: false,
          multilanguagePage: true,
        },
        "google_translate_element",
      );
      // Apply after gadget mounts.
      window.setTimeout(() => applyGoogleCombo(resolveLang()), 0);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, []);

  // Re-apply on every client route so SPA pages stay translated.
  useEffect(() => {
    const lang = resolveLang();
    if (lang === "en") return;

    let tries = 0;
    const tick = () => {
      tries += 1;
      if (applyGoogleCombo(lang) || tries > 20) return;
      window.setTimeout(tick, 50);
    };
    tick();
  }, [pathname]);

  return (
    <>
      <div
        id="google_translate_element"
        className="seaps-gt-host"
        aria-hidden="true"
        tabIndex={-1}
      />
      <Script
        id="google-translate-api"
        src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
    </>
  );
}
