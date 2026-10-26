import { readStoreJson, writeStoreJson } from "@/lib/store-persistence";
import { getRuntimeListingById, saveRuntimeListing } from "@/lib/store";

const DEDUPE_FILE = "listing-view-dedupe.json";
const DEDUPE_MS = 30 * 60 * 1000;

type ListingViewDedupeEntry = {
  listingId: string;
  sessionKey: string;
  at: string;
};

async function loadDedupe(): Promise<ListingViewDedupeEntry[]> {
  return readStoreJson<ListingViewDedupeEntry[]>(DEDUPE_FILE, []);
}

/** Count a guest view for a runtime listing (once per analytics session per listing per window). */
export async function recordGuestListingView(
  listingId: string,
  sessionKey: string,
): Promise<void> {
  const listing = await getRuntimeListingById(listingId);
  if (!listing || listing.status !== "published") return;

  const sid = sessionKey.slice(0, 64);
  const now = Date.now();
  const dedupe = await loadDedupe();
  const recent = dedupe.find(
    (e) =>
      e.listingId === listingId &&
      e.sessionKey === sid &&
      now - new Date(e.at).getTime() < DEDUPE_MS,
  );
  if (recent) return;

  dedupe.push({
    listingId,
    sessionKey: sid,
    at: new Date().toISOString(),
  });
  await writeStoreJson(DEDUPE_FILE, dedupe.slice(-6000));

  await saveRuntimeListing({
    ...listing,
    views: (listing.views ?? 0) + 1,
  });
}
