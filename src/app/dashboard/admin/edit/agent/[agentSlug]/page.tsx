import { redirect } from "next/navigation";
import { adminEditAgentPath } from "@/lib/admin-edit-agent-paths";

export default async function AdminEditAgentIndexPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  redirect(adminEditAgentPath(agentSlug, "overview"));
}
