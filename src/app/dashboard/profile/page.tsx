import type { Metadata } from "next";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Profile
      </h1>
      <dl className="mt-5 max-w-lg space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Name</dt>
          <dd className="font-semibold">{session.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Email</dt>
          <dd className="font-semibold">{session.email}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Role</dt>
          <dd className="font-semibold capitalize">{session.role}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        Profile details for your SEAPS account. Contact support to update verified credentials.
      </p>
    </div>
  );
}
