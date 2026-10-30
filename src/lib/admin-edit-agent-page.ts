import { notFound } from "next/navigation";
import { findAgentByDeskSlug } from "@/lib/agent-desk-acting-user";
import type { DemoUser } from "@/lib/types";

export async function requireAgentForEditSlug(agentSlug: string): Promise<DemoUser> {
  const agent = await findAgentByDeskSlug(agentSlug);
  if (!agent) notFound();
  return agent;
}
