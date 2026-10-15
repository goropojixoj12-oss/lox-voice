import type { Metadata } from "next";
import Link from "next/link";
import { MarketFeedGrid } from "@/components/aggregations/market-feed-card";
import { SectionHeader } from "@/components/shared/section";
import { ensureAggregationsSeeded } from "@/lib/aggregations/ensure-seeded";
import { toPublicAggregatedListings } from "@/lib/aggregations/sanitize";
import { countEnabledSourcesByType } from "@/lib/aggregations/sources/catalog";
import { getAggregatedListings } from "@/lib/store";

export const metadata: Metadata = {
  title: "Market Feed",
  description:
    "Aggregated Cambodia property listings from public market sources. Contact details and original publishers are hidden on the public feed.",
};

export const dynamic = "force-dynamic";

export default async function MarketFeedPage() {
  // Public route: never throw on store/seed failures (serverless FS, cold start).
  let items: ReturnType<typeof toPublicAggregatedListings> = [];
  let enabledSources = 0;
  try {
    await ensureAggregationsSeeded();
    items = toPublicAggregatedListings(await getAggregatedListings());
    const counts = await countEnabledSourcesByType();
    enabledSources = counts.total;
  } catch {
    items = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Market Feed"
        title="Cambodia market overview"
        description="Fresh listings aggregated from public portals and manual import. No phones, emails, or source names on this page — only the property."
      />
      <p className="mb-6 text-sm text-[var(--color-muted)]">
        {items.length} listing{items.length === 1 ? "" : "s"} from{" "}
        {enabledSources > 0 ? enabledSources : "—"} enabled catalog source
        {enabledSources === 1 ? "" : "s"} (portals polled on schedule). Admins see contacts and
        source links in{" "}
        <Link href="/admin/market-feed" className="text-[var(--color-accent)] hover:underline">
          Admin → Market Feed
        </Link>
        .
      </p>
      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-10 text-center text-[var(--color-muted)]">
          Feed is empty. Run{" "}
          <code className="text-[var(--color-accent-soft)]">GET /api/aggregations/sync</code> as admin
          to pull adapters.
        </div>
      ) : (
        <MarketFeedGrid items={items} basePath="/market-feed" />
      )}
    </div>
  );
}
