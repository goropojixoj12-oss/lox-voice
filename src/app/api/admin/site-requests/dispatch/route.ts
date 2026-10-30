import { NextResponse } from "next/server";
import { extractClientInfo, writeAuditEntry } from "@/lib/audit-log";
import { requireRole } from "@/lib/auth";
import { notifySiteAgentWebhook } from "@/lib/site-agent-webhook";
import { getSiteChangeRequest, listSiteChangeRequests } from "@/lib/site-agent-store";

export const runtime = "nodejs";

/** Admin: re-send webhook for a queued request (manual test / retry). */
export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const webhookConfigured = Boolean(process.env.SITE_AGENT_WEBHOOK_URL?.trim());
  const bearerConfigured = Boolean(
    process.env.SITE_AGENT_WEBHOOK_BEARER?.trim() ??
      process.env.CURSOR_AUTOMATION_WEBHOOK_KEY?.trim(),
  );

  let id: string | undefined;
  try {
    const body = (await request.json()) as { id?: string };
    id = typeof body?.id === "string" ? body.id : undefined;
  } catch {
    id = undefined;
  }

  let item = id ? await getSiteChangeRequest(id) : null;
  if (!item) {
    const items = await listSiteChangeRequests(50);
    item = items.find((r) => r.status === "queued") ?? null;
  }

  if (!item) {
    return NextResponse.json(
      { error: "No queued request to dispatch.", webhookConfigured, bearerConfigured },
      { status: 404 },
    );
  }

  if (item.status !== "queued") {
    return NextResponse.json(
      {
        error: `Request is "${item.status}", not queued. Only queued items can be dispatched.`,
        requestId: item.id,
      },
      { status: 400 },
    );
  }

  if (!webhookConfigured) {
    return NextResponse.json(
      {
        error: "SITE_AGENT_WEBHOOK_URL is not set on the server.",
        webhookConfigured: false,
        bearerConfigured,
      },
      { status: 503 },
    );
  }

  const { ip, userAgent } = extractClientInfo(request);
  writeAuditEntry({
    action: "site_change_dispatch",
    userId: session.id,
    userName: session.name,
    email: session.email,
    ip,
    userAgent,
    meta: { requestId: item.id },
  }).catch((err) => console.error("[audit] dispatch log failed", err));

  notifySiteAgentWebhook(item);

  return NextResponse.json({
    ok: true,
    dispatched: item.id,
    webhookConfigured: true,
    bearerConfigured,
    messagePreview: item.message.slice(0, 120),
  });
}
