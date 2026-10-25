import { requireRole } from "@/lib/auth";

export type SiteAgentAuth =
  | { ok: true; viaAdminSession: boolean }
  | { ok: false };

/** Admin session or Bearer `SITE_AGENT_SECRET` / `CRON_SECRET` (for cloud agent pull). */
export async function authorizeSiteAgent(request: Request): Promise<SiteAgentAuth> {
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer) {
    const secrets = [process.env.SITE_AGENT_SECRET, process.env.CRON_SECRET].filter(
      Boolean,
    ) as string[];
    if (secrets.some((s) => bearer === s)) return { ok: true, viaAdminSession: false };
  }
  const session = await requireRole(["admin"]);
  if (session) return { ok: true, viaAdminSession: true };
  return { ok: false };
}
