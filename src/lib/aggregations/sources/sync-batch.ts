import type { AggregationSourceCatalogEntry } from "./types";
import { getCatalogSources } from "./catalog";
import { getAggregationSourceOverrides } from "@/lib/store";

/** Keeps a single serverless run under ~50s (6s fetch timeout × parallel pool). */
export const DEFAULT_SYNC_BATCH_SIZE = 9;

export type SyncCursor = {
  /** Index into the stable enabled source list for the next batch. */
  nextIndex: number;
  /** Total enabled sources last computed (for admin visibility). */
  totalEnabled: number;
  updatedAt: string;
};

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
