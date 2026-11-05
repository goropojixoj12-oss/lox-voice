"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bath, BedDouble, LandPlot, Maximize2 } from "lucide-react";
import { FavoriteButton } from "@/components/property/favorite-button";
import { PriceDisplay } from "@/components/property/price-display";
import { ButtonLink } from "@/components/ui/button";
import {
  propertyTypeLabels,
  transactionLabels,
  verificationLabels,
} from "@/lib/labels";
import type { Property, PropertyImage } from "@/lib/types";
import { clampPreviewPhotoCount, orderImagesWithCover } from "@/lib/list-property-media";
import { cn, daysAgo } from "@/lib/utils";

const FLIPBOOK_MS = 480;

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


// встроенный preview
export function CardImagePreview({
  property,
  className,
  onFrameChange,
  sizes,
}: {
  property: Property;
  className?: string;
  onFrameChange?: (index: number) => void;
  sizes: string;
}) {
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    onFrameChange?.(index);
  }, [index, onFrameChange]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const cardVideoUrl =
    property.cardPreviewVideoUrl ||
    property.videos?.find((v) => v.role === "card_preview")?.url ||
    null;

  const frames = useMemo(() => {
    const urls = orderImagesWithCover(property.images)
      .map((i: PropertyImage) => i.url)
      .filter(Boolean)
      .slice(0, clampPreviewPhotoCount(property.previewPhotoCount));
    return urls.length >= 2 ? urls : [];
  }, [property.images, property.previewPhotoCount]);

  useEffect(() => {
    if (reduceMotion || frames.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % frames.length);
    }, FLIPBOOK_MS);
    return () => window.clearInterval(timer);
  }, [frames.length, reduceMotion]);

  const cover = property.images.find((i) => i.isCover) ?? property.images[0];
  const alt = cover?.alt || property.title;

  if (cardVideoUrl) {
    return (
      <video
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        src={cardVideoUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    );
  }

  if (frames.length >= 2) {
    return (
      <div
        className={cn(
          "absolute inset-0 overflow-hidden bg-[var(--color-secondary)]",
          className,
        )}
      >
        {reduceMotion || frames.length < 2 ? (
          <Image
            src={frames[0]}
            alt={alt}
            fill
            unoptimized
            className="object-cover"
            sizes={sizes}
          />
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

export function PropertyCard({
  property,
  userId,
  externalDescriptionHref,
}: {
  property: Property;
  userId?: string;
  externalDescriptionHref?: string;
}) {
  const frameRef = useRef(0);
  const router = useRouter();
  const href = `/property/${property.slug}`;

  function openListing(event: React.MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    const frame = frameRef.current;
    router.push(frame > 0 ? `${href}?photo=${frame}` : href);
  }

  return (
    <Link href={href} onClick={openListing} className="block h-full">
      <article className="seaps-card group h-full overflow-hidden rounded-[var(--radius-lg)] transition hover:border-[rgba(240,215,140,0.75)]">
      <div className="relative aspect-[4/3]">
        <CardImagePreview
          property={property}
          onFrameChange={(index) => {
            frameRef.current = index;
          }}
          className="transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent-soft)]">
            {transactionLabels[property.transactionType]}
          </span>
          {property.isPremium ? (
            <span className="rounded-full bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0B1C33]">
              Premium
            </span>
          ) : null}
        </div>
        <FavoriteButton
          propertyId={property.id}
          userId={userId}
          className="absolute right-3 top-3"
        />
      </div>
      <div className="flex flex-col gap-3 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <PriceDisplay
            property={property}
            className="text-xl font-semibold tracking-tight text-[var(--color-accent-soft)]"
          />
          <span className="text-xs text-[var(--color-muted)]">{daysAgo(property.publishedAt)}</span>
        </div>
        <div>
          <h3 className="break-words font-semibold text-[var(--color-text)]">
            {property.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {property.location.district}, {property.location.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
          {property.bedrooms !== null ? (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-4 w-4" /> {property.bedrooms === 0 ? "Studio" : property.bedrooms}
            </span>
          ) : null}
          {property.bathrooms !== null ? (
            <span className="inline-flex items-center gap-1">
              <Bath className="h-4 w-4" /> {property.bathrooms}
            </span>
          ) : null}
          {property.areaSqm !== null ? (
            <span className="inline-flex items-center gap-1">
              <Maximize2 className="h-4 w-4" /> {property.areaSqm} m²
            </span>
          ) : null}
          {property.landSqm !== null ? (
            <span className="inline-flex items-center gap-1">
              <LandPlot className="h-4 w-4" /> {property.landSqm} m² land
            </span>
          ) : null}
        </div>
        {externalDescriptionHref ? (
          <ButtonLink href={externalDescriptionHref} variant="accent" size="sm" className="w-full">
            Description
          </ButtonLink>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="rounded-full bg-[var(--color-mist)] px-2.5 py-1 text-[var(--color-accent-soft)]">
            {propertyTypeLabels[property.propertyType]}
          </span>
          <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1 text-[var(--color-text)]">
            {verificationLabels[property.verification]}
          </span>
          {property.hasVideoTour ? (
            <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-1">Video tour</span>
          ) : null}
        </div>
      </div>
    </article>
    </Link>
  );
}

export function PropertyGrid({
  items,
  userId,
  descriptionHrefForProperty,
}: {
  items: Property[];
  userId?: string;
  descriptionHrefForProperty?: (property: Property) => string | undefined;
}) {
  return (
    <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          userId={userId}
          externalDescriptionHref={descriptionHrefForProperty?.(property)}
        />
      ))}
    </div>
  );
}

export function PropertyList({
  items,
  userId,
  descriptionHrefForProperty,
}: {
  items: Property[];
  userId?: string;
  descriptionHrefForProperty?: (property: Property) => string | undefined;
}) {
  return (
    <div className="grid items-stretch gap-4">
      {items.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          userId={userId}
          externalDescriptionHref={descriptionHrefForProperty?.(property)}
        />
      ))}
    </div>
  );
}
