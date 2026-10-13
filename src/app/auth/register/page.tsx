import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a SEAPS account.",
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Registration
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Public self-serve registration is prepared for the next platform upgrade. For now, use the
        SEAPS access accounts below to explore buyer, owner, agent, and admin desks.
      </p>
      <div className="mt-6 space-y-2 break-all rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
        <p>buyer@seaps.com.kh / seaps-buyer-123</p>
        <p>owner@seaps.com.kh / seaps-owner-123</p>
        <p>agent@seaps.com.kh / seaps-agent-123</p>
        <p>admin@seaps.com.kh / seaps-admin-123</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/auth/login">Sign in</ButtonLink>
        <ButtonLink href="/about" variant="outline">
          About SEAPS
        </ButtonLink>
      </div>
      <p className="mt-6 text-sm text-[var(--color-muted)]">
        Need help opening an account?{" "}
        <Link href="/contact" className="font-semibold text-[var(--color-accent)]">
          Contact us
        </Link>
      </p>
    </div>
  );
}
