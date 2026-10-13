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

  const target = !googleLang || googleLang === "en" ? SITE_SOURCE_LANG : googleLang;

  // Ensure the option exists (all-language gadget should include it).
  const hasOption = Array.from(combo.options).some((o) => o.value === target);
  if (!hasOption && target !== SITE_SOURCE_LANG) {
    const opt = document.createElement("option");
    opt.value = target;
    opt.text = target;
    combo.appendChild(opt);
  }

  if (combo.value === target) return true;
  combo.value = target;
  combo.dispatchEvent(new Event("change"));
  return true;
}

/**
 * Invisible Google Website Translator — all languages enabled.
 * Menu (EN/KM/ZH/JA) only overrides; auto uses any browser/OS locale.
 */
export function GoogleTranslate() {
  const pathname = usePathname();

  useEffect(() => {
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
      window.setTimeout(() => applyGoogleCombo(resolveGoogleTargetLang()), 0);
    };

    if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }
  }, []);

  // Re-apply on every client route so SPA pages stay translated.
  useEffect(() => {
    const lang = resolveGoogleTargetLang();
    if (lang === "en") return;

    let tries = 0;
    const tick = () => {
      tries += 1;
      if (applyGoogleCombo(lang) || tries > 24) return;
      window.setTimeout(tick, 40);
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
