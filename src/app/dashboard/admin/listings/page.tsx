import type { Metadata } from "next";
import Link from "next/link";
import { AdminListingTableRow } from "@/components/dashboard/admin-listing-table-row";
import { getSession } from "@/lib/auth";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { LIST_PROPERTY_WIZARD_ENTRY } from "@/lib/list-property-steps";
import { getRuntimeListings } from "@/lib/store";
import { demoUsers } from "@/data/users";
import { ADMIN_HIDDEN_USER_IDS } from "@/lib/admin-platform-users";
import type { ListingStatus, Property } from "@/lib/types";

export const metadata: Metadata = { title: "Listing management" };

const STATUS_TABS: { key: ListingStatus | "all"; label: string }[] = [
  { key: "all", label: "All runtime" },
  { key: "pending", label: "Pending" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
];

function submitterLabel(listing: Property): string {
  const user = demoUsers.find((u) => u.id === listing.createdByUserId);
  if (!user) return listing.createdByUserId ?? "—";
  if (ADMIN_HIDDEN_USER_IDS.has(user.id)) return "Demo login (not agent staff)";
  return `${user.name} (${user.email})`;
}

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const [runtime, session] = await Promise.all([getRuntimeListings(), getSession()]);
  const canDeleteRejected = session?.role === "admin";
  const filter = statusParam as ListingStatus | "all" | undefined;
  const activeTab =
    STATUS_TABS.find((t) => t.key === filter)?.key ??
    (filter === "pending" || filter === "published" || filter === "rejected" ? filter : "all");

  const rows =
    activeTab === "all"
      ? runtime
      : runtime.filter((l) => l.status === activeTab);

  const counts = {
    all: runtime.length,
    pending: runtime.filter((l) => l.status === "pending").length,
    published: runtime.filter((l) => l.status === "published").length,
    rejected: runtime.filter((l) => l.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            Listings
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Runtime submissions only — approve, edit, or reject before they appear on the public site.
            Catalog seed listings are managed in code, not here.
          </p>
        </div>
        <Link
          href={LIST_PROPERTY_WIZARD_ENTRY}
          className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#0B1C33]"
        >
          New listing (7 steps)
        </Link>
      </div>

      <nav className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.key}
            href={
              tab.key === "all"
                ? adminDeskPath("listings")
                : `${adminDeskPath("listings")}?status=${tab.key}`
            }
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
              activeTab === tab.key
                ? "border-[var(--color-accent)] bg-[var(--color-mist)]"
                : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
            }`}
          >
            {tab.label} ({counts[tab.key as keyof typeof counts] ?? counts.all})
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="bg-[var(--color-mist)]/60 text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Location</th>
              <th className="p-3">Submitted by</th>
              <th className="p-3">Updated</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--color-muted)]">
                  No listings in this view.
                </td>
              </tr>
            ) : (
              rows.map((listing) => (
                <AdminListingTableRow
                  key={listing.id}
                  listingId={listing.id}
                  title={listing.title}
                  status={listing.status}
                  locationLabel={`${listing.location.city}, ${listing.location.country}`}
                  submitterLabel={submitterLabel(listing)}
                  updatedLabel={new Date(
                    listing.updatedAt ?? listing.publishedAt,
                  ).toLocaleString()}
                  canDeleteRejected={canDeleteRejected}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
