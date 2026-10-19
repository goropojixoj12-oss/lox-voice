/** Base path for the signed-in agent desk (all cabinet routes live here). */
export const AGENT_DESK_BASE = "/dashboard/agent";

export function agentDeskPath(...segments: string[]): string {
  const tail = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return tail ? `${AGENT_DESK_BASE}/${tail}` : AGENT_DESK_BASE;
}
