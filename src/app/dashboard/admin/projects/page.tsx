import type { Metadata } from "next";
import Link from "next/link";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export const metadata: Metadata = { title: "Admin Projects" };

export default function AdminProjectsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Manage projects
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Development projects are managed for Cambodia markets. Use these tools to keep published records current.
      </p>
      <Link href={adminDeskPath()} className="mt-6 inline-block text-sm font-semibold text-[var(--color-accent)]">
        Back to admin overview
      </Link>
    </div>
  );
}
