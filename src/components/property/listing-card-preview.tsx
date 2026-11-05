"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Property, PropertyImage } from "@/lib/types";
import { resolveListingCardCoverSrc } from "@/lib/catalog-page-covers";
import { clampPreviewPhotoCount, orderImagesWithCover } from "@/lib/list-property-media";
import { cn } from "@/lib/utils";

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
  onIndexChange,
}: {
  frames: string[];
  alt: string;
  className?: string;
  sizes: string;
  onIndexChange?: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

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
            key={`${i}-${url}`}
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
  onFrameChange,
}: {
  property: Property;
  className?: string;
  sizes?: string;
  onFrameChange?: (index: number) => void;
}) {
  const pathname = usePathname();
  const cover = property.images.find((i) => i.isCover) ?? property.images[0];
  const alt = cover?.alt || property.title;
  const videoUrl = pickCardVideoUrl(property);

  const flipFrames = useMemo(() => {
    const urls = orderImagesWithCover(property.images)
      .map((i: PropertyImage) => i.url)
      .filter(Boolean)
      .slice(0, clampPreviewPhotoCount(property.previewPhotoCount));
    return urls.length >= 2 ? urls : [];
  }, [property.images, property.previewPhotoCount]);

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
    return (
      <FlipbookPreview
        frames={flipFrames}
        alt={alt}
        className={className}
        sizes={sizes}
        onIndexChange={onFrameChange}
      />
    );
  }

  if (!cover?.url) {
    const cardCoverSrc = resolveListingCardCoverSrc(property.slug, pathname);
    if (cardCoverSrc) {
      return (
        <div
          className={cn(
            "absolute inset-0 overflow-hidden bg-[var(--color-secondary)]",
            className,
          )}
        >
          <Image
            src={cardCoverSrc}
            alt={alt}
            fill
            unoptimized
            className="object-contain object-top"
            sizes={sizes}
            priority
          />
        </div>
      );
    }
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
  const images = orderImagesWithCover(
    items
      .filter((i) => i.kind === "image")
      .map((i, index) => ({
        id: `img-${index}`,
        url: i.url,
        alt: title,
        isCover: i.isCover,
      })),
  );
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
