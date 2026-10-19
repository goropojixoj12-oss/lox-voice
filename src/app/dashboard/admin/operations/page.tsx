import type { Metadata } from "next";
import Link from "next/link";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export const metadata: Metadata = { title: "Operations" };

const LINKS = [
  { href: adminDeskPath("users"), label: "User directory", detail: "Platform login accounts" },
  { href: adminDeskPath("projects"), label: "Projects", detail: "Development inventory" },
  { href: adminDeskPath("articles"), label: "Articles", detail: "Editorial & guides" },
  { href: adminDeskPath("locations"), label: "Locations", detail: "City & district content" },
];

export default function AdminOperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Operations
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Secondary CMS-style tools. Core executive workflows live under analytics, staff, legal, and
          listing moderation.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]"
            >
              <p className="font-semibold">{link.label}</p>
              <p className="text-sm text-[var(--color-muted)]">{link.detail}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
