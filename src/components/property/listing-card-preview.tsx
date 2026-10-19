"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { Property, PropertyImage } from "@/lib/types";
import { cn } from "@/lib/utils";

const FLIPBOOK_MAX_FRAMES = 24;
const FLIPBOOK_MS = 480;

function pickCardVideoUrl(property: Property): string | null {
  if (property.cardPreviewVideoUrl) return property.cardPreviewVideoUrl;
  const flagged = property.videos?.find((v) => v.role === "card_preview");
  if (flagged) return flagged.url;
  return null;
}

function FlipbookPreview({
  frames,
  alt,
  className,
  sizes,
}: {
  frames: string[];
  alt: string;
  className?: string;
  sizes: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reduceMotion || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, FLIPBOOK_MS);
    return () => window.clearInterval(timer);
  }, [frames.length, reduceMotion]);

  const active = frames[index] ?? frames[0];

  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden bg-[var(--color-secondary)]",
        className,
      )}
    >
      {reduceMotion || frames.length < 2 ? (
        <Image src={active} alt={alt} fill unoptimized className="object-cover" sizes={sizes} />
      ) : (
        frames.map((url, i) => (
          <Image
            key={url}
            src={url}
            alt={alt}
            fill
            className={cn(
              "object-cover transition-opacity duration-300",
              i === index ? "opacity-100" : "opacity-0",
            )}
            sizes={sizes}
            priority={i === 0}
            unoptimized
          />
        ))
      )}
    </div>
  );
}

export function ListingCardPreview({
  property,
  className,
  sizes = "(max-width:768px) 100vw, 33vw",
}: {
  property: Property;
  className?: string;
  sizes?: string;
}) {
  const cover = property.images.find((i) => i.isCover) ?? property.images[0];
  const alt = cover?.alt || property.title;
  const videoUrl = pickCardVideoUrl(property);

  const flipFrames = useMemo(() => {
    const urls = property.images
      .map((i: PropertyImage) => i.url)
      .filter(Boolean)
      .slice(0, FLIPBOOK_MAX_FRAMES);
    return urls.length >= 2 ? urls : [];
  }, [property.images]);

  if (videoUrl) {
    return (
      <video
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        src={videoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }

  if (flipFrames.length >= 2) {
    return <FlipbookPreview frames={flipFrames} alt={alt} className={className} sizes={sizes} />;
  }

  if (!cover?.url) {
    return <div className={cn("bg-[var(--color-secondary)]", className)} aria-hidden />;
  }

  return (
    <Image
      src={cover.url}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes={sizes}
      unoptimized={cover.url.startsWith("/api/")}
    />
  );
}

export function listingPreviewFromMedia(
  title: string,
  items: { kind: string; url: string; isCover?: boolean; isCardPreview?: boolean }[],
): Pick<Property, "images" | "videos" | "cardPreviewVideoUrl" | "title"> {
  const images = items
    .filter((i) => i.kind === "image")
    .map((i, index) => ({
      id: `img-${index}`,
      url: i.url,
      alt: title,
      isCover: i.isCover || index === 0,
    }));
  const videos = items
    .filter((i) => i.kind === "video")
    .map((i, index) => ({
      id: `vid-${index}`,
      url: i.url,
      role: i.isCardPreview ? ("card_preview" as const) : ("tour" as const),
    }));
  const cardPreviewVideoUrl = items.find((i) => i.kind === "video" && i.isCardPreview)?.url ?? null;
  return { title, images, videos, cardPreviewVideoUrl };
}
