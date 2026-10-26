import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDirectoryUsers } from "@/lib/admin-platform-users";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { getRuntimeListings } from "@/lib/store";
import type { DemoUser } from "@/lib/types";

export const metadata: Metadata = { title: "User directory" };

const ROLE_LABEL: Record<DemoUser["role"], string> = {
  admin: "Administrator",
  agent: "Agent",
  buyer: "Buyer",
  owner: "Owner",
};

export default async function AdminUsersPage() {
  const [users, runtime] = await Promise.all([
    getAdminDirectoryUsers(),
    getRuntimeListings(),
  ]);

  const runtimeListingsByUser = new Map<string, number>();
  for (const user of users) {
    runtimeListingsByUser.set(
      user.id,
      runtime.filter((listing) => listing.createdByUserId === user.id).length,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          User directory
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Platform login accounts with staff roles. Demo buyer and owner logins are excluded from
          this directory — they are not agent staff.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--color-mist)]/60 text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3 text-right">Runtime listings</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-[var(--color-muted)]">
                  No platform accounts in the directory yet.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-t border-[var(--color-border)]">
                  <td className="p-3 font-semibold">{user.name}</td>
                  <td className="p-3 font-mono text-xs">{user.email}</td>
                  <td className="p-3">{ROLE_LABEL[user.role]}</td>
                  <td className="p-3 text-right">
                    {runtimeListingsByUser.get(user.id) ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Link
        href={adminDeskPath("operations")}
        className="inline-block text-sm font-semibold text-[var(--color-accent)]"
      >
        ← Operations
      </Link>
    </div>
  );
}
