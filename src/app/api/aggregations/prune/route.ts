import { NextResponse } from "next/server";
import { adminAggregationControlEnabled, adminAggregationForbiddenResponse } from "@/lib/admin-platform-safety";
import { pruneNonRealEstateListings } from "@/lib/aggregations/prune-non-re";
import { requireRole } from "@/lib/auth";
import { getStorePersistenceBackend } from "@/lib/store";

export async function POST() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!adminAggregationControlEnabled()) {
    return adminAggregationForbiddenResponse();
  }

  try {
    const result = await pruneNonRealEstateListings();
    return NextResponse.json({
      ok: true,
      storageBackend: getStorePersistenceBackend(),
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prune failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
