import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import { claimNextSiteChangeRequest } from "@/lib/site-agent-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron entry: claim the oldest queued admin request and hand it to the caller.
 *
 * There is no webhook relay: the queue itself is stored in the repository
 * (content/requests.json), so an agent running on a schedule can read it with
 * GET /api/admin/site-requests/pull and this route simply advances the state.
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

  try {
    const item = await claimNextSiteChangeRequest();
    if (!item) {
      return NextResponse.json({ ok: true, picked: false, request: null });
    }

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
        scope: item.scope,
        status: item.status,
        attachmentUrl,
        patchUrl: `${siteUrl}/api/admin/site-requests/${item.id}`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}