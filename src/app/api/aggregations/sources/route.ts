import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getSourcesAdminView } from "@/lib/aggregations/sources/catalog";
import { resetAggregationSourceOverrides } from "@/lib/store";

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

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "resetOverrides") {
    await resetAggregationSourceOverrides();
    const sources = await getSourcesAdminView();
    const enabled = sources.filter((s) => s.enabled).length;
    return NextResponse.json({
      ok: true,
      action: "resetOverrides",
      total: sources.length,
      enabled,
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
