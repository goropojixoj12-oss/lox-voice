import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import { hasAdminDeskAccess } from "@/lib/platform-roles";

export default async function DashboardIndexPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (hasAdminDeskAccess(session.role)) redirect(adminDeskPath());
  redirect(agentDeskPath("overview"));
}
