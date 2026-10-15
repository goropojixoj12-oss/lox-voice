import {
  classifyRealEstateRelevance,
  type RealEstateRelevanceResult,
} from "@/lib/aggregations/relevance";
import {
  getAggregatedListings,
  getAggregationSyncMeta,
  saveAggregatedListings,
  saveAggregationSyncMeta,
} from "@/lib/store";
import type { AggregatedListing } from "@/lib/types";

export type PruneRemovedEntry = {
  id: string;
  title: string;
  reason: string;
  sourceUrl: string | null;
};

export type PruneNonRealEstateResult = {
  before: number;
  after: number;
  removed: number;
  kept: number;
  removedEntries: PruneRemovedEntry[];
  criteria: string;
};

const CRITERIA_SUMMARY =
  "Conservative filter: keep demo seeds and listings with propertyType or RE keywords/URLs (EN/KH). Remove when URL category or title/description clearly indicates jobs, vehicles, phones, or generic services without RE signals.";

const REMOVED_LOG_CAP = 500;

export async function pruneNonRealEstateListings(): Promise<PruneNonRealEstateResult> {
  const all = await getAggregatedListings();
  const kept: AggregatedListing[] = [];
  const removedEntries: PruneRemovedEntry[] = [];

  for (const listing of all) {
    const verdict: RealEstateRelevanceResult = classifyRealEstateRelevance(listing);
    if (verdict.keep) {
      kept.push(listing);
    } else {
      removedEntries.push({
        id: listing.id,
        title: listing.title,
        reason: verdict.reason,
        sourceUrl: listing.sourceUrl,
      });
    }
  }

  if (removedEntries.length > 0) {
    await saveAggregatedListings(kept);
  }

  const prevMeta = await getAggregationSyncMeta();
  const pruneAt = new Date().toISOString();
  const logSample = removedEntries.slice(0, REMOVED_LOG_CAP);

  await saveAggregationSyncMeta({
    lastRunAt: prevMeta?.lastRunAt ?? null,
    lastCreated: prevMeta?.lastCreated ?? 0,
    lastUpdated: prevMeta?.lastUpdated ?? 0,
    lastFetched: prevMeta?.lastFetched ?? 0,
    lastTotal: kept.length,
    lastSourcesAttempted: prevMeta?.lastSourcesAttempted ?? 0,
    lastWarnings: [
      ...(prevMeta?.lastWarnings ?? []),
      ...(removedEntries.length > 0
        ? [
            `Prune ${pruneAt}: removed ${removedEntries.length} non-RE listing(s) — see lastPruneRemoved in sync meta`,
          ]
        : []),
    ].slice(-50),
    lastError: prevMeta?.lastError ?? null,
    lastPruneAt: pruneAt,
    lastPruneRemovedCount: removedEntries.length,
    lastPruneRemoved: logSample,
  });

  return {
    before: all.length,
    after: kept.length,
    removed: removedEntries.length,
    kept: kept.length,
    removedEntries,
    criteria: CRITERIA_SUMMARY,
  };
}
