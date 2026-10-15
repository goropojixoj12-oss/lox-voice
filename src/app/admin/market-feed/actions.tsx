"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  postAggregationSync,
  runFullRegistryImport,
  type AggregationSyncResponse,
} from "./sync-api";

function formatSyncMessage(data: AggregationSyncResponse): string {
  const warnPreview =
    data.warnings && data.warnings.length > 0
      ? ` · warnings: ${data.warnings.slice(0, 3).join(" | ")}${data.warnings.length > 3 ? " …" : ""}`
      : "";
  const backend = data.storageBackend ? ` · storage: ${data.storageBackend}` : "";
  const adapters =
    data.adaptersRun && data.adaptersRun.length > 0
      ? ` · adapters: ${data.adaptersRun.length}`
      : "";
  return `Synced: fetched ${data.fetched ?? 0}, +${data.created ?? 0} new, ${data.updated ?? 0} updated → ${data.total ?? 0} total · ${data.sourcesAttempted ?? 0} registry source(s)${adapters}${backend}${warnPreview}`;
}

export function AdminMarketFeedActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fullBusy, setFullBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function syncNow() {
    setBusy(true);
    setMessage(null);
    try {
      const { res, data } = await postAggregationSync();
      if (!res.ok) {
        setMessage(data.error ?? `Sync failed (${res.status})`);
        return;
      }
      setMessage(formatSyncMessage(data));
      router.refresh();
    } catch {
      setMessage("Network error during sync");
    } finally {
      setBusy(false);
    }
  }

  async function fullImportOnce() {
    if (fullBusy) {
      abortRef.current?.abort();
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setFullBusy(true);
    setMessage("Full import: starting…");
    try {
      const result = await runFullRegistryImport({
        batchSize: 50,
        signal: controller.signal,
        onProgress: ({ batch, sourcesPolled, totalEnabled, last }) => {
          setMessage(
            `Full import batch ${batch}: ${sourcesPolled}/${totalEnabled || "…"} sources · ${last.total ?? 0} listings in store`,
          );
        },
      });
      if (!result.ok) {
        setMessage(
          result.error ??
            `Full import incomplete after ${result.batches} batch(es): ${result.sourcesPolled}/${result.totalEnabled} sources · ${result.totalListings} listings (+${result.created} new)`,
        );
      } else {
        setMessage(
          `Full import done: ${result.batches} batch(es), ${result.sourcesPolled} sources polled → ${result.totalListings} listings (+${result.created} new, ${result.updated} updated)`,
        );
      }
      router.refresh();
    } catch {
      setMessage("Network error during full import");
    } finally {
      setFullBusy(false);
      abortRef.current = null;
    }
  }

  const anyBusy = busy || fullBusy;

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="accent" disabled={anyBusy} onClick={syncNow}>
          {busy ? "Syncing…" : "Sync now"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={fullImportOnce}
          title="Runs batched sync until all enabled registry sources are polled once (keep tab open ~15–30 min)"
        >
          {fullBusy ? "Stop full import" : "Full import once"}
        </Button>
      </div>
      {message ? (
        <p className="max-w-md text-right text-xs text-[var(--color-muted)]">{message}</p>
      ) : (
        <p className="max-w-md text-right text-xs text-[var(--color-muted)]">
          Sync now = one cron batch (~24 sources). Full import once = all ~773 sources in chunks (admin
          session; no curl secret needed).
        </p>
      )}
    </div>
  );
}
