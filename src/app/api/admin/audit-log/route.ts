import { NextResponse } from "next/server";
import type { AuditAction } from "@/lib/audit-log";
import { readAuditLog } from "@/lib/audit-log";
import { requireRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const sinceIso = url.searchParams.get("since") ?? undefined;
  const limitStr = url.searchParams.get("limit");
  const limit = limitStr ? Math.min(Number(limitStr) || 200, 2000) : 200;
  const actionsRaw = url.searchParams.get("actions");
  const actions = actionsRaw
    ? (actionsRaw.split(",").filter(Boolean) as AuditAction[])
    : undefined;

  const entries = await readAuditLog(limit, { sinceIso, actions });
  return NextResponse.json({ entries, count: entries.length });
}
