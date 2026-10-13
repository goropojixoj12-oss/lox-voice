import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Register",
  description: "Registration status for SEAPS demo mode.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Registration
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Open self-serve registration is intentionally disabled until PostgreSQL + Prisma user
        tables are connected. Use the seeded demo accounts to explore role-based dashboards.
      </p>
      <div className="mt-6 space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
        <p>buyer@seaps.demo / demo-buyer-123</p>
        <p>owner@seaps.demo / demo-owner-123</p>
        <p>agent@seaps.demo / demo-agent-123</p>
        <p>admin@seaps.demo / demo-admin-123</p>
      </div>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/auth/login">Sign in with demo account</ButtonLink>
        <ButtonLink href="/about" variant="outline">
          Read about the platform
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-[var(--color-muted)]">
        API contract ready at <Link href="/api/auth/register">/api/auth/register</Link> (returns 501
        in demo mode).
      </p>
    </div>
  );
}
