import { nanoid } from "nanoid";
import {
  normalizeAggregationSourceOverrides,
  type AggregationSourceOverride,
} from "@/lib/aggregations/sources/enabled-state";
import {
  readStoreJson,
  resolveStorePersistenceBackend,
  writeStoreJson,
  type StorePersistenceBackend,
} from "@/lib/store-persistence";
import type { AggregatedListing, Inquiry, Property, SavedSearch } from "@/lib/types";

async function readJson<T>(file: string, fallback: T): Promise<T> {
  return readStoreJson(file, fallback);
}

async function writeJson<T>(file: string, data: T) {
  await writeStoreJson(file, data);
}

export function getStorePersistenceBackend(): StorePersistenceBackend {
  return resolveStorePersistenceBackend();
}

export async function getRuntimeListings() {
  return readJson<Property[]>("listings.json", []);
}

export async function saveRuntimeListing(listing: Property) {
  const listings = await getRuntimeListings();
  const idx = listings.findIndex((l) => l.id === listing.id);
  if (idx >= 0) listings[idx] = listing;
  else listings.unshift(listing);
  await writeJson("listings.json", listings);
  return listing;
}

export async function getRuntimeListingById(id: string) {
  const listings = await getRuntimeListings();
  return listings.find((l) => l.id === id) ?? null;
}

export async function getInquiries() {
  return readJson<Inquiry[]>("inquiries.json", []);
}

export async function createInquiry(input: Omit<Inquiry, "id" | "createdAt" | "status">) {
  const inquiries = await getInquiries();
  const inquiry: Inquiry = {
    ...input,
    id: nanoid(),
    status: "new",
    createdAt: new Date().toISOString(),
  };
  inquiries.unshift(inquiry);
  await writeJson("inquiries.json", inquiries);
  return inquiry;
}

export async function getSavedSearches(userId: string) {
  const all = await readJson<Record<string, SavedSearch[]>>("saved-searches.json", {});
  return all[userId] ?? [];
}

export async function saveSearch(userId: string, name: string, params: Record<string, string>) {
  const all = await readJson<Record<string, SavedSearch[]>>("saved-searches.json", {});
  const entry: SavedSearch = {
    id: nanoid(),
    name,
    params,
    createdAt: new Date().toISOString(),
  };
  all[userId] = [entry, ...(all[userId] ?? [])];
  await writeJson("saved-searches.json", all);
  return entry;
}

export async function getFavorites(userId: string) {
  const all = await readJson<Record<string, string[]>>("favorites.json", {});
  return all[userId] ?? [];
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const all = await readJson<Record<string, string[]>>("favorites.json", {});
  const current = new Set(all[userId] ?? []);
  if (current.has(propertyId)) current.delete(propertyId);
  else current.add(propertyId);
  all[userId] = [...current];
  await writeJson("favorites.json", all);
  return all[userId];
}

const AGGREGATED_FILE = "aggregated-listings.json";

export async function getAggregatedListings(): Promise<AggregatedListing[]> {
  return readJson<AggregatedListing[]>(AGGREGATED_FILE, []);
}

export async function saveAggregatedListings(listings: AggregatedListing[]) {
  await writeJson(AGGREGATED_FILE, listings);
  return listings;
}

export async function getAggregatedListingById(
  id: string,
): Promise<AggregatedListing | null> {
  const all = await getAggregatedListings();
  return all.find((l) => l.id === id) ?? null;
}

export async function upsertAggregatedListing(listing: AggregatedListing) {
  const all = await getAggregatedListings();
  const idx = all.findIndex((l) => l.id === listing.id || l.externalId === listing.externalId);
  if (idx >= 0) all[idx] = listing;
  else all.unshift(listing);
  await writeJson(AGGREGATED_FILE, all);
  return listing;
}

const SOURCE_OVERRIDES_FILE = "aggregation-source-overrides.json";
const SOURCE_RUNTIME_FILE = "aggregation-source-runtime.json";

export type { AggregationSourceOverride } from "@/lib/aggregations/sources/enabled-state";

export type AggregationSourceRuntimeRow = {
  lastRun: string | null;
  itemsFetched: number;
  itemsSkippedNonRe?: number;
  status:
    | "idle"
    | "ok"
    | "error"
    | "adapter_needed"
    | "fetch_error"
    | "blocked"
    | "skipped";
  message: string | null;
};

const SYNC_CURSOR_FILE = "aggregation-sync-cursor.json";

export type AggregationSyncCursorRow = {
  nextIndex: number;
  totalEnabled: number;
  updatedAt: string;
};

export async function getAggregationSyncCursor(): Promise<AggregationSyncCursorRow | null> {
  const row = await readJson<AggregationSyncCursorRow | null>(SYNC_CURSOR_FILE, null);
  return row;
}

export async function saveAggregationSyncCursor(
  cursor: AggregationSyncCursorRow,
): Promise<void> {
  await writeJson(SYNC_CURSOR_FILE, cursor);
}

export async function getAggregationSourceOverrides(): Promise<
  Record<string, AggregationSourceOverride>
> {
  const raw = await readJson<unknown>(SOURCE_OVERRIDES_FILE, {});
  return normalizeAggregationSourceOverrides(raw);
}

export async function resetAggregationSourceOverrides(): Promise<void> {
  await writeJson(SOURCE_OVERRIDES_FILE, {});
}

export async function setAggregationSourceEnabled(
  sourceId: string,
  enabled: boolean,
): Promise<void> {
  const all = await getAggregationSourceOverrides();
  all[sourceId] = { enabled };
  await writeJson(SOURCE_OVERRIDES_FILE, all);
}

export async function getAggregationSourceRuntimeMap(): Promise<
  Record<string, AggregationSourceRuntimeRow>
> {
  return readJson<Record<string, AggregationSourceRuntimeRow>>(
    SOURCE_RUNTIME_FILE,
    {},
  );
}

export async function saveAggregationSourceRuntime(
  sourceId: string,
  row: AggregationSourceRuntimeRow,
): Promise<void> {
  const all = await getAggregationSourceRuntimeMap();
  all[sourceId] = row;
  await writeJson(SOURCE_RUNTIME_FILE, all);
}

const SYNC_META_FILE = "aggregation-sync-meta.json";

export type AggregationPruneRemovedEntry = {
  id: string;
  title: string;
  reason: string;
  sourceUrl: string | null;
};

export type AggregationSyncMeta = {
  lastRunAt: string | null;
  lastCreated: number;
  lastUpdated: number;
  lastFetched: number;
  lastSkippedNonRe?: number;
  lastTotal: number;
  lastSourcesAttempted: number;
  lastWarnings: string[];
  lastError: string | null;
  storageBackend: StorePersistenceBackend;
  /** Last admin/script prune of non–real-estate aggregated listings. */
  lastPruneAt?: string | null;
  lastPruneRemovedCount?: number;
  lastPruneRemoved?: AggregationPruneRemovedEntry[];
};

export async function getAggregationSyncMeta(): Promise<AggregationSyncMeta | null> {
  return readJson<AggregationSyncMeta | null>(SYNC_META_FILE, null);
}

export async function saveAggregationSyncMeta(
  meta: Omit<AggregationSyncMeta, "storageBackend">,
): Promise<void> {
  await writeJson(SYNC_META_FILE, {
    ...meta,
    storageBackend: resolveStorePersistenceBackend(),
  });
}
