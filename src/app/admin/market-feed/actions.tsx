"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminMarketFeedActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function syncNow() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/aggregations/sync", { method: "POST" });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        created?: number;
        updated?: number;
        fetched?: number;
        total?: number;
        sourcesAttempted?: number;
        adaptersRun?: string[];
        storageBackend?: string;
        warnings?: string[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `Sync failed (${res.status})`);
        return;
      }
      const warnPreview =
        data.warnings && data.warnings.length > 0
          ? ` · warnings: ${data.warnings.slice(0, 3).join(" | ")}${data.warnings.length > 3 ? " …" : ""}`
          : "";
      const backend = data.storageBackend ? ` · storage: ${data.storageBackend}` : "";
      const adapters =
        data.adaptersRun && data.adaptersRun.length > 0
          ? ` · adapters: ${data.adaptersRun.length}`
          : "";
      setMessage(
        `Synced: fetched ${data.fetched ?? 0}, +${data.created ?? 0} new, ${data.updated ?? 0} updated → ${data.total ?? 0} total · ${data.sourcesAttempted ?? 0} registry source(s)${adapters}${backend}${warnPreview}`,
      );
      router.refresh();
    } catch {
      setMessage("Network error during sync");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button type="button" variant="accent" disabled={busy} onClick={syncNow}>
        {busy ? "Syncing…" : "Sync now"}
      </Button>
      {message ? (
        <p className="max-w-sm text-right text-xs text-[var(--color-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
