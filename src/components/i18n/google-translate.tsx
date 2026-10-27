"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { SITE_SOURCE_LANG, resolveGoogleTargetLang } from "@/config/languages";

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
    __SEAPS_GOOGLE_LANG__?: string;
  }
}

function applyGoogleCombo(googleLang: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return false;

  if (!googleLang || googleLang === "en") {
    const original =
      Array.from(combo.options).find((o) => o.value === "")?.value ??
      Array.from(combo.options).find((o) => o.value === SITE_SOURCE_LANG)?.value ??
      "";
    if (combo.value === original) return true;
    combo.value = original;
    combo.dispatchEvent(new Event("change"));
    return true;
  }

  const hasOption = Array.from(combo.options).some((o) => o.value === googleLang);
  if (!hasOption) {
    const opt = document.createElement("option");
    opt.value = googleLang;
    opt.text = googleLang;
    combo.appendChild(opt);
  }

  if (combo.value === googleLang) return true;
  combo.value = googleLang;
  combo.dispatchEvent(new Event("change"));
  return true;
}

function scheduleApplyGoogleLang(googleLang: string) {
  let tries = 0;
  const tick = () => {
    tries += 1;
    if (applyGoogleCombo(googleLang) || tries > 40) return;
    window.setTimeout(tick, 50);
  };
  tick();
  window.setTimeout(() => applyGoogleCombo(googleLang), 350);
  window.setTimeout(() => applyGoogleCombo(googleLang), 900);
}

/**
 * Invisible Google Website Translator — all languages enabled.
 * Menu (EN/KM/ZH/JA) overrides; otherwise every page follows browser/OS locale.
 */
function isDashboardPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

export function GoogleTranslate() {
  const pathname = usePathname();
  const translateEnabled = !isDashboardPath(pathname);

  useEffect(() => {
    if (!translateEnabled) {
      document.documentElement.classList.add("notranslate");
      document.documentElement.lang = SITE_SOURCE_LANG;
      return () => {
        document.documentElement.classList.remove("notranslate");
      };
    }
    document.documentElement.classList.remove("notranslate");
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) return;
      // No includedLanguages limit → Google can target any language.
      // eslint-disable-next-line no-new
      new window.google.translate.TranslateElement(
        {
          pageLanguage: SITE_SOURCE_LANG,
          autoDisplay: false,
          multilanguagePage: true,
        },
        "google_translate_element",
      );
      window.setTimeout(() => scheduleApplyGoogleLang(resolveGoogleTargetLang()), 0);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, [translateEnabled]);

  // Re-apply on every client route so SPA pages stay translated.
  useEffect(() => {
    if (!translateEnabled) return;

    const lang = resolveGoogleTargetLang();
    scheduleApplyGoogleLang(lang);

    const main = document.querySelector("main");
    if (!main || lang === "en") return;

    let debounce: ReturnType<typeof setTimeout> | undefined;
    const observer = new MutationObserver(() => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => applyGoogleCombo(lang), 120);
    });
    observer.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (debounce) clearTimeout(debounce);
    };
  }, [pathname, translateEnabled]);

  if (!translateEnabled) {
    return null;
  }

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
