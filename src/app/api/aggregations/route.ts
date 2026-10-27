import { NextResponse } from "next/server";
import { toPublicAggregatedListings } from "@/lib/aggregations/sanitize";
import { getAggregatedListings } from "@/lib/store";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/** Public JSON — never includes contacts or source identity. */
export async function GET(request: Request) {
  const limited = rateLimit(clientKey(request, "agg-public"), {
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Rate limited", retryAfterSec: limited.retryAfterSec },
      { status: 429 },
    );
  }

  const items = toPublicAggregatedListings(await getAggregatedListings());
  return NextResponse.json({
    items,
    total: items.length,
  });
}
