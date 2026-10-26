import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { resolveAgentDeskContext } from "@/lib/admin-agent-manage";
import { getSession } from "@/lib/auth";
import { roleDisplayLabel } from "@/lib/platform-roles";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const deskCtx = await resolveAgentDeskContext(session);
  const navRole = deskCtx?.isGodManaging ? deskCtx.deskUser.role : session.role;
  const displayName = deskCtx?.isGodManaging ? deskCtx.deskUser.name : session.name;
  const roleLabel = roleDisplayLabel(session.role);

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <DashboardShell
        role={navRole}
        userName={displayName}
        operatorRoleLabel={roleLabel}
        operatorName={session.name}
        isGodManaging={deskCtx?.isGodManaging ?? false}
        managedAgentName={deskCtx?.isGodManaging ? deskCtx.deskUser.name : undefined}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
