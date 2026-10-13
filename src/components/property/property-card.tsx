import Image from "next/image";
import Link from "next/link";
import { Bath, BedDouble, LandPlot, Maximize2 } from "lucide-react";
import { FavoriteButton } from "@/components/property/favorite-button";
import { PriceDisplay } from "@/components/property/price-display";
import {
  propertyTypeLabels,
  transactionLabels,
  verificationLabels,
} from "@/lib/labels";
import type { Property } from "@/lib/types";
import { cn, daysAgo } from "@/lib/utils";

export function PropertyCard({
  property,
  variant = "grid",
  userId,
}: {
  property: Property;
  variant?: "grid" | "list" | "editorial";
  userId?: string;
}) {
  const cover = property.images.find((i) => i.isCover) ?? property.images[0];
  const href = `/property/${property.slug}`;

  if (variant === "editorial") {
    return (
      <article className="group relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-primary)] text-white">
        <Link href={href} className="block">
          <div className="relative aspect-[16/11]">
            <Image
              src={cover.url}
              alt={cover.alt}
              fill
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
              sizes="(max-width:768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-white/80">
                {transactionLabels[property.transactionType]}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl leading-tight">
                {property.title}
              </h3>
              <PriceDisplay property={property} className="mt-2 text-lg font-semibold" />
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        variant === "list" && "md:grid md:grid-cols-[280px_1fr]",
      )}
    >
      <div className={cn("relative aspect-[4/3]", variant === "list" && "md:aspect-auto md:min-h-full")}>
        <Link href={href} className="absolute inset-0">
          <Image
            src={cover.url}
            alt={cover.alt}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </Link>
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
          <Link
            href={href}
            className="break-words font-semibold text-[var(--color-text)] hover:text-[var(--color-accent-soft)]"
          >
            {property.title}
          </Link>
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
  );
}

export function PropertyGrid({
  items,
  userId,
}: {
  items: Property[];
  userId?: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((property) => (
        <PropertyCard key={property.id} property={property} userId={userId} />
      ))}
    </div>
  );
}

export function PropertyList({
  items,
  userId,
}: {
  items: Property[];
  userId?: string;
}) {
  return (
    <div className="grid gap-4">
      {items.map((property) => (
        <PropertyCard key={property.id} property={property} variant="list" userId={userId} />
      ))}
    </div>
  );
}
