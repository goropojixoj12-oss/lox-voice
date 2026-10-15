import type { Metadata } from "next";
import Link from "next/link";
import { getSourcesAdminView } from "@/lib/aggregations/sources/catalog";
import { AdminSourcesTable } from "./sources-table";

export const metadata: Metadata = { title: "Admin · Market Feed · Sources" };

export const dynamic = "force-dynamic";

export default async function AdminMarketFeedSourcesPage() {
  const sources = await getSourcesAdminView();
  const enabled = sources.filter((s) => s.enabled).length;
  const portals = sources.filter((s) => s.type === "portal").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Admin · Market Feed
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)] md:text-4xl">
            Source registry
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            {sources.length} catalog URLs ({portals} portals). {enabled} enabled — batched cron polls
            ~24 sources per run (parallel fetches, 52s cap). At a 5-minute Vercel cron that is
            roughly ~2.5 hours for a full rotation of all enabled URLs; Hobby may run less often.
            Facebook/Telegram show{" "}
            <span className="text-[var(--color-accent-soft)]">blocked</span> until API/manual import;
            &quot;connected&quot; means registered + last sync status, not guaranteed live listings.
            Back to{" "}
            <Link href="/admin/market-feed" className="text-[var(--color-accent)] hover:underline">
              listings
            </Link>
            .
          </p>
        </div>
      </div>

      <AdminSourcesTable initialSources={sources} />
    </div>
  );
}
