"use client";

import { useState } from "react";
import Link from "next/link";
import type { AggregationSourceView } from "@/lib/aggregations/sources/types";
import { AdminSourcesTable } from "./sources-table";

type Props = {
  initialSources: AggregationSourceView[];
  portals: number;
  initialEnabled: number;
};

export function SourcesRegistryShell({
  initialSources,
  portals,
  initialEnabled,
}: Props) {
  const [enabledCount, setEnabledCount] = useState(initialEnabled);
  const total = initialSources.length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Admin · Market Feed
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)] md:text-4xl">
            Source registry
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted)]">
            {total} catalog URLs ({portals} portals).{" "}
            <span className="font-medium text-[var(--color-accent-soft)]">
              {enabledCount} turned on
            </span>{" "}
            for batched cron (~24 sources per run, parallel fetches, 52s cap). The green{" "}
            <strong className="font-medium text-[var(--color-text)]">On</strong> switch includes a
            URL in rotation;{" "}
            <strong className="font-medium text-[var(--color-text)]">Not synced yet</strong> only
            means no poll has finished — it is not the same as turned off. Last run stays
            &quot;—&quot; until the first batch reaches that URL. Facebook/Telegram show{" "}
            <span className="text-[var(--color-accent-soft)]">blocked</span> after poll; use manual
            import. Back to{" "}
            <Link href="/admin/market-feed" className="text-[var(--color-accent)] hover:underline">
              listings
            </Link>
            .
          </p>
        </div>
      </div>

      <AdminSourcesTable
        initialSources={initialSources}
        onEnabledCountChange={(enabled) => setEnabledCount(enabled)}
      />
    </>
  );
}
