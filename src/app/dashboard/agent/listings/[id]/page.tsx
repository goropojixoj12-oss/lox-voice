import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  AdminListingEditWizard,
  AdminListingEditWizardProvider,
} from "@/components/dashboard/admin-listing-edit-wizard";
import { getSession } from "@/lib/auth";
import { getRuntimeListingById } from "@/lib/store";

export const metadata: Metadata = { title: "Edit my listing" };

export default async function AgentListingEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  const { id } = await params;
  const listing = await getRuntimeListingById(id);
  if (!listing) notFound();

  const isMine =
    (listing.createdByUserId != null && listing.createdByUserId === session.id) ||
    (listing.ownerId != null && listing.ownerId === session.id);
  if (!isMine && session.role !== "admin") notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/agent/listings"
        className="text-sm text-[var(--color-accent-soft)] hover:underline"
      >
        ← Back to my listings
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Edit listing
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Change the photos, price and description of your own listing. Saving sends it to admin
        review — an admin publishes it.
      </p>
      <div className="mt-6">
        <AdminListingEditWizardProvider
          listing={listing}
          afterSavePath="/dashboard/agent/listings"
          apiBase="/api/dashboard/listings"
          canModerate={false}
        >
          <AdminListingEditWizard listingStatus={listing.status} />
        </AdminListingEditWizardProvider>
      </div>
    </div>
  );
}
