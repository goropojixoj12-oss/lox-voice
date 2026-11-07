"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { Property, PropertyImage } from "@/lib/types";

type Slide =
  | {
      kind: "cover";
      photo: PropertyImage;
      eyebrow: string;
      title: string;
      body: string;
      facts: string[];
    }
  | { kind: "photo"; photo: PropertyImage; eyebrow: string; title: string; facts: string[] }
  | { kind: "final"; eyebrow: string; title: string; body: string; facts: string[] };

const SALE_LABEL: Record<Property["transactionType"], string> = {
  sale: "For sale",
  rent: "For rent",
  short_stay: "Short stay",
};

const HEADLINE_MAX = 92;

function money(price: number, currency: string, period: Property["pricePeriod"]): string {
  const value = price.toLocaleString("en-US");
  const suffix =
    period === "month" ? " / month" : period === "night" ? " / night" : period === "year" ? " / year" : "";
  return `${currency === "USD" ? "$" : `${currency} `}${value}${suffix}`;
}

/** A listing title is often a whole marketing sentence, so it is cut to a headline. */
function headline(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= HEADLINE_MAX) return clean.replace(/[.,;:]$/, "");
  const cut = clean.slice(0, HEADLINE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, "")}…`;
}

/** Alt text carries the room name after the listing name: "Vue Aston - living area". */
function cleanCaption(alt: string, index: number): string {
  const text = (alt ?? "").trim();
  if (!text) return `Frame ${index + 1}`;
  const tail = text.split(/\s+[-–—]\s+/).pop() ?? text;
  const cleaned = tail.trim();
  if (cleaned.length <= 3) return text;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Every slide carries one idea: what you see, plus one concrete reason to care. */
function buildSlides(property: Property): Slide[] {
  const images = property.images ?? [];
  const facts: string[] = [];
  if (property.bedrooms != null) {
    facts.push(property.bedrooms === 0 ? "Studio" : `${property.bedrooms} bedrooms`);
  }
  if (property.bathrooms != null) facts.push(`${property.bathrooms} bathrooms`);
  if (property.areaSqm) facts.push(`${property.areaSqm} m² interior`);
  if (property.landSqm) facts.push(`${property.landSqm} m² land`);
  if (property.furnishing) facts.push(property.furnishing.replace(/_/g, " "));
  facts.push(money(property.price, property.currency, property.pricePeriod));
  facts.push(`${property.location.district}, ${property.location.city}`);
  if (property.verification !== "unverified") facts.push("Verified");
  for (const amenity of property.amenities.slice(0, 6)) {
    facts.push(amenity.replace(/_/g, " "));
  }

  const slides: Slide[] = [];
  if (images.length > 0) {
    slides.push({
      kind: "cover",
      photo: images[0],
      eyebrow: `${SALE_LABEL[property.transactionType]} · ${property.propertyType.replace(/_/g, " ")}`,
      title: headline(property.title),
      body: property.summary.replace(/\s+/g, " ").trim(),
      facts: [money(property.price, property.currency, property.pricePeriod), `${images.length} photos`],
    });

    for (let i = 1; i < images.length; i += 1) {
      const rotated = facts.map((_, offset) => facts[(i + offset) % facts.length]);
      slides.push({
        kind: "photo",
        photo: images[i],
        eyebrow: "Inside the property",
        title: cleanCaption(images[i].alt, i),
        facts: rotated.slice(0, 3),
      });
    }
  }

  slides.push({
    kind: "final",
    eyebrow: "The address",
    title: property.location.address || `${property.location.district}, ${property.location.city}`,
    body: property.description.replace(/\s+/g, " ").slice(0, 240).trim(),
    facts: [
      money(property.price, property.currency, property.pricePeriod),
      "Walkthrough available by video call",
    ],
  });

  return slides;
}

export function PropertyPresentation({ property }: { property: Property }) {
  const slides = useMemo(() => buildSlides(property), [property]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const touchStart = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  const go = useCallback(
    (delta: number) => {
      setIndex((current) => Math.min(slides.length - 1, Math.max(0, current + delta)));
    },
    [slides.length],
  );

  useEffect(() => setMounted(true), []);

  // Cards marked as the slides design link here with ?presentation=1 so the
  // deck is already open, the same way the old showcase page felt.
  const searchParams = useSearchParams();
  const autoOpen = searchParams?.get("presentation") === "1";

  useEffect(() => {
    if (!autoOpen || slides.length < 2) return;
    setIndex(0);
    setOpen(true);
  }, [autoOpen, slides.length]);

  // The hero button lives above this component; it asks the deck to open.
  useEffect(() => {
    const openDeck = () => {
      setIndex(0);
      setOpen(true);
    };
    window.addEventListener("seaps:open-presentation", openDeck);
    return () => window.removeEventListener("seaps:open-presentation", openDeck);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        go(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, go]);

  // Warm up both neighbours so flipping never shows a blank slide.
  useEffect(() => {
    if (!open) return;
    for (const neighbour of [slides[index + 1], slides[index - 1]]) {
      const url = neighbour && "photo" in neighbour ? neighbour.photo?.url : undefined;
      if (url) {
        const img = new window.Image();
        img.src = url;
      }
    }
  }, [open, index, slides]);

  const slide = slides[Math.min(index, slides.length - 1)];
  const progress = slides.length > 1 ? (index / (slides.length - 1)) * 100 : 100;
  const photo = "photo" in slide ? slide.photo : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIndex(0);
          setOpen(true);
        }}
        className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 px-4 py-2 text-sm font-semibold text-[var(--color-accent-soft)] transition hover:bg-[var(--color-accent)]/20"
      >
        <Play className="h-4 w-4 fill-current" />
        Play the presentation
        <span className="text-xs font-normal text-[var(--color-muted)]">
          {property.images?.length ?? 0} slides
        </span>
      </button>

      {open && mounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${property.title} — presentation`}
              className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overscroll-contain bg-[#04080e]"
              onTouchStart={(event) => {
                touchStart.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const start = touchStart.current;
                touchStart.current = null;
                if (start == null) return;
                const delta = (event.changedTouches[0]?.clientX ?? start) - start;
                if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
              }}
            >
              {photo ? (
                <div
                  key={photo.url}
                  className="absolute inset-0 overflow-hidden bg-[var(--color-secondary)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    className="seaps-slide-photo h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary-soft)_0%,#04080e_60%)]" />
              )}

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(4,8,14,0.96)_0%,rgba(4,8,14,0.72)_38%,rgba(4,8,14,0.18)_72%,rgba(4,8,14,0.55)_100%)]" />

              <div className="relative z-10 flex items-center justify-between px-5 pt-5 sm:px-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
                  SEAPS · {property.location.city}
                </p>
                <div className="flex items-center gap-4">
                  <p className="font-mono text-xs tracking-[0.2em] text-white/60">
                    {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </p>
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close presentation"
                    className="rounded-full border border-white/25 p-2 text-white/80 transition hover:border-white/60 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div key={`${index}-text`} className="relative z-10 mt-auto px-5 pb-4 sm:px-8 sm:pb-6">
                <p className="seaps-slide-rise text-[11px] font-semibold uppercase tracking-[0.34em] text-[var(--color-accent)]">
                  {slide.eyebrow}
                </p>
                <h2 className="seaps-slide-rise mt-3 line-clamp-3 max-w-3xl font-[family-name:var(--font-display)] text-[clamp(1.6rem,4.4vw,3.2rem)] leading-[1.06] text-balance text-white">
                  {slide.title}
                </h2>
                {"body" in slide && slide.body ? (
                  <p className="seaps-slide-rise mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
                    {slide.body}
                  </p>
                ) : null}
                <ul className="mt-5 flex flex-wrap gap-2">
                  {slide.facts.map((fact) => (
                    <li
                      key={fact}
                      className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur-sm sm:text-sm"
                    >
                      {fact}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative z-10 flex items-center justify-between gap-4 px-5 pb-6 sm:px-8">
                <div className="hidden text-[11px] uppercase tracking-[0.24em] text-white/35 sm:block">
                  Use ← → to flip
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    disabled={index === 0}
                    aria-label="Previous slide"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-soft)] disabled:opacity-25 disabled:hover:border-white/25 disabled:hover:text-white"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    disabled={index >= slides.length - 1}
                    aria-label="Next slide"
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-accent)]/70 bg-[var(--color-accent)]/15 text-[var(--color-accent-soft)] transition hover:bg-[var(--color-accent)]/30 disabled:opacity-25"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 h-[3px] w-full bg-white/10">
                <div
                  className="h-full bg-[var(--color-accent)] transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}