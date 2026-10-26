import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCommentsPanel } from "@/components/admin/admin-comments-panel";
import { AdminListingModerationForm } from "@/components/dashboard/admin-listing-moderation-form";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { resolveListingViewCount } from "@/lib/listing-view-store";
import { getRuntimeListingById } from "@/lib/store";

export const metadata: Metadata = { title: "Manage listing" };

export default async function AdminListingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getRuntimeListingById(id);
  if (!listing) notFound();
  const viewCount =
    listing.status === "published" ? await resolveListingViewCount(listing) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={adminDeskPath("listings")}
        className="text-sm text-[var(--color-accent-soft)] hover:underline"
      >
        ← Back to moderation queue
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Manage listing
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Edit every category, location, pricing, media, and platform field for this submission, then
        save, publish, or reject.
      </p>
      {viewCount !== null ? (
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Unique public views since approval:{" "}
          <strong className="text-[var(--color-text)]">{viewCount}</strong> (staff-only metric)
        </p>
      ) : null}
      <div className="mt-6 rounded-[var(--radius-xl)] seaps-card p-5 md:p-6">
        <AdminListingModerationForm listing={listing} />
      </div>
      <div className="mt-6">
        <AdminCommentsPanel
          subject={{ type: "listing", id: listing.id }}
          title="Moderation notes (internal)"
        />
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        <Link href={`/property/${listing.slug}`} className="text-[var(--color-accent-soft)] underline">
          Preview page
        </Link>{" "}
        (visible to you as admin; hidden from public until published)
      </p>
    </div>
  );
}
