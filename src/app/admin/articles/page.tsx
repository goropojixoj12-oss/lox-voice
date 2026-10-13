import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Admin Articles" };

export default function AdminArticlesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Manage articles
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Editorial content is seeded in src/data/articles.ts. Connect Prisma mutations to enable create/update/archive workflows here.
      </p>
      <Link href="/admin" className="mt-6 inline-block text-sm font-semibold text-[var(--color-accent)]">
        Back to admin overview
      </Link>
    </div>
  );
}
