import { brand } from "@/config/brand";
import { assessSiteChangeMessage } from "@/lib/site-change-risk";
import type { SiteChangeRequest } from "@/lib/site-agent-types";

/** Optional: POST JSON to SITE_AGENT_WEBHOOK_URL when a request is queued. */
export function notifySiteAgentWebhook(request: SiteChangeRequest): void {
  const url = process.env.SITE_AGENT_WEBHOOK_URL?.trim();
  if (!url) return;

  const siteUrl = brand.url.replace(/\/$/, "");
  const attachmentUrl = request.attachment
    ? `${siteUrl}/api/admin/site-requests/file?key=${encodeURIComponent(request.attachment.storageKey)}`
    : null;

  const patchUrl = `${siteUrl}/api/admin/site-requests/${request.id}`;
  const risk = assessSiteChangeMessage(request.message);
  const body = {
    id: request.id,
    message: request.message,
    scope: request.scope,
    createdAt: request.createdAt,
    createdByName: request.createdByName,
    attachmentUrl,
    pullUrl: `${siteUrl}/api/admin/site-requests/pull`,
    patchUrl,
    repository: "https://github.com/goropojixoj12-oss/lox-voice",
    branch: "main",
    riskLevel: risk.level,
    riskTopics: risk.topics,
    task: [
      "SEAPS site change (public UI and signed-in flows only).",
      risk.level === "critical"
        ? `CRITICAL SETTINGS WARNING — topics: ${risk.topics.join(", ")}. Do not change env, deploy config, secrets, or repo infrastructure unless the request explicitly requires it and is safe. Prefer UI-only diffs.`
        : null,
      `Request: ${request.message}`,
      attachmentUrl ? `Screenshot: ${attachmentUrl}` : null,
      "Implement on GitHub goropojixoj12-oss/lox-voice branch main, push github main for Vercel production.",
      `When done, PATCH ${patchUrl} with Bearer SITE_AGENT_SECRET JSON: {"status":"done","commitUrl":"<github commit or deploy url>","agentNote":"..."}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const webhookBearer =
    process.env.SITE_AGENT_WEBHOOK_BEARER?.trim() ??
    process.env.CURSOR_AUTOMATION_WEBHOOK_KEY?.trim();
  if (webhookBearer) {
    headers.Authorization = `Bearer ${webhookBearer}`;
  }

  void fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((error) => {
    console.error("[site-agent] webhook failed", error);
  });
}
