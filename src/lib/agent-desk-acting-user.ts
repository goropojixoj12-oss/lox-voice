import { getPlatformUserById, getPlatformAgents } from "@/lib/admin-platform-users";
import { findPlatformUserById } from "@/lib/platform-users-store";
import type { SessionUser } from "@/lib/auth";
import type { DemoUser } from "@/lib/types";
import { agentDeskEditSlug } from "@/lib/admin-edit-agent-paths";
import {
  AGENT_ACTING_USER_ID_HEADER,
  AGENT_ACTING_USER_ID_QUERY,
} from "@/lib/agent-desk-acting-user-constants";

export { AGENT_ACTING_USER_ID_HEADER, AGENT_ACTING_USER_ID_QUERY } from "@/lib/agent-desk-acting-user-constants";
export { agentDeskApiUrl } from "@/lib/agent-desk-acting-user-constants";

export function readActingAgentUserIdFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get(AGENT_ACTING_USER_ID_QUERY)?.trim();
  if (fromQuery) return fromQuery;
  const fromHeader = request.headers.get(AGENT_ACTING_USER_ID_HEADER)?.trim();
  return fromHeader || null;
}

export async function resolveActingAgentUser(
  session: SessionUser,
  request: Request,
): Promise<{ ok: true; user: DemoUser } | { ok: false; status: number; error: string }> {
  if (session.role === "agent") {
    const self = await findPlatformUserById(session.id);
    if (!self || self.role !== "agent") {
      return { ok: false, status: 403, error: "Agent account required." };
    }
    return { ok: true, user: self };
  }

  if (session.role !== "admin") {
    return { ok: false, status: 403, error: "Forbidden." };
  }

  const targetId = readActingAgentUserIdFromRequest(request);
  if (!targetId) {
    return {
      ok: false,
      status: 400,
      error: "Admin must specify agent userId when editing an agent desk.",
    };
  }

  const user = await getPlatformUserById(targetId);
  if (!user || user.role !== "agent") {
    return { ok: false, status: 404, error: "Agent account not found." };
  }

  return { ok: true, user };
}

export async function findAgentByDeskSlug(slug: string): Promise<DemoUser | null> {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;

  const agents = await getPlatformAgents();
  for (const agent of agents) {
    if (agent.id === slug || agent.id === normalized) return agent;
    if (agentDeskEditSlug(agent) === normalized) return agent;
    const emailLocal = agent.email.split("@")[0]?.toLowerCase();
    if (emailLocal === normalized) return agent;
  }
  return null;
}

