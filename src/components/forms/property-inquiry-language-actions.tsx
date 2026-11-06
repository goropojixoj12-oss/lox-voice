"use client";

import { useState } from "react";
import { googleCodeFor, LANG_STORAGE_KEY, type SiteLangCode } from "@/config/languages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const langBtn =
  "seaps-gold-shine min-h-11 w-full rounded-[var(--radius-md)] px-3 text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm";

const goldBtn =
  "seaps-gold-shine min-h-11 w-full rounded-[var(--radius-md)] px-3 text-xs font-semibold uppercase tracking-[0.08em] sm:text-sm";

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
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nextSlot(): Date {
  // Next half hour, at least 15 minutes from now - a real, bookable time.
  const d = new Date(Date.now() + 15 * 60 * 1000);
  d.setMinutes(d.getMinutes() > 30 ? 60 : 30, 0, 0);
  return d;
}

function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toGoogleStamp(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function icsFor(start: Date, durationMin: number, title: string, details: string) {
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const stamp = (d: Date) => `${toGoogleStamp(d)}`.replace(/[-:]/g, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SEAPS//Video call//EN",
    "BEGIN:VEVENT",
    `UID:${start.getTime()}@seaps.asia`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details}`,
    "LOCATION:Online video call",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function PropertyInquiryLanguageActions({
  className,
  listingSlug,
}: {
  className?: string;
  listingSlug?: string;
}) {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [slot, setSlot] = useState(() => toLocalInput(nextSlot()));
  const [duration, setDuration] = useState(30);

  /**
   * One gesture, one new tab: the call page asks for the camera once and starts
   * ringing the desk. Language is applied without reloading the listing.
   */
  function startCall(lang: SiteLangCode) {
    pickLanguage(lang);
    const params = new URLSearchParams({ lang });
    if (listingSlug) params.set("listing", listingSlug);
    window.open(`/call?${params.toString()}`, "_blank", "noopener,width=560,height=820");
  }

  const start = new Date(slot);
  const validStart = !Number.isNaN(start.getTime());
  const title = "SEAPS video call about a listing";
  const details = listingSlug
    ? `Video call with a SEAPS representative about ${listingSlug}. We call you back at the agreed time.`
    : "Video call with a SEAPS representative.";
  const googleUrl = validStart
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGoogleStamp(start)}/${toGoogleStamp(new Date(start.getTime() + duration * 60000))}&details=${encodeURIComponent(details)}&location=${encodeURIComponent("Online video call")}`
    : "https://calendar.google.com/calendar/render?action=TEMPLATE";

  function downloadIcs() {
    if (!validStart) return;
    const blob = new Blob([icsFor(start, duration, title, details)], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seaps-video-call.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-center font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-accent-soft)]">
        HERE IS EXACTLY WHAT YOU ARE LOOKING FOR!
      </h4>
      <p className="text-center text-sm leading-relaxed text-[var(--color-muted)]">
        Stay in front of Estate Market — Your Language is?
      </p>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={langBtn} onClick={() => startCall("en")}>
          ENGLISH
        </button>
        <button type="button" className={langBtn} onClick={() => startCall("km")}>
          KHMER
        </button>
      </div>

      <button
        type="button"
        className={goldBtn}
        onClick={() => setSchedulerOpen((open) => !open)}
        aria-expanded={schedulerOpen}
      >
        SCHEDULE VIDEO CALL
      </button>

      {schedulerOpen ? (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <p className="text-xs text-[var(--color-muted)]">
            Pick a time — we call you. Add it to your calendar so you do not miss it.
          </p>
          <label className="block text-xs text-[var(--color-muted)]">
            Date &amp; time
            <input
              type="datetime-local"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-[var(--color-muted)]">
            Duration
            <select
              value={String(duration)}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={googleUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(goldBtn, "inline-flex items-center justify-center")}
            >
              GOOGLE CALENDAR
            </a>
            <Button type="button" variant="outline" className="min-h-11" onClick={downloadIcs}>
              ADD TO PHONE
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
            Кнопка «Add to phone» скачивает файл события — открой его, и звонок попадёт в
            календарь устройства (iPhone, Android, Outlook).
          </p>
        </div>
      ) : null}
    </div>
  );
}