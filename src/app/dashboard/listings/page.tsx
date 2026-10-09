import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/states";
import { getRuntimeListings } from "@/lib/store";

export const metadata: Metadata = { title: "My listings" };

export default async function DashboardListingsPage() {
  const listings = await getRuntimeListings();
  if (!listings.length) {
    return (
      <EmptyState
        title="No runtime listings yet"
        description="Create a listing with the wizard. Seed catalog items remain separate from your drafts."
        actionHref="/list-property"
        actionLabel="Create listing"
      />
    );
  }
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-primary)]">
        My listings
      </h1>
      <ul className="mt-5 space-y-3">
        {listings.map((listing) => (
          <li
            key={listing.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/property/${listing.slug}`} className="font-semibold">
                  {listing.title}
                </Link>
                <p className="text-sm text-[var(--color-muted)]">
                  Status: {listing.status} · {listing.location.city}
                </p>
              </div>
              <Link href="/list-property" className="text-sm text-[var(--color-accent)]">
                Create another
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
