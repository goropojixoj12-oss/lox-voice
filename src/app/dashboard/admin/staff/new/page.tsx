import type { Metadata } from "next";
import Link from "next/link";
import { AdminNewAgentForm } from "@/components/admin/admin-new-agent-form";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export const metadata: Metadata = { title: "New agent" };

export default function AdminNewAgentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={adminDeskPath("staff")}
          className="text-sm text-[var(--color-accent-soft)] hover:underline"
        >
          ← Employees
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          New agent
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Create a platform login for a SEAPS agent. The account is saved in the production data store and
          appears in the employees list. The agent can sign in at the same login page as other staff.
        </p>
      </div>
      <AdminNewAgentForm />
    </div>
  );
}
