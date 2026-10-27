import type { Agent } from "@/lib/types";

/** Canonical agent portrait URL (uploaded photo or catalog fallback). */
export function agentPhotoUrl(agent: Pick<Agent, "id">): string {
  return `/api/agents/photo/${encodeURIComponent(agent.id)}`;
}
