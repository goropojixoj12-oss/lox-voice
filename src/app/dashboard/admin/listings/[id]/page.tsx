import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCommentsPanel } from "@/components/admin/admin-comments-panel";
import {
  AdminListingEditWizard,
  AdminListingEditWizardProvider,
} from "@/components/dashboard/admin-listing-edit-wizard";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { getRuntimeListingById } from "@/lib/store";

export const metadata: Metadata = { title: "Edit listing" };

export default async function AdminListingEditPage({
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
        \u2190 Back to listings
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Edit listing
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Full 7-step editing \u2014 change any field, upload or remove media, then save, approve, or
        reject.
      </p>
      <div className="mt-6">
        <AdminListingEditWizardProvider
          listing={listing}
          afterSavePath={adminDeskPath("listings")}
        >
          <AdminListingEditWizard listingStatus={listing.status} />
        </AdminListingEditWizardProvider>
      </div>
      <div className="mt-6">
        <AdminCommentsPanel
          subject={{ type: "listing", id: listing.id }}
          title="Moderation notes (internal)"
        />
      </div>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        <Link
          href={`/property/${listing.slug}`}
          className="text-[var(--color-accent-soft)] underline"
        >
          Preview page
        </Link>{" "}
        (visible to you as admin; hidden from public until published)
      </p>
    </div>
  );
}
