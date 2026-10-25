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
        Public self-serve registration is prepared for the next platform upgrade. If you already
        have SEAPS credentials, sign in to access your desk.
      </p>
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
