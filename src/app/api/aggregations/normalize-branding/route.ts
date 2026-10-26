import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { normalizeAggregatedBranding } from "@/lib/aggregations/normalize-branding";

export async function POST() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await normalizeAggregatedBranding();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Normalize failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
