import {
  AGENT_ACTING_USER_ID_HEADER,
  agentDeskApiUrl,
} from "@/lib/agent-desk-acting-user-constants";

export function withActingAgentUser(
  actingUserId: string | undefined,
  init?: RequestInit,
): RequestInit {
  if (!actingUserId) return init ?? {};
  const headers = new Headers(init?.headers);
  headers.set(AGENT_ACTING_USER_ID_HEADER, actingUserId);
  return { ...init, headers };
}

export function agentProfileApiPath(
  path: string,
  actingUserId: string | undefined,
): string {
  if (!actingUserId) return path;
  return agentDeskApiUrl(path, actingUserId);
}
