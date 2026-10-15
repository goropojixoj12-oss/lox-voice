import type { AggregationSourceCatalogEntry } from "./types";
import { getCatalogSources } from "./catalog";
import { getAggregationSourceOverrides } from "@/lib/store";

/** Default per cron run when AGGREGATION_BATCH_SIZE is unset (parallel fetches, ~50s cap). */
export const DEFAULT_SYNC_BATCH_SIZE = 24;

/** Parallel HTTP polls per batch (override with AGGREGATION_SYNC_CONCURRENCY). */
export const DEFAULT_SYNC_FETCH_CONCURRENCY = 4;

/** Stop starting new sources after this many ms (override with AGGREGATION_SYNC_MAX_MS). */
export const DEFAULT_SYNC_MAX_DURATION_MS = 52_000;

const MAX_BATCH_SIZE = 50;

export type SyncCursor = {
  /** Index into the stable enabled source list for the next batch. */
  nextIndex: number;
  /** Total enabled sources last computed (for admin visibility). */
  totalEnabled: number;
  updatedAt: string;
};

function parsePositiveInt(raw: string | undefined, fallback: number, max: number): number {
  if (!raw?.trim()) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.floor(n));
}

export function resolveSyncBatchSize(override?: number): number {
  const fromEnv = parsePositiveInt(
    process.env.AGGREGATION_BATCH_SIZE,
    DEFAULT_SYNC_BATCH_SIZE,
    MAX_BATCH_SIZE,
  );
  if (override != null && Number.isFinite(override)) {
    return Math.min(MAX_BATCH_SIZE, Math.max(1, Math.floor(override)));
  }
  return fromEnv;
}

export function resolveSyncFetchConcurrency(): number {
  return parsePositiveInt(
    process.env.AGGREGATION_SYNC_CONCURRENCY,
    DEFAULT_SYNC_FETCH_CONCURRENCY,
    8,
  );
}

export function resolveSyncMaxDurationMs(): number {
  return parsePositiveInt(
    process.env.AGGREGATION_SYNC_MAX_MS,
    DEFAULT_SYNC_MAX_DURATION_MS,
    120_000,
  );
}

/** Stable sort: portals first, then agency, then other types; by id. */
export async function getEnabledSourcesForSync(): Promise<AggregationSourceCatalogEntry[]> {
  const overrides = await getAggregationSourceOverrides();
  const typeOrder: Record<string, number> = {
    portal: 0,
    agency: 1,
    other: 2,
    facebook: 3,
    telegram: 4,
  };

  return getCatalogSources()
    .filter((s) => {
      const enabled = s.id in overrides ? overrides[s.id].enabled : s.enabled;
      return enabled;
    })
    .sort((a, b) => {
      const ta = typeOrder[a.type] ?? 9;
      const tb = typeOrder[b.type] ?? 9;
      if (ta !== tb) return ta - tb;
      return a.id.localeCompare(b.id);
    });
}

export function sliceBatch(
  all: AggregationSourceCatalogEntry[],
  startIndex: number,
  batchSize: number,
): { batch: AggregationSourceCatalogEntry[]; nextIndex: number } {
  if (all.length === 0) {
    return { batch: [], nextIndex: 0 };
  }
  const start = startIndex % all.length;
  const batch: AggregationSourceCatalogEntry[] = [];
  for (let i = 0; i < batchSize && i < all.length; i += 1) {
    batch.push(all[(start + i) % all.length]);
  }
  const nextIndex = (start + batch.length) % all.length;
  return { batch, nextIndex };
}

/**
 * Run async work over items with a concurrency cap. Stops scheduling when `shouldContinue` is false.
 * Returns results in input order (undefined slots if never started).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
  shouldContinue?: () => boolean,
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length && (shouldContinue?.() ?? true)) {
      const i = nextIndex;
      nextIndex += 1;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Math.min(Math.max(1, concurrency), items.length || 1);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}
