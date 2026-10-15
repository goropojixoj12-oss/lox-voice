import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { nanoid } from "nanoid";
import type { AggregatedListing, Inquiry, Property, SavedSearch } from "@/lib/types";

/**
 * Prefer project-local `.data` when the filesystem is writable (local/dev).
 * On Vercel and other serverless hosts cwd is read-only, so fall back to tmp.
 */
function preferredDataDirs(): string[] {
  const local = path.join(process.cwd(), ".data");
  const tmp = path.join(os.tmpdir(), "seaps-data");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return [tmp, local];
  }
  return [local, tmp];
}

let resolvedDataDir: string | null = null;

async function getDataDir(): Promise<string> {
  if (resolvedDataDir) return resolvedDataDir;

  for (const dir of preferredDataDirs()) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const probe = path.join(dir, `.write-probe-${process.pid}`);
      await fs.writeFile(probe, "ok", "utf8");
      await fs.unlink(probe).catch(() => undefined);
      resolvedDataDir = dir;
      return dir;
    } catch {
      // try next candidate
    }
  }

  // Last resort — still point at tmp so callers have a path; reads/writes
  // are individually guarded below.
  resolvedDataDir = path.join(os.tmpdir(), "seaps-data");
  return resolvedDataDir;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const dir = await getDataDir();
    const raw = await fs.readFile(path.join(dir, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  const dir = await getDataDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file), JSON.stringify(data, null, 2), "utf8");
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

export type AggregationSourceOverride = { enabled: boolean };

export type AggregationSourceRuntimeRow = {
  lastRun: string | null;
  itemsFetched: number;
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
  return readJson<Record<string, AggregationSourceOverride>>(
    SOURCE_OVERRIDES_FILE,
    {},
  );
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
