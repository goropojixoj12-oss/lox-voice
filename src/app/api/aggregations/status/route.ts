import { NextResponse } from "next/server";
import {
  getAggregatedListings,
  getAggregationSyncMeta,
  getStorePersistenceBackend,
} from "@/lib/store";
import { getStorePersistenceEnvFlags } from "@/lib/store-persistence";

/** Public health snapshot for Market Feed (no contacts / secrets). */
export async function GET() {
  const [items, meta] = await Promise.all([
    getAggregatedListings(),
    getAggregationSyncMeta(),
  ]);
  const storageBackend = getStorePersistenceBackend();
  const env = getStorePersistenceEnvFlags();
  return NextResponse.json({
    total: items.length,
    storageBackend,
    ephemeralFilesystem: storageBackend === "filesystem" && env.isVercelRuntime,
    env,
    sync: meta
      ? {
          lastRunAt: meta.lastRunAt,
          lastCreated: meta.lastCreated,
          lastUpdated: meta.lastUpdated,
          lastFetched: meta.lastFetched,
          lastTotal: meta.lastTotal,
          lastSourcesAttempted: meta.lastSourcesAttempted,
          lastError: meta.lastError,
          warningCount: meta.lastWarnings.length,
          lastWarnings: meta.lastWarnings.slice(0, 5),
        }
      : null,
  });
}
