import {
  getAggregatedListings,
  saveAggregatedListings,
  getAggregationSyncMeta,
  saveAggregationSyncMeta,
} from "@/lib/store";
import type { AggregatedListing } from "@/lib/types";

export const SEAPS_SOURCE_LABEL = "SEAPS Market Feed";

const MAX_AGE_DAYS = 14;

function recentIso(index: number, total: number): string {
  const now = Date.now();
  // Spread listings across the last 10 days, newest first
  const spanMs = 10 * 24 * 3600_000;
  const offset = total <= 1 ? 0 : (index / (total - 1)) * spanMs;
  return new Date(now - offset).toISOString();
}

function needsDateRefresh(iso: string | null | undefined): boolean {
  if (!iso) return true;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return true;
  const ageDays = (Date.now() - t) / (24 * 3600_000);
  return ageDays > MAX_AGE_DAYS;
}

export type NormalizeBrandingResult = {
  before: number;
  after: number;
  sourceNamesUpdated: number;
  datesUpdated: number;
};

/** Rewrite stored feed rows: SEAPS source label + dates within ~10 days. */
export async function normalizeAggregatedBranding(): Promise<NormalizeBrandingResult> {
  const listings = await getAggregatedListings();
  const before = listings.length;
  let sourceNamesUpdated = 0;
  let datesUpdated = 0;

  const next: AggregatedListing[] = listings.map((row, index) => {
    let changed = false;
    const patch: AggregatedListing = { ...row };

    if (patch.sourceName !== SEAPS_SOURCE_LABEL) {
      patch.sourceName = SEAPS_SOURCE_LABEL;
      sourceNamesUpdated += 1;
      changed = true;
    }

    if (needsDateRefresh(patch.publishedAt)) {
      patch.publishedAt = recentIso(index, listings.length);
      datesUpdated += 1;
      changed = true;
    }

    if (changed) {
      patch.updatedAt = new Date().toISOString();
    }
    return patch;
  });

  await saveAggregatedListings(next);

  const meta = await getAggregationSyncMeta();
  await saveAggregationSyncMeta({
    ...meta,
    lastNotes: [
      ...(meta.lastNotes ?? []).slice(0, 4),
      `Branding normalize ${new Date().toISOString()}: sources=${sourceNamesUpdated}, dates=${datesUpdated}`,
    ],
  });

  return {
    before,
    after: next.length,
    sourceNamesUpdated,
    datesUpdated,
  };
}
