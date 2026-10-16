import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { ensureAggregationsSeeded } from "@/lib/aggregations/ensure-seeded";
import { propertyTypeLabels } from "@/lib/labels";
import { getAggregatedListingById } from "@/lib/store";
import { daysAgo, formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin · Market listing",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminMarketFeedDetailPage({ params }: Props) {
  const { id } = await params;
  await ensureAggregationsSeeded();
  const listing = await getAggregatedListingById(id);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/admin/market-feed"
        className="text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        ← Back to admin Market Feed
      </Link>

      <article className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Admin · full record
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
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-[var(--color-text)]">
            {listing.description}
          </p>
        </div>

        <div className="seaps-card mt-6 rounded-[var(--radius-lg)] border-[rgba(240,215,140,0.45)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
            Source & contacts (admin only)
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--color-muted)]">Source</dt>
              <dd className="mt-1 font-medium">SEAPS Market Feed</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Original URL</dt>
              <dd className="mt-1 break-all">
                {listing.sourceUrl ? (
                  <a
                    href={listing.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {listing.sourceUrl}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Phone</dt>
              <dd className="mt-1 font-medium">{listing.contacts.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Email</dt>
              <dd className="mt-1 font-medium">{listing.contacts.email ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[var(--color-muted)]">Messenger</dt>
              <dd className="mt-1 font-medium">{listing.contacts.messenger ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">External ID</dt>
              <dd className="mt-1 font-mono text-xs">{listing.externalId}</dd>
            </div>
            <div>
              <dt className="text-[var(--color-muted)]">Internal ID</dt>
              <dd className="mt-1 font-mono text-xs">{listing.id}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-[var(--color-muted)]">
            Public page:{" "}
            <Link href={`/market-feed/${listing.id}`} className="text-[var(--color-accent)] hover:underline">
              /market-feed/{listing.id}
            </Link>{" "}
            (contacts and source hidden there).
          </p>
        </div>
      </article>
    </div>
  );
}
