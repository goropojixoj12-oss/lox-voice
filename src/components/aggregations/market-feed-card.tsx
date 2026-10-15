import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { propertyTypeLabels } from "@/lib/labels";
import type { AggregatedListing, PublicAggregatedListing } from "@/lib/types";
import { cn, daysAgo, formatPrice } from "@/lib/utils";

type CardListing = PublicAggregatedListing | AggregatedListing;

function isAdminListing(listing: CardListing): listing is AggregatedListing {
  return "sourceName" in listing && typeof (listing as AggregatedListing).sourceName === "string";
}

export function MarketFeedCard({
  listing,
  href,
  showAdminMeta = false,
}: {
  listing: CardListing;
  href: string;
  showAdminMeta?: boolean;
}) {
  const photo = listing.photos[0];
  const admin = showAdminMeta && isAdminListing(listing);

  return (
    <article className="seaps-card group grid grid-cols-[104px_1fr] gap-3 overflow-hidden rounded-[var(--radius-lg)] p-3 transition hover:border-[rgba(240,215,140,0.75)] sm:grid-cols-[140px_1fr] sm:gap-4 sm:p-4 md:grid-cols-[180px_1fr]">
      <Link
        href={href}
        className="relative aspect-[4/3] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-mist)] sm:aspect-square"
      >
        {photo ? (
          photo.startsWith("/") ? (
            <Image
              src={photo}
              alt={listing.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              sizes="(max-width:640px) 104px, (max-width:768px) 140px, 180px"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- external aggregated URLs
            <img
              src={photo}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-[var(--color-muted)] sm:text-xs">
            No photo
          </div>
        )}
        {listing.propertyType ? (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--color-primary)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-accent-soft)] sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-[10px]">
            {propertyTypeLabels[listing.propertyType]}
          </span>
        ) : null}
      </Link>
      <div className="flex min-w-0 flex-col gap-1.5 sm:gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-semibold tracking-tight text-[var(--color-accent-soft)] sm:text-xl">
            {listing.price != null
              ? formatPrice(listing.price, listing.currency)
              : "Price on request"}
          </p>
          {listing.publishedAt ? (
            <span className="shrink-0 text-xs text-[var(--color-muted)]">
              {daysAgo(listing.publishedAt)}
            </span>
          ) : null}
        </div>
        <Link
          href={href}
          className="break-words font-semibold text-[var(--color-text)] hover:text-[var(--color-accent-soft)]"
        >
          {listing.title}
        </Link>
        {listing.location ? (
          <p className="inline-flex items-start gap-1.5 text-sm text-[var(--color-muted)]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
            <span>{listing.location}</span>
          </p>
        ) : null}
        {admin ? (
          <div className="mt-2 space-y-1 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-mist)]/40 p-3 text-xs text-[var(--color-muted)]">
            <p>
              <span className="font-semibold text-[var(--color-accent-soft)]">Source:</span>{" "}
              {listing.sourceName}
              {listing.sourceUrl ? (
                <>
                  {" · "}
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] underline-offset-2 hover:underline"
                  >
                    Open original
                  </a>
                </>
              ) : null}
            </p>
            {(listing.contacts.phone ||
              listing.contacts.email ||
              listing.contacts.messenger) && (
              <p className={cn("leading-relaxed")}>
                <span className="font-semibold text-[var(--color-accent-soft)]">Contacts:</span>{" "}
                {[listing.contacts.phone, listing.contacts.email, listing.contacts.messenger]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function MarketFeedGrid({
  items,
  basePath,
  showAdminMeta = false,
}: {
  items: CardListing[];
  basePath: string;
  showAdminMeta?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {items.map((listing) => (
        <MarketFeedCard
          key={listing.id}
          listing={listing}
          href={`${basePath}/${listing.id}`}
          showAdminMeta={showAdminMeta}
        />
      ))}
    </div>
  );
}
