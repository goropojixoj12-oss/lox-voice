"use client";

import { usePathname } from "next/navigation";
import { AdminDeskShell } from "@/components/admin/admin-desk-shell";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { GodAgentManageBanner } from "@/components/dashboard/god-agent-manage-banner";
import type { UserRole } from "@/lib/types";

export function DashboardShell({
  role,
  userName,
  operatorRoleLabel,
  operatorName,
  isGodManaging,
  managedAgentName,
  children,
}: {
  role: UserRole;
  userName: string;
  operatorRoleLabel: string;
  operatorName: string;
  isGodManaging: boolean;
  managedAgentName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminDesk = pathname.startsWith("/dashboard/admin");

  if (isAdminDesk) {
    return (
      <AdminDeskShell userName={operatorName} roleLabel={operatorRoleLabel}>
        {children}
      </AdminDeskShell>
    );
  }

  return (
    <div className="notranslate mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
      <aside>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          {isGodManaging ? (
            <>
              Managing{" "}
              <span className="font-semibold text-[var(--color-text)]">{userName}</span> as{" "}
              <span className="font-semibold text-[var(--color-text)]">{operatorName}</span> (
              {operatorRoleLabel})
            </>
          ) : (
            <>
              Signed in as{" "}
              <span className="font-semibold text-[var(--color-text)]">{userName}</span> (
              {operatorRoleLabel})
            </>
          )}
        </p>
        <DashboardNav role={role} showAdminLink={operatorRoleLabel === "God"} />
      </aside>
      <div>
        {isGodManaging && managedAgentName ? (
          <GodAgentManageBanner agentName={managedAgentName} />
        ) : null}
        {children}
      </div>
    </div>
  );
}
