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
    <article className="seaps-card group h-full overflow-hidden rounded-[var(--radius-lg)] transition hover:border-[rgba(240,215,140,0.75)]">
      <div className="relative aspect-[4/3] bg-[var(--color-mist)]">
        <Link href={href} className="absolute inset-0">
          {photo ? (
            photo.startsWith("/") ? (
              <Image
                src={photo}
                alt={listing.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.02]"
                sizes="(max-width:768px) 100vw, 33vw"
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
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
              No photo
            </div>
          )}
        </Link>
        {listing.propertyType ? (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-accent-soft)]">
            {propertyTypeLabels[listing.propertyType]}
          </span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xl font-semibold tracking-tight text-[var(--color-accent-soft)]">
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
    <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
