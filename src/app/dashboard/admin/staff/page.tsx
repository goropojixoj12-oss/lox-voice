import type { Metadata } from "next";
import Link from "next/link";
import { buildStaffRoster } from "@/lib/admin-staff";
import { getAdminTasks } from "@/lib/admin-store";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export const metadata: Metadata = { title: "Staff & performance" };

export default async function AdminStaffPage() {
  const tasks = await getAdminTasks();
  const openByStaff: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status === "done") continue;
    openByStaff[t.assigneeStaffId] = (openByStaff[t.assigneeStaffId] ?? 0) + 1;
  }
  const roster = await buildStaffRoster(openByStaff);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Staff & performance
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Profile completion, listings, leads, and open tasks. Open a manager to assign work and
          leave messages.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[var(--color-mist)]/60 text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">Agent</th>
              <th className="p-3">Desk</th>
              <th className="p-3 text-right">Profile</th>
              <th className="p-3 text-right">Listings</th>
              <th className="p-3 text-right">Pending</th>
              <th className="p-3 text-right">Leads</th>
              <th className="p-3 text-right">Tasks</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {roster.map((row) => (
              <tr key={row.staffId} className="border-t border-[var(--color-border)]">
                <td className="p-3">
                  <p className="font-semibold">{row.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">{row.title}</p>
                </td>
                <td className="p-3">{row.agencyName}</td>
                <td className="p-3 text-right">{row.profilePercent}%</td>
                <td className="p-3 text-right">{row.listingCount}</td>
                <td className="p-3 text-right">{row.pendingListings}</td>
                <td className="p-3 text-right">{row.leadCount}</td>
                <td className="p-3 text-right">{row.openTasks}</td>
                <td className="p-3 text-right">
                  <Link
                    href={adminDeskPath("staff", row.staffId)}
                    className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[#0B1C33]"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
