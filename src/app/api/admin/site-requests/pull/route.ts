import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { authorizeSiteAgent } from "@/lib/site-agent-auth";
import { claimNextSiteChangeRequest } from "@/lib/site-agent-store";

/**
 * Cloud agent: `GET` with `Authorization: Bearer $SITE_AGENT_SECRET` (or `CRON_SECRET`).
 * Returns the oldest queued UI/auth change request and marks it `in_progress`.
 */
export async function GET(request: Request) {
  const auth = await authorizeSiteAgent(request);
  if (!auth.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.viaAdminSession) {
    return NextResponse.json(
      { error: "Use Bearer token for agent pull, not admin session." },
      { status: 400 },
    );
  }

  const item = await claimNextSiteChangeRequest();
  if (!item) return NextResponse.json({ request: null });

  const siteUrl = brand.siteUrl.replace(/\/$/, "");
  const attachmentUrl = item.attachment
    ? `${siteUrl}/api/admin/site-requests/file?key=${encodeURIComponent(item.attachment.storageKey)}`
    : null;

  return NextResponse.json({
    request: {
      ...item,
      attachmentUrl,
    },
  });
}
