import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";

export default async function DashboardIndexPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role === "admin") redirect(adminDeskPath());
  redirect(agentDeskPath("overview"));
}
