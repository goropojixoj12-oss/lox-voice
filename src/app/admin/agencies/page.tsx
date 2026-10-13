import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Agencies" };

export default function AdminAgenciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Manage agencies
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Agency profiles are managed for Cambodia markets. Use these tools to keep published records current.
      </p>
      <Link href="/admin" className="mt-6 inline-block text-sm font-semibold text-[var(--color-accent)]">
        Back to admin overview
      </Link>
    </div>
  );
}
