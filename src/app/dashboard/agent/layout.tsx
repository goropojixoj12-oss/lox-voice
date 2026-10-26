import { requireAgentDeskContext } from "@/lib/admin-agent-manage";

/** Agent desk — real agents, or God managing an agent from the admin staff list. */
export default async function AgentDeskLayout({ children }: { children: React.ReactNode }) {
  await requireAgentDeskContext();
  return children;
}
