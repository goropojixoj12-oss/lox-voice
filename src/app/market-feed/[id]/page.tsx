import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { ensureAggregationsSeeded } from "@/lib/aggregations/ensure-seeded";
import { toPublicAggregatedListing } from "@/lib/aggregations/sanitize";
import { propertyTypeLabels } from "@/lib/labels";
import { getAggregatedListingById } from "@/lib/store";
import type { AggregatedListing } from "@/lib/types";
import { daysAgo, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    await ensureAggregationsSeeded();
    const raw = await getAggregatedListingById(id);
    if (!raw) return { title: "Listing not found" };
    return {
      title: raw.title,
      description: raw.description.slice(0, 160),
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Market Feed" };
  }
}

export default async function MarketFeedDetailPage({ params }: Props) {
  const { id } = await params;
  let raw: AggregatedListing | null = null;
  try {
    await ensureAggregationsSeeded();
    raw = await getAggregatedListingById(id);
  } catch {
    notFound();
  }
  if (!raw) notFound();

  const listing = toPublicAggregatedListing(raw);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/market-feed"
        className="text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        ← Back to Market Feed
      </Link>

      <article className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Market Feed
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)] md:text-4xl">
          {listing.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
          <span className="text-2xl font-semibold text-[var(--color-accent-soft)]">
            {listing.price != null
              ? formatPrice(listing.price, listing.currency)
              : "Price on request"}
          </span>
          {listing.propertyType ? (
            <span className="rounded-full bg-[var(--color-mist)] px-2.5 py-1 text-[var(--color-accent-soft)]">
              {propertyTypeLabels[listing.propertyType]}
            </span>
          ) : null}
          {listing.publishedAt ? <span>{daysAgo(listing.publishedAt)}</span> : null}
        </div>
        {listing.location ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-[var(--color-muted)]">
            <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
            {listing.location}
          </p>
        ) : null}

        {listing.photos.length > 0 ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {listing.photos.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] seaps-card"
              >
                {src.startsWith("/") ? (
                  <Image
                    src={src}
                    alt={`${listing.title} photo ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={src}
                    alt={`${listing.title} photo ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        ) : null}

        <div className="seaps-card mt-8 rounded-[var(--radius-lg)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Description
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[var(--color-text)] leading-relaxed">
            {listing.description}
          </p>
          <p className="mt-6 text-sm text-[var(--color-muted)]">
            Contact details and the original publisher are not shown on the public Market Feed.
            Platform staff can review them in the admin cabinet.
          </p>
        </div>
      </article>
    </div>
  );
}
