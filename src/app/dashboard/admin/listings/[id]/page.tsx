import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminListingModerationForm } from "@/components/dashboard/admin-listing-moderation-form";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { getRuntimeListingById } from "@/lib/store";

export const metadata: Metadata = { title: "Review listing" };

export default async function AdminListingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getRuntimeListingById(id);
  if (!listing) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={adminDeskPath("listings")}
        className="text-sm text-[var(--color-accent-soft)] hover:underline"
      >
        ← Back to moderation queue
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Review listing
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Edit copy and pricing, then approve to publish on the public site or reject to send back.
      </p>
      <div className="mt-6 rounded-[var(--radius-xl)] seaps-card p-5 md:p-6">
        <AdminListingModerationForm listing={listing} />
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
