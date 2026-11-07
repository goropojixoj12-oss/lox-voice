"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { PropertyImage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LiveNewsShowPanel } from "@/components/property/live-news-show-panel";
import { shouldShowLiveNewsPanelForListing } from "@/lib/live-news-show";

export function PropertyGallery({
  images,
  listingSlug,
  fallbackLabel,
}: {
  images: PropertyImage[];
  listingSlug?: string;
  /** Shown in the zero-photo hero (e.g. "Kampot · house"). */
  fallbackLabel?: string;
}) {
  const searchParams = useSearchParams();
  const [active, setActive] = useState(() => {
    // a card preview autoplays, so ?photo= carries the frame the visitor clicked
    const requested = Number(searchParams?.get("photo"));
    if (!Number.isInteger(requested) || requested < 0) return 0;
    return requested < images.length ? requested : 0;
  });
  const [lightbox, setLightbox] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const current = images[active] ?? images[0];

  function scrollStrip(direction: -1 | 1) {
    const el = stripRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  }

  if (!current) {
    if (shouldShowLiveNewsPanelForListing(listingSlug)) {
      return <LiveNewsShowPanel />;
    }
    // No photos and no embed for this listing: show an intentional hero instead
    // of an empty cut-out in the page layout.
    return (
      <div className="flex h-[clamp(220px,58vh,560px)] w-full flex-col justify-end gap-2 rounded-[var(--radius-xl)] bg-[linear-gradient(150deg,var(--color-secondary)_0%,var(--color-accent)_140%)] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
          {fallbackLabel ?? "Listing"}
        </p>
        <p className="text-lg font-semibold text-white/90">Photos coming soon</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <button
        type="button"
        className="relative block h-[clamp(220px,58vh,560px)] w-full max-w-full overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-secondary)]"
        onClick={() => setLightbox(true)}
      >
        <Image
          src={current.url}
          alt={current.alt}
          fill
          className="object-cover"
          sizes="(max-width:1024px) 100vw, 70vw"
          priority
        />
      </button>
      {images.length > 1 ? (
        <div className="relative mt-3 w-full max-w-full">
          <div
            ref={stripRef}
            className="flex w-full max-w-full snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-1 pr-10"
          >
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  "relative h-20 w-28 shrink-0 snap-start overflow-hidden rounded-[var(--radius-md)] border-2",
                  active === index
                    ? "border-[var(--color-primary)]"
                    : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="112px" />
              </button>
            ))}
          </div>

          {/* Mouse users have no horizontal wheel/trackpad; give them arrows. */}
          <button
            type="button"
            aria-label="Previous photos"
            onClick={() => scrollStrip(-1)}
            className="absolute left-0 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-white sm:grid"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="More photos"
            onClick={() => scrollStrip(1)}
            className="absolute right-0 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/60 text-lg text-white shadow-lg"
          >
            ›
          </button>
        </div>
      ) : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setLightbox(false)}
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="relative h-[75vh] w-full max-w-5xl">
            <Image
              src={current.url}
              alt={current.alt}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
