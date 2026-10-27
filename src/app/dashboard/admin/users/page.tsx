import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDirectoryUsers } from "@/lib/admin-platform-users";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export const metadata: Metadata = { title: "Platform accounts" };

export default function AdminUsersPage() {
  const users = getAdminDirectoryUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Platform accounts
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Real platform accounts only. Adam James (agent@seaps.com.kh) is the live agent login; buyer/owner demo logins are
          hidden. Public catalog agent names (seed data) are not listed here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-[var(--color-mist)]/60 text-left text-[var(--color-muted)]">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-[var(--color-border)]">
                <td className="p-3 font-semibold">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role}</td>
                <td className="p-3 text-right">
                  {user.role === "agent" ? (
                    <Link
                      href={adminDeskPath("staff", user.id)}
                      className="text-[var(--color-accent-soft)] underline"
                    >
                      Agent desk
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link href={adminDeskPath()} className="text-sm font-semibold text-[var(--color-accent)]">
        ← Back to analytics
      </Link>
    </div>
  );
}
