import { NextResponse } from "next/server";
import { extractClientInfo, writeAuditEntry } from "@/lib/audit-log";
import { requireRole } from "@/lib/auth";
import {
  getSiteChangeRequest,
  listSiteChangeRequests,
  updateSiteChangeRequest,
} from "@/lib/site-agent-store";

export const runtime = "nodejs";

/**
 * Admin: put a request back into the queue (retry) or return the current queue.
 *
 * There is no webhook shortcut any more: the single delivery channel is the
 * queue in git, which the agent claims through GET /api/admin/site-requests/pull.
 */
export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let id: string | undefined;
  try {
    const body = (await request.json()) as { id?: string };
    id = typeof body?.id === "string" ? body.id : undefined;
  } catch {
    id = undefined;
  }

  try {
    let item = id ? await getSiteChangeRequest(id) : null;
    if (!item) {
      const items = await listSiteChangeRequests(50);
      item = items.find((r) => r.status === "failed") ?? null;
    }
    if (!item) {
      return NextResponse.json({ error: "No failed request to retry." }, { status: 404 });
    }

    const requeued = await updateSiteChangeRequest(item.id, { status: "queued" });
    const { ip, userAgent } = extractClientInfo(request);
    writeAuditEntry({
      action: "site_change_dispatch",
      userId: session.id,
      userName: session.name,
      email: session.email,
      ip,
      userAgent,
      meta: { requestId: item.id },
    }).catch((err) => console.error("[audit] requeue log failed", err));

    return NextResponse.json({ ok: true, request: requeued });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}