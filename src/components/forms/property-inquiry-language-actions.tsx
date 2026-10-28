"use client";

import { googleCodeFor, LANG_STORAGE_KEY, type SiteLangCode } from "@/config/languages";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const goldBtn =
  "seaps-gold-shine min-h-10 flex-1 rounded-[var(--radius-md)] px-3 text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm";

function cookieRootDomain(hostname: string): string | null {
  if (!hostname.includes(".")) return null;
  const parts = hostname.split(".");
  if (parts.length < 2) return null;
  return `.${parts.slice(-2).join(".")}`;
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

function applyGoogleCombo(googleLang: string) {
  const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  if (!combo) return;
  if (!googleLang || googleLang === "en") {
    const original =
      Array.from(combo.options).find((o) => o.value === "")?.value ??
      Array.from(combo.options).find((o) => o.value === "en")?.value ??
      "";
    combo.value = original;
  } else {
    combo.value = googleLang;
  }
  combo.dispatchEvent(new Event("change"));
}

function pickLanguage(siteCode: SiteLangCode) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, siteCode);
  } catch {
    /* ignore */
  }
  const google = googleCodeFor(siteCode);
  window.__SEAPS_LANG__ = siteCode;
  window.__SEAPS_GOOGLE_LANG__ = google;
  setGoogTransCookie(google);
  applyGoogleCombo(google);
  window.location.reload();
}

export function PropertyInquiryLanguageActions({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 border-t border-[var(--color-border)] pt-4", className)}>
      <h4 className="text-center font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-accent-soft)]">
        HERE IS EXACTLY WHAT YOU ARE LOOKING FOR!
      </h4>
      <p className="text-center text-sm leading-relaxed text-[var(--color-muted)]">
        Stay in front of Estate Market — Your Language is?
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={goldBtn} onClick={() => pickLanguage("en")}>
          English
        </button>
        <button type="button" className={goldBtn} onClick={() => pickLanguage("km")}>
          Khmer
        </button>
        <ButtonLink href="/contact" variant="accent" className={cn(goldBtn, "inline-flex")}>
          Schedule V
        </ButtonLink>
      </div>
    </div>
  );
}
