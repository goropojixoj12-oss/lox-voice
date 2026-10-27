import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/states";
import { LIST_PROPERTY_WIZARD_ENTRY } from "@/lib/list-property-steps";
import { getSession } from "@/lib/auth";
import { getRuntimeListings } from "@/lib/store";

export const metadata: Metadata = { title: "My listings" };

export default async function DashboardListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { submitted } = await searchParams;
  const session = await getSession();
  const listings = (await getRuntimeListings()).filter(
    (l) => !session || l.createdByUserId === session.id || l.ownerId === session.id || session.role === "admin",
  );
  if (!listings.length) {
    return (
      <EmptyState
        title="No runtime listings yet"
        description="Create a listing with the wizard. Your submissions appear here after save."
        actionHref={LIST_PROPERTY_WIZARD_ENTRY}
        actionLabel="Create listing"
      />
    );
  }
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        My listings
      </h1>
      {submitted === "pending" ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-mist)] px-4 py-3 text-sm text-[var(--color-text)]">
          Your listing was sent to <strong>moderation</strong>. An admin will review and edit it before
          it appears on the public site.
        </p>
      ) : null}
      <ul className="mt-5 space-y-3">
        {listings.map((listing) => (
          <li
            key={listing.id}
            className="rounded-[var(--radius-md)] seaps-card p-4"
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
              <Link href={LIST_PROPERTY_WIZARD_ENTRY} className="text-sm text-[var(--color-accent)]">
                Create another
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
