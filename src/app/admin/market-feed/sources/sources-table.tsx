"use client";

import { useMemo, useState } from "react";
import type { AggregationSourceView } from "@/lib/aggregations/sources/types";

const TYPE_LABEL: Record<string, string> = {
  portal: "Portal",
  agency: "Agency",
  facebook: "Facebook",
  telegram: "Telegram",
  other: "Other",
};

function statusBadge(status: AggregationSourceView["runtime"]["status"]) {
  const styles: Record<string, string> = {
    idle: "bg-[var(--color-secondary)] text-[var(--color-muted)]",
    ok: "bg-emerald-950/60 text-emerald-300",
    error: "bg-red-950/60 text-red-300",
    adapter_needed: "bg-amber-950/60 text-amber-200",
    fetch_error: "bg-red-950/50 text-red-200",
    blocked: "bg-violet-950/50 text-violet-200",
    skipped: "bg-[var(--color-secondary)] text-[var(--color-muted)]",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.idle}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

type Props = { initialSources: AggregationSourceView[] };

export function AdminSourcesTable({ initialSources }: Props) {
  const [sources, setSources] = useState(initialSources);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = sources;
    if (filter !== "all") list = list.filter((s) => s.type === filter);
    if (filter === "enabled") list = list.filter((s) => s.enabled);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [sources, filter, query]);

  async function toggleEnabled(id: string, enabled: boolean) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/aggregations/sources/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) return;
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s)),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All types</option>
          <option value="enabled">Enabled only</option>
          <option value="portal">Portals</option>
          <option value="agency">Agencies</option>
          <option value="facebook">Facebook</option>
          <option value="telegram">Telegram</option>
          <option value="other">Other</option>
        </select>
        <input
          type="search"
          placeholder="Search name or URL…"
          className="min-w-[220px] flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="self-center text-sm text-[var(--color-muted)]">
          Showing {filtered.length} of {sources.length}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] seaps-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
            <tr>
              <th className="px-3 py-2 font-semibold">On</th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Last run</th>
              <th className="px-3 py-2 font-semibold">Items</th>
              <th className="px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-3 py-2 align-top">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    disabled={busyId === s.id}
                    onChange={(e) => toggleEnabled(s.id, e.target.checked)}
                    aria-label={`Enable ${s.name}`}
                  />
                </td>
                <td className="max-w-md px-3 py-2 align-top">
                  <p className="font-medium text-[var(--color-accent-soft)]">{s.name}</p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block truncate text-xs text-[var(--color-accent)] hover:underline"
                  >
                    {s.url}
                  </a>
                  {s.runtime.message ? (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">{s.runtime.message}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top">{TYPE_LABEL[s.type] ?? s.type}</td>
                <td className="whitespace-nowrap px-3 py-2 align-top text-xs text-[var(--color-muted)]">
                  {s.runtime.lastRun
                    ? new Date(s.runtime.lastRun).toLocaleString("en-GB")
                    : "—"}
                </td>
                <td className="px-3 py-2 align-top tabular-nums">{s.runtime.itemsFetched}</td>
                <td className="px-3 py-2 align-top">{statusBadge(s.runtime.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
