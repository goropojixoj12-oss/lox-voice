import { ADMIN_DESK_BASE } from "@/lib/dashboard-admin-paths";
import type { DemoUser } from "@/lib/types";

export const ADMIN_EDIT_AGENT_BASE = `${ADMIN_DESK_BASE}/edit/agent`;

/** URL slug for agent desk edit routes (e.g. adam-james, agent). */
export function agentDeskEditSlug(user: Pick<DemoUser, "name" | "email" | "id">): string {
  const fromName = user.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (fromName) return fromName;
  const local = user.email.split("@")[0]?.trim().toLowerCase();
  if (local) return local.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || user.id;
  return user.id;
}

export function adminEditAgentPath(agentSlug: string, ...segments: string[]): string {
  const slug = agentSlug.replace(/^\/+|\/+$/g, "");
  const tail = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  const base = `${ADMIN_EDIT_AGENT_BASE}/${slug}`;
  return tail ? `${base}/${tail}` : base;
}

export function adminEditAgentListPropertyStepPath(agentSlug: string, stepNumber: number): string {
  const n = Math.min(7, Math.max(1, Math.round(stepNumber)));
  return adminEditAgentPath(agentSlug, "list-property", `step${n}`);
}
