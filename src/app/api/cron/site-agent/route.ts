import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import { notifySiteAgentWebhook } from "@/lib/site-agent-webhook";
import { claimNextSiteChangeRequest } from "@/lib/site-agent-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vercel Cron entry: pick the oldest queued site-change request and notify the agent webhook.
 * Auth: `Authorization: Bearer` with `CRON_SECRET` or `SITE_AGENT_SECRET` (Vercel Cron sends CRON_SECRET).
 */
export async function GET(request: Request) {
  const auth = await authorizeSiteAgent(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.viaAdminSession) {
    return NextResponse.json(
      { error: "Use Bearer token (CRON_SECRET or SITE_AGENT_SECRET), not admin session." },
      { status: 400 },
    );
  }

  const webhookConfigured = Boolean(process.env.SITE_AGENT_WEBHOOK_URL?.trim());
  if (!webhookConfigured) {
    return NextResponse.json(
      {
        error: "SITE_AGENT_WEBHOOK_URL is not set. Configure Cursor Automation webhook URL on Vercel.",
        picked: false,
      },
      { status: 503 },
    );
  }

  const item = await claimNextSiteChangeRequest();
  if (!item) {
    return NextResponse.json({ ok: true, picked: false, request: null });
  }

  notifySiteAgentWebhook(item);

  const siteUrl = brand.url.replace(/\/$/, "");
  const attachmentUrl = item.attachment
    ? `${siteUrl}/api/admin/site-requests/file?key=${encodeURIComponent(item.attachment.storageKey)}`
    : null;

  return NextResponse.json({
    ok: true,
    picked: true,
    request: {
      id: item.id,
      message: item.message,
      status: item.status,
      attachmentUrl,
      patchUrl: `${siteUrl}/api/admin/site-requests/${item.id}`,
    },
  });
}
