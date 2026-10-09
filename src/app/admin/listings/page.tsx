import type { Metadata } from "next";
import Link from "next/link";
import { getRuntimeListings } from "@/lib/store";
import { properties } from "@/data/properties";

export const metadata: Metadata = { title: "Moderate listings" };

export default async function AdminListingsPage() {
  const runtime = await getRuntimeListings();
  const pending = runtime.filter((l) => l.status === "pending");
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-primary)]">
        Listing moderation
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Pending runtime submissions appear first. Seed listings are published demo stock (
        {properties.length} items).
      </p>
      <ul className="mt-6 space-y-3">
        {pending.length === 0 ? (
          <li className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-[var(--color-muted)]">
            No pending runtime listings. Submit one via the listing wizard while signed in as owner
            or agent.
          </li>
        ) : (
          pending.map((listing) => (
            <li
              key={listing.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <Link href={`/property/${listing.slug}`} className="font-semibold">
                {listing.title}
              </Link>
              <p className="text-sm text-[var(--color-muted)]">
                {listing.status} · {listing.location.city} · created {listing.publishedAt}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
