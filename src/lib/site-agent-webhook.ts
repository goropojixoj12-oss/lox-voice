import { brand } from "@/config/brand";
import type { SiteChangeRequest } from "@/lib/site-agent-types";

/** Optional: POST JSON to SITE_AGENT_WEBHOOK_URL when a request is queued. */
export function notifySiteAgentWebhook(request: SiteChangeRequest): void {
  const url = process.env.SITE_AGENT_WEBHOOK_URL?.trim();
  if (!url) return;

  const siteUrl = brand.url.replace(/\/$/, "");
  const attachmentUrl = request.attachment
    ? `${siteUrl}/api/admin/site-requests/file?key=${encodeURIComponent(request.attachment.storageKey)}`
    : null;

  const body = {
    id: request.id,
    message: request.message,
    scope: request.scope,
    createdAt: request.createdAt,
    createdByName: request.createdByName,
    attachmentUrl,
    pullUrl: `${siteUrl}/api/admin/site-requests/pull`,
  };

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((error) => {
    console.error("[site-agent] webhook failed", error);
  });
}
