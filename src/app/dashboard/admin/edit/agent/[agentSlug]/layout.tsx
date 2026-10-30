import { notFound, redirect } from "next/navigation";
import { AdminAgentEditDeskShell } from "@/components/admin/admin-agent-edit-desk-shell";
import { findAgentByDeskSlug } from "@/lib/agent-desk-acting-user";
import { getSession } from "@/lib/auth";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export default async function AdminEditAgentLayout({
  params,
  children,
}: {
  params: Promise<{ agentSlug: string }>;
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");
  if (session.role !== "admin") redirect(adminDeskPath());

  const { agentSlug } = await params;
  const agent = await findAgentByDeskSlug(agentSlug);
  if (!agent) notFound();

  return (
    <AdminAgentEditDeskShell
      agentSlug={agentSlug}
      agentLabel={agent.name}
      adminName={session.name}
    >
      {children}
    </AdminAgentEditDeskShell>
  );
}
