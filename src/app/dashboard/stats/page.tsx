import type { Metadata } from "next";
import { properties } from "@/data/properties";
import { getRuntimeListings, getInquiries } from "@/lib/store";

export const metadata: Metadata = { title: "Listing stats" };

export default async function StatsPage() {
  const [runtime, inquiries] = await Promise.all([getRuntimeListings(), getInquiries()]);
  const views = properties.reduce((sum, p) => sum + (p.views ?? 0), 0);
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-primary)]">
        Performance snapshot
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Demo metrics combining seed catalog views with runtime inquiry volume.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Catalog views (demo)</p>
          <p className="mt-2 text-3xl font-semibold">{views}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Runtime listings</p>
          <p className="mt-2 text-3xl font-semibold">{runtime.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-sm text-[var(--color-muted)]">Inquiries stored</p>
          <p className="mt-2 text-3xl font-semibold">{inquiries.length}</p>
        </div>
      </div>
    </div>
  );
}
