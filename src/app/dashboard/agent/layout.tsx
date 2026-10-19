import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

/** Agent desk is for agent/owner/buyer workflows — admins use `/dashboard/admin`. */
export default async function AgentDeskLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session?.role === "admin") {
    redirect(adminDeskPath());
  }
  return children;
}
