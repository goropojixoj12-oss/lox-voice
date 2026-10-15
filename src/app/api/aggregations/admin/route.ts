import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getAggregatedListings } from "@/lib/store";

/** Admin JSON — includes contacts + source fields. */
export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await getAggregatedListings();
  return NextResponse.json({ items, total: items.length });
}
