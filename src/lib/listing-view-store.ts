import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";
import { getRuntimeListingById, saveRuntimeListing } from "@/lib/store";
import type { Property } from "@/lib/types";

const STORE_FILE = "listing-unique-views.json";
const MAX_SESSIONS_PER_LISTING = 4000;

type ListingViewStore = {
  counts: Record<string, number>;
  sessions: Record<string, string[]>;
};

async function loadStore(): Promise<ListingViewStore> {
  return readStoreJson<ListingViewStore>(STORE_FILE, { counts: {}, sessions: {} });
}

async function saveStore(store: ListingViewStore): Promise<void> {
  await writeStoreJson(STORE_FILE, store);
}

export async function resetListingViewTracking(listingId: string): Promise<void> {
  const store = await loadStore();
  delete store.counts[listingId];
  delete store.sessions[listingId];
  await saveStore(store);
}

export async function resolveListingViewCount(property: Property): Promise<number> {
  if (property.id.startsWith("runtime-")) {
    return property.views ?? 0;
  }
  const store = await loadStore();
  const tracked = store.counts[property.id];
  if (tracked !== undefined) return tracked;
  return property.views ?? 0;
}

/**
 * Count one unique anonymous view for a published listing (deduped by analytics session key).
 */
export async function recordUniqueListingView(
  listingId: string,
  sessionKey: string,
): Promise<number | null> {
  const key = sessionKey.slice(0, 64);
  const store = await loadStore();
  const sessions = store.sessions[listingId] ?? [];
  if (sessions.includes(key)) {
    return store.counts[listingId] ?? 0;
  }

  const nextSessions = [...sessions, key].slice(-MAX_SESSIONS_PER_LISTING);
  const nextCount = (store.counts[listingId] ?? 0) + 1;
  store.sessions[listingId] = nextSessions;
  store.counts[listingId] = nextCount;
  await saveStore(store);

  if (listingId.startsWith("runtime-")) {
    const listing = await getRuntimeListingById(listingId);
    if (listing) {
      await saveRuntimeListing({ ...listing, views: nextCount });
    }
  }

  return nextCount;
}
