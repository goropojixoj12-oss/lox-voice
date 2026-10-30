"use client";

import { usePathname } from "next/navigation";
import { AdminDeskShell } from "@/components/admin/admin-desk-shell";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import type { UserRole } from "@/lib/types";

export function DashboardShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminEditAgentDesk = pathname.startsWith("/dashboard/admin/edit/agent/");
  const isAdminDesk = pathname.startsWith("/dashboard/admin");

  if (isAdminEditAgentDesk) {
    return <>{children}</>;
  }

  if (isAdminDesk) {
    return <AdminDeskShell userName={userName}>{children}</AdminDeskShell>;
  }

  return (
    <div className="notranslate mx-auto grid max-w-7xl gap-6 lg:grid-cols-[240px_1fr]">
      <aside>
        <p className="mb-3 text-sm text-[var(--color-muted)]">
          Signed in as <span className="font-semibold text-[var(--color-text)]">{userName}</span> (
          {role})
        </p>
        <DashboardNav role={role} />
      </aside>
      <div>{children}</div>
    </div>
  );
}
