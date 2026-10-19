import type { Metadata } from "next";
import Link from "next/link";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import { getRuntimeListings } from "@/lib/store";
import { properties } from "@/data/properties";

export const metadata: Metadata = { title: "Moderate listings" };

export default async function AdminListingsPage() {
  const runtime = await getRuntimeListings();
  const pending = runtime.filter((l) => l.status === "pending");
  const rejected = runtime.filter((l) => l.status === "rejected");
  const publishedRuntime = runtime.filter((l) => l.status === "published");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Listing moderation
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        New submissions stay <strong>pending</strong> until you edit and approve. Public catalog:{" "}
        {properties.length + publishedRuntime.length} published listings (
        {properties.length} seed + {publishedRuntime.length} approved runtime).
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Pending review</h2>
        <ul className="mt-3 space-y-3">
          {pending.length === 0 ? (
            <li className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-[var(--color-muted)]">
              No pending listings. Agents and owners submit via the{" "}
              <Link href={agentDeskPath("list-property", "step1")} className="text-[var(--color-accent-soft)] underline">
                list-property wizard
              </Link>
              .
            </li>
          ) : (
            pending.map((listing) => (
              <li key={listing.id} className="rounded-[var(--radius-md)] seaps-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{listing.title}</p>
                    <p className="text-sm text-[var(--color-muted)]">
                      {listing.location.city}, {listing.location.country} · submitted{" "}
                      {new Date(listing.publishedAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/agent/admin/listings/${listing.id}`}
                    className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#0B1C33]"
                  >
                    Review & edit
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      {rejected.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Rejected</h2>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            {rejected.map((listing) => (
              <li key={listing.id}>
                {listing.title} ·{" "}
                <Link
                  href={`/dashboard/agent/admin/listings/${listing.id}`}
                  className="text-[var(--color-accent-soft)] underline"
                >
                  Re-open
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
