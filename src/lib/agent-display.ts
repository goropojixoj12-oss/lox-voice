import type { Agent } from "@/lib/types";
import { getAgentProfile } from "@/lib/agent-profile";

export async function resolveAgentPublicName(agent: Agent): Promise<string> {
  if (!agent.platformUserId) return agent.name;
  const profile = await getAgentProfile(agent.platformUserId, {
    name: agent.name,
    email: "",
  });
  const trimmed = profile.fullName.trim();
  return trimmed || agent.name;
}
