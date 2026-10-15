"use client";

import { useEffect, useMemo, useState } from "react";
import type { AggregationSourceView } from "@/lib/aggregations/sources/types";

const TYPE_LABEL: Record<string, string> = {
  portal: "Portal",
  agency: "Agency",
  facebook: "Facebook",
  telegram: "Telegram",
  other: "Other",
};

const STATUS_LABEL: Record<AggregationSourceView["runtime"]["status"], string> = {
  idle: "Not synced yet",
  ok: "OK",
  error: "Error",
  adapter_needed: "Adapter needed",
  fetch_error: "Fetch error",
  blocked: "Blocked",
  skipped: "Skipped",
};

const STATUS_HINT: Partial<Record<AggregationSourceView["runtime"]["status"], string>> = {
  idle:
    "Source is turned on for batched sync; no poll has finished yet (not the same as turned off).",
  blocked: "Social/monitoring URL — automated poll is not available.",
  skipped: "Monitoring-only URL — no automated scrape.",
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
  const label = STATUS_LABEL[status] ?? status.replace("_", " ");
  const hint = STATUS_HINT[status];
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status] ?? styles.idle}`}
      title={hint}
    >
      {label}
    </span>
  );
}

function SourceOnToggle({
  enabled,
  disabled,
  name,
  onToggle,
}: {
  enabled: boolean;
  disabled: boolean;
  name: string;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? `Turn off ${name}` : `Turn on ${name}`}
      disabled={disabled}
      onClick={() => onToggle(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-soft)] ${
        enabled
          ? "border-emerald-500/80 bg-emerald-800"
          : "border-[var(--color-border)] bg-[var(--color-primary)]"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        aria-hidden
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-[1.35rem]" : "translate-x-1"
        }`}
      />
    </button>
  );
}

type Props = {
  initialSources: AggregationSourceView[];
  onEnabledCountChange?: (enabled: number, total: number) => void;
};

export function AdminSourcesTable({ initialSources, onEnabledCountChange }: Props) {
  const [sources, setSources] = useState(initialSources);
  const [filter, setFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const enabledCount = useMemo(
    () => sources.filter((s) => s.enabled).length,
    [sources],
  );

  useEffect(() => {
    onEnabledCountChange?.(enabledCount, sources.length);
  }, [enabledCount, sources.length, onEnabledCountChange]);

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

  async function enableAllCatalogDefaults() {
    setBulkBusy(true);
    try {
      const res = await fetch("/api/aggregations/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resetOverrides" }),
      });
      if (!res.ok) return;
      const refresh = await fetch("/api/aggregations/sources");
      if (refresh.ok) {
        const data = (await refresh.json()) as { sources: AggregationSourceView[] };
        setSources(data.sources);
      } else {
        setSources((prev) => prev.map((s) => ({ ...s, enabled: true })));
      }
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
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
        <p className="self-center text-sm font-medium text-[var(--color-accent-soft)]">
          {enabledCount} of {sources.length} on
        </p>
        <p className="self-center text-sm text-[var(--color-muted)]">
          Showing {filtered.length} rows
        </p>
        <button
          type="button"
          disabled={bulkBusy || enabledCount === sources.length}
          onClick={() => void enableAllCatalogDefaults()}
          className="seaps-admin-nav-link shrink-0 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bulkBusy ? "Resetting…" : "Enable all (catalog defaults)"}
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-[var(--radius-lg)] seaps-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]">
            <tr>
              <th className="px-3 py-2 font-semibold" title="Include in batched registry sync">
                On
              </th>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Last run</th>
              <th className="px-3 py-2 font-semibold">Items</th>
              <th className="px-3 py-2 font-semibold" title="Last poll outcome — not the On switch">
                Sync status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-3 py-2 align-top">
                  <SourceOnToggle
                    enabled={s.enabled}
                    disabled={busyId === s.id}
                    name={s.name}
                    onToggle={(next) => void toggleEnabled(s.id, next)}
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
