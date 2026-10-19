import { redirect } from "next/navigation";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";

export default async function LegacyAdminSubpathRedirect({
  params,
}: {
  params: Promise<{ legacy: string[] }>;
}) {
  const { legacy } = await params;
  redirect(agentDeskPath("admin", ...legacy));
}
