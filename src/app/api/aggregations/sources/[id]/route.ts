import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { getCatalogSources } from "@/lib/aggregations/sources/catalog";
import { setAggregationSourceEnabled } from "@/lib/store";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireRole(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const exists = getCatalogSources().some((s) => s.id === id);
  if (!exists) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  let body: { enabled?: boolean };
  try {
    body = (await request.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return NextResponse.json({ error: "enabled (boolean) required" }, { status: 400 });
  }

  await setAggregationSourceEnabled(id, body.enabled);
  return NextResponse.json({ ok: true, id, enabled: body.enabled });
}
