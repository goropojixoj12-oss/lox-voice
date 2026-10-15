import type { AggregatedDraft } from "../adapters/types";
import { shouldSkipRegistrySourceUrl } from "../ingest-filter";
import { fetchKnownPortalAdapter } from "../adapters/html-portal";
import { fetchGenericSourceUrl } from "../adapters/generic-fetch";
import type { AggregationSourceCatalogEntry, AggregationSourceStatus } from "./types";
import {
  getEnabledSourcesForSync,
  mapWithConcurrency,
  resolveSyncBatchSize,
  resolveSyncFetchConcurrency,
  resolveSyncMaxDurationMs,
  sliceBatch,
  type SyncCursor,
} from "./sync-batch";
import {
  getAggregationSyncCursor,
  saveAggregationSourceRuntime,
  saveAggregationSyncCursor,
} from "@/lib/store";

export type RegistrySyncResult = {
  sourcesAttempted: number;
  drafts: AggregatedDraft[];
  /** Headlines rejected at parse time before entering the sync merge. */
  skippedNonRe: number;
  warnings: string[];
  sourcesRun: string[];
  batchSize: number;
  cursor: SyncCursor;
};

function hostnameKey(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url;
  }
}

function socialStatus(
  type: AggregationSourceCatalogEntry["type"],
): { status: AggregationSourceStatus; message: string } | null {
  if (type === "facebook") {
    return {
      status: "blocked",
      message: "Facebook — no Graph API connector; use manual import",
    };
  }
  if (type === "telegram") {
    return {
      status: "blocked",
      message: "Telegram — no Bot API channel access; use manual import",
    };
  }
  if (type === "other") {
    return {
      status: "skipped",
      message: "Monitoring-only URL — no automated scrape",
    };
  }
  return null;
}

/**
 * Poll a batch of enabled registry rows (cursor rotates each cron run).
 */
export async function syncEnabledRegistryPortals(options?: {
  batchSize?: number;
  /** When true, process every enabled source in one run (admin only; may timeout). */
  fullCycle?: boolean;
}): Promise<RegistrySyncResult> {
  const batchSize = options?.fullCycle
    ? Number.MAX_SAFE_INTEGER
    : resolveSyncBatchSize(options?.batchSize);

  const allEnabled = await getEnabledSourcesForSync();
  const stored = await getAggregationSyncCursor();
  const startIndex = stored?.nextIndex ?? 0;

  const { batch, nextIndex: plannedNextIndex } = options?.fullCycle
    ? { batch: allEnabled, nextIndex: 0 }
    : sliceBatch(allEnabled, startIndex, batchSize);

  const drafts: AggregatedDraft[] = [];
  const warnings: string[] = [];
  let skippedNonRe = 0;
  const sourcesRun: string[] = [];
  const adapterHostsRun = new Set<string>();
  const genericHostsRun = new Set<string>();

  const startedAt = Date.now();
  const maxDurationMs = resolveSyncMaxDurationMs();
  const concurrency = resolveSyncFetchConcurrency();
  let processedCount = 0;

  const withinBudget = () => Date.now() - startedAt < maxDurationMs;

  await mapWithConcurrency(
    batch,
    concurrency,
    async (source) => {
      if (!withinBudget()) {
        return;
      }
      processedCount += 1;
      sourcesRun.push(source.id);
      const now = new Date().toISOString();

      const social = socialStatus(source.type);
      if (social) {
        await saveAggregationSourceRuntime(source.id, {
          lastRun: now,
          itemsFetched: 0,
          status: social.status,
          message: social.message,
        });
        return;
      }

      try {
        if (shouldSkipRegistrySourceUrl(source.url)) {
          warnings.push(`${source.id}: skipped — list URL matches non–real-estate path filter`);
          await saveAggregationSourceRuntime(source.id, {
            lastRun: now,
            itemsFetched: 0,
            itemsSkippedNonRe: 0,
            status: "skipped",
            message: "Non–real-estate URL path — not polled (ingest filter)",
          });
          return;
        }

        const result = await syncOnePollableSource(source, adapterHostsRun, genericHostsRun);
        drafts.push(...result.items);
        skippedNonRe += result.skippedNonRe;
        warnings.push(...result.warnings);
        await saveAggregationSourceRuntime(source.id, {
          lastRun: now,
          itemsFetched: result.items.length,
          itemsSkippedNonRe: result.skippedNonRe,
          status: result.status,
          message: result.message,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "sync failed";
        warnings.push(`${source.id}: ${msg}`);
        await saveAggregationSourceRuntime(source.id, {
          lastRun: now,
          itemsFetched: 0,
          status: "fetch_error",
          message: msg,
        });
      }
    },
    withinBudget,
  );

  if (processedCount < batch.length && !options?.fullCycle) {
    warnings.push(
      `Stopped after ${processedCount}/${batch.length} sources (${maxDurationMs}ms budget)`,
    );
  }

  const nextIndex = options?.fullCycle
    ? 0
    : (startIndex + processedCount) % (allEnabled.length || 1);

  const cursor: SyncCursor = {
    nextIndex: options?.fullCycle ? plannedNextIndex : nextIndex,
    totalEnabled: allEnabled.length,
    updatedAt: new Date().toISOString(),
  };
  if (!options?.fullCycle) {
    await saveAggregationSyncCursor(cursor);
  }

  return {
    sourcesAttempted: processedCount,
    drafts,
    skippedNonRe,
    warnings,
    sourcesRun,
    batchSize,
    cursor,
  };
}

async function syncOnePollableSource(
  source: AggregationSourceCatalogEntry,
  adapterHostsRun: Set<string>,
  genericHostsRun: Set<string>,
): Promise<{
  items: AggregatedDraft[];
  warnings: string[];
  skippedNonRe: number;
  status: AggregationSourceStatus;
  message: string | null;
}> {
  if (source.adapterId) {
    if (adapterHostsRun.has(source.adapterId)) {
      return {
        items: [],
        warnings: [`${source.id}: adapter ${source.adapterId} already ran this cycle`],
        skippedNonRe: 0,
        status: "ok",
        message: "Deduped — same dedicated adapter as another enabled URL",
      };
    }
    adapterHostsRun.add(source.adapterId);
    const dedicated = await fetchKnownPortalAdapter(source.adapterId);
    const skippedNonRe = dedicated.skippedNonRe ?? 0;
    const status =
      dedicated.status === "ok" && dedicated.items.length === 0 && skippedNonRe === 0
        ? "adapter_needed"
        : dedicated.status;
    return {
      items: dedicated.items,
      warnings: dedicated.warnings,
      skippedNonRe,
      status,
      message: dedicated.message,
    };
  }

  const host = hostnameKey(source.url);
  if (genericHostsRun.has(host)) {
    return {
      items: [],
      warnings: [`${source.id}: host ${host} already polled this cycle`],
      skippedNonRe: 0,
      status: "ok",
      message: "Deduped — same hostname as another enabled URL this batch",
    };
  }
  genericHostsRun.add(host);

  const generic = await fetchGenericSourceUrl({
    sourceId: source.id,
    sourceName: source.name,
    listUrl: source.url,
  });

  const skippedNonRe = generic.skippedNonRe;
  const status =
    generic.status === "ok" && generic.items.length === 0 && skippedNonRe === 0
      ? "adapter_needed"
      : generic.status;

  return {
    items: generic.items,
    warnings: generic.warnings,
    skippedNonRe,
    status,
    message: generic.message,
  };
}
