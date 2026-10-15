import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSourcesAdminView } from "@/lib/aggregations/sources/catalog";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sources = await getSourcesAdminView();
  const enabled = sources.filter((s) => s.enabled).length;

  return NextResponse.json({
    total: sources.length,
    enabled,
    sources,
  });
}
