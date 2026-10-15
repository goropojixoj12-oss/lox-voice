import { getAggregatedListings } from "@/lib/store";
import { runAggregationSync } from "./sync";

let seedPromise: Promise<void> | null = null;

/**
 * Ensure Market Feed has rows on first visit (demo adapter). Idempotent —
 * subsequent calls are no-ops when store already has listings.
 */
export async function ensureAggregationsSeeded(): Promise<void> {
  const existing = await getAggregatedListings();
  if (existing.length > 0) return;

  if (!seedPromise) {
    seedPromise = runAggregationSync({
      adapterIds: ["demo"],
      includeRegistry: false,
    })
      .then(() => undefined)
      .catch(() => {
        seedPromise = null;
      });
  }
  await seedPromise;
}
