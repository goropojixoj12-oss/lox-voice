import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { runAggregationSync } from "@/lib/aggregations/sync";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  getStorePersistenceBackend,
  saveAggregationSyncMeta,
} from "@/lib/store";

/**
 * Pull from registered adapters (demo + public HTML portals), dedupe, store.
 * Admin session OR `Authorization: Bearer $AGGREGATION_SYNC_SECRET` (for cron).
 */
type SyncAuth = { ok: true; viaAdminSession: boolean } | { ok: false };

async function authorize(request: Request): Promise<SyncAuth> {
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer) {
    const secrets = [
      process.env.AGGREGATION_SYNC_SECRET,
      process.env.CRON_SECRET,
    ].filter(Boolean) as string[];
    if (secrets.some((s) => bearer === s)) return { ok: true, viaAdminSession: false };
  }
  const session = await requireRole(["admin"]);
  if (session) return { ok: true, viaAdminSession: true };
  return { ok: false };
}

async function handle(request: Request) {
  const auth = await authorize(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(clientKey(request, "agg-sync"), {
    // Admin “full import” loops many batches from the browser; cron stays tight.
    limit: auth.viaAdminSession ? 120 : 8,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterSec: limited.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  const url = new URL(request.url);
  const adapterParam = url.searchParams.get("adapters");
  const adapterIds = adapterParam
    ? adapterParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const batchParam = url.searchParams.get("batchSize");
  const batchSize = batchParam ? Math.min(50, Math.max(1, Number(batchParam))) : undefined;
  const fullCycle = url.searchParams.get("fullCycle") === "1";

  try {
    const summary = await runAggregationSync({
      adapterIds,
      batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
      fullCycle,
    });

    const warnings = [...summary.warnings];
    if (getStorePersistenceBackend() === "filesystem") {
      warnings.unshift(
        "Storage is ephemeral JSON on disk (/tmp on Vercel). Connect Vercel Blob or Redis (KV_REST_API_*) so listings persist across instances.",
      );
    }

    try {
      await saveAggregationSyncMeta({
        lastRunAt: new Date().toISOString(),
        lastCreated: summary.created,
        lastUpdated: summary.updated,
        lastFetched: summary.fetched,
        lastSkippedNonRe: summary.skippedNonRe,
        lastTotal: summary.total,
        lastSourcesAttempted: summary.sourcesAttempted,
        lastWarnings: warnings.slice(0, 20),
        lastError: null,
      });
    } catch (metaErr) {
      const metaMessage =
        metaErr instanceof Error ? metaErr.message : "failed to save sync metadata";
      throw new Error(`Sync completed but metadata write failed: ${metaMessage}`);
    }

    return NextResponse.json({
      ok: true,
      storageBackend: getStorePersistenceBackend(),
      ...summary,
      warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "sync failed";
    await saveAggregationSyncMeta({
      lastRunAt: new Date().toISOString(),
      lastCreated: 0,
      lastUpdated: 0,
      lastFetched: 0,
      lastTotal: 0,
      lastSourcesAttempted: 0,
      lastWarnings: [],
      lastError: message,
    }).catch(() => undefined);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
