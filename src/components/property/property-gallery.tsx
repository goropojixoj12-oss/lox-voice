"use client";

import Image from "next/image";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import type { PropertyImage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { LiveNewsShowPanel } from "@/components/property/live-news-show-panel";

export function PropertyGallery({
  images,
  listingSlug,
}: {
  images: PropertyImage[];
  listingSlug?: string;
}) {
  const searchParams = useSearchParams();
  const [active, setActive] = useState(() => {
    // a card preview autoplays, so ?photo= carries the frame the visitor clicked
    const requested = Number(searchParams?.get("photo"));
    if (!Number.isInteger(requested) || requested < 0) return 0;
    return requested < images.length ? requested : 0;
  });
  const [lightbox, setLightbox] = useState(false);
  const current = images[active] ?? images[0];

  if (!current) {
    return <LiveNewsShowPanel listingSlug={listingSlug} />;
  }

  return (
    <div>
      <button
        type="button"
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-xl)]"
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "relative h-20 w-28 shrink-0 overflow-hidden rounded-[var(--radius-md)] border-2",
                active === index
                  ? "border-[var(--color-primary)]"
                  : "border-transparent opacity-80 hover:opacity-100",
              )}
            >
              <Image src={image.url} alt={image.alt} fill className="object-cover" sizes="112px" />
            </button>
          ))}
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
