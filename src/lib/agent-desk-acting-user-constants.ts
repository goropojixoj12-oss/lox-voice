/** Shared between server resolution and client API calls (no Node imports). */
export const AGENT_ACTING_USER_ID_QUERY = "userId";
export const AGENT_ACTING_USER_ID_HEADER = "x-seaps-agent-user-id";

export function agentDeskApiUrl(path: string, actingUserId: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}${AGENT_ACTING_USER_ID_QUERY}=${encodeURIComponent(actingUserId)}`;
}
