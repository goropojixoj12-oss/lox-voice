import type { Metadata } from "next";
import Link from "next/link";
import { MarketFeedGrid } from "@/components/aggregations/market-feed-card";
import { ensureAggregationsSeeded } from "@/lib/aggregations/ensure-seeded";
import { getAggregatedListings } from "@/lib/store";
import { AdminMarketFeedActions } from "./actions";
import { AdminImportClient } from "./import-client";

export const metadata: Metadata = { title: "Admin · Market Feed" };

export const dynamic = "force-dynamic";

export default async function AdminMarketFeedPage() {
  await ensureAggregationsSeeded();
  const items = await getAggregatedListings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Admin
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)] md:text-4xl">
            Market Feed · contacts & sources
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
            Same listings as the public{" "}
            <Link href="/market-feed" className="text-[var(--color-accent)] hover:underline">
              /market-feed
            </Link>{" "}
            page, but with phone / email / messenger and original source URL so you can find the
            publisher. Public visitors never see these fields.
          </p>
        </div>
        <AdminMarketFeedActions />
      </div>

      <p className="mt-6 text-sm text-[var(--color-muted)]">{items.length} aggregated listings</p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-10 text-[var(--color-muted)]">
          No aggregated listings yet. Use Sync now or paste via Import.
        </div>
      ) : (
        <div className="mt-6">
          <MarketFeedGrid items={items} basePath="/admin/market-feed" showAdminMeta />
        </div>
      )}

      <section className="seaps-card mt-12 rounded-[var(--radius-lg)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
          Import / paste listing
        </h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          For Facebook Groups, Marketplace, or Telegram posts: paste manually here (or POST JSON to{" "}
          <code className="text-[var(--color-accent-soft)]">/api/aggregations/import</code>). Official
          Meta Graph / Telegram Bot APIs can call the same endpoint later — we do not scrape private
          chats.
        </p>
        <AdminImportClient />
      </section>
    </div>
  );
}
