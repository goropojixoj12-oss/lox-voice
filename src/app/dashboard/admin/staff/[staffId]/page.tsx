import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCommentsPanel } from "@/components/admin/admin-comments-panel";
import { AdminTaskPanel } from "@/components/admin/admin-task-panel";
import { buildStaffRoster, getAgentByStaffId } from "@/lib/admin-staff";
import { getAdminTasks } from "@/lib/admin-store";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ staffId: string }>;
}): Promise<Metadata> {
  const { staffId } = await params;
  const agent = getAgentByStaffId(staffId);
  return { title: agent ? `${agent.name} — staff` : "Staff" };
}

export default async function AdminStaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  const agent = getAgentByStaffId(staffId);
  if (!agent) notFound();

  const tasks = await getAdminTasks();
  const openByStaff: Record<string, number> = {};
  for (const t of tasks) {
    if (t.status === "done") continue;
    openByStaff[t.assigneeStaffId] = (openByStaff[t.assigneeStaffId] ?? 0) + 1;
  }
  const roster = await buildStaffRoster(openByStaff);
  const row = roster.find((r) => r.staffId === staffId);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <Link href={adminDeskPath("staff")} className="text-sm text-[var(--color-accent-soft)] hover:underline">
        ← All staff
      </Link>
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          {agent.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {agent.title} · {row.agencyName}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Profile complete", `${row.profilePercent}%`],
          ["Listings", row.listingCount],
          ["Pending listings", row.pendingListings],
          ["Leads (inquiries)", row.leadCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="seaps-card rounded-[var(--radius-md)] p-4">
            <p className="text-xs text-[var(--color-muted)]">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {row.profileMissing.length > 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm">
          <p className="font-semibold">Profile gaps</p>
          <ul className="mt-2 list-inside list-disc text-[var(--color-muted)]">
            {row.profileMissing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          {row.platformUserId ? (
            <p className="mt-2 text-xs">
              Agent desk profile:{" "}
              <Link href="/dashboard/agent/profile" className="text-[var(--color-accent-soft)] underline">
                /dashboard/agent/profile
              </Link>{" "}
              (when signed in as that user)
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminTaskPanel staffId={staffId} staffName={agent.name} />
        <AdminCommentsPanel
          subject={{ type: "staff", id: staffId }}
          title="Direct messages & HR notes"
        />
      </div>

      <div className="seaps-card rounded-[var(--radius-lg)] p-4 text-sm">
        <p className="font-semibold">Legal & contracts</p>
        <p className="mt-1 text-[var(--color-muted)]">
          Employment templates and KYC policy live in the{" "}
          <Link href={adminDeskPath("legal")} className="text-[var(--color-accent-soft)] underline">
            legal library
          </Link>
          . Link signed contracts in messages above or in the agent profile documents.
        </p>
      </div>
    </div>
  );
}
