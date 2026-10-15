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
        total?: number;
        warnings?: string[];
      };
      if (!res.ok) {
        setMessage(data.error ?? `Sync failed (${res.status})`);
        return;
      }
      const warn =
        data.warnings && data.warnings.length > 0
          ? ` · ${data.warnings.length} warning(s)`
          : "";
      setMessage(
        `Synced: +${data.created ?? 0} new, ${data.updated ?? 0} updated, ${data.total ?? 0} total · ${data.sourcesAttempted ?? 0} portal source(s)${warn}`,
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
