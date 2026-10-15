import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { runAggregationSync } from "@/lib/aggregations/sync";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/**
 * Pull from registered adapters (demo + public HTML portals), dedupe, store.
 * Admin session OR `Authorization: Bearer $AGGREGATION_SYNC_SECRET` (for cron).
 */
async function authorize(request: Request): Promise<boolean> {
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer) {
    const secrets = [
      process.env.AGGREGATION_SYNC_SECRET,
      process.env.CRON_SECRET,
    ].filter(Boolean) as string[];
    if (secrets.some((s) => bearer === s)) return true;
  }
  const session = await requireRole(["admin"]);
  return Boolean(session);
}

async function handle(request: Request) {
  const limited = rateLimit(clientKey(request, "agg-sync"), {
    limit: 8,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterSec: limited.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } },
    );
  }

  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const adapterParam = url.searchParams.get("adapters");
  const adapterIds = adapterParam
    ? adapterParam.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  const batchParam = url.searchParams.get("batchSize");
  const batchSize = batchParam ? Math.min(50, Math.max(1, Number(batchParam))) : undefined;
  const fullCycle = url.searchParams.get("fullCycle") === "1";

  const summary = await runAggregationSync({
    adapterIds,
    batchSize: Number.isFinite(batchSize) ? batchSize : undefined,
    fullCycle,
  });
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
