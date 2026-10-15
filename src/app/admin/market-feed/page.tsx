import type { Metadata } from "next";
import Link from "next/link";
import { MarketFeedGrid } from "@/components/aggregations/market-feed-card";
import { ensureAggregationsSeeded } from "@/lib/aggregations/ensure-seeded";
import {
  getAggregatedListings,
  getAggregationSyncMeta,
  getStorePersistenceBackend,
} from "@/lib/store";
import { AdminMarketFeedActions } from "./actions";
import { AdminImportClient } from "./import-client";

export const metadata: Metadata = { title: "Admin · Market Feed" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminMarketFeedPage() {
  await ensureAggregationsSeeded();
  const [items, syncMeta] = await Promise.all([
    getAggregatedListings(),
    getAggregationSyncMeta(),
  ]);
  const storageBackend = getStorePersistenceBackend();

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
            publisher. Public visitors never see these fields. Manage the{" "}
            <Link
              href="/admin/market-feed/sources"
              className="text-[var(--color-accent)] hover:underline"
            >
              773-source registry
            </Link>{" "}
            (enable/disable portals).
          </p>
        </div>
        <AdminMarketFeedActions />
      </div>

      <div className="mt-6 space-y-2 text-sm text-[var(--color-muted)]">
        <p>{items.length} aggregated listings · storage: {storageBackend}</p>
        {storageBackend === "filesystem" ? (
          <p className="max-w-3xl rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-100/90">
            Production on Vercel uses ephemeral <code>/tmp</code> unless you attach{" "}
            <strong>Vercel Blob</strong> (<code>BLOB_READ_WRITE_TOKEN</code>) or{" "}
            <strong>Redis</strong> (<code>KV_REST_API_URL</code> / <code>KV_REST_API_TOKEN</code>).
            Without that, cron sync and imports do not accumulate across serverless instances.
          </p>
        ) : null}
        {syncMeta ? (
          <p>
            Last sync:{" "}
            {syncMeta.lastRunAt
              ? new Date(syncMeta.lastRunAt).toLocaleString("en-GB", { timeZone: "UTC" }) + " UTC"
              : "—"}
            {syncMeta.lastError ? (
              <span className="text-red-300"> · error: {syncMeta.lastError}</span>
            ) : (
              <>
                {" "}
                · +{syncMeta.lastCreated} new, {syncMeta.lastUpdated} updated → {syncMeta.lastTotal}{" "}
                total · {syncMeta.lastSourcesAttempted} source(s) polled
              </>
            )}
            {syncMeta.lastWarnings.length > 0 ? (
              <span> · {syncMeta.lastWarnings.length} warning(s)</span>
            ) : null}
            {syncMeta.lastPruneAt ? (
              <span>
                {" "}
                · last prune:{" "}
                {new Date(syncMeta.lastPruneAt).toLocaleString("en-GB", { timeZone: "UTC" })} UTC
                ({syncMeta.lastPruneRemovedCount ?? 0} removed)
              </span>
            ) : null}
          </p>
        ) : (
          <p>No successful cron/admin sync recorded yet. Set CRON_SECRET (or AGGREGATION_SYNC_SECRET) for Vercel cron.</p>
        )}
      </div>

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
