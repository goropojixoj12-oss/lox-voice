import type { Metadata } from "next";
import Link from "next/link";
import { AdminCommentsPanel } from "@/components/admin/admin-comments-panel";
import { getLegalDocs } from "@/lib/admin-store";

export const metadata: Metadata = { title: "Legal library" };

const CATEGORY_LABEL: Record<string, string> = {
  employment: "Employment",
  compliance: "Compliance",
  listing_policy: "Listings",
  privacy: "Privacy",
  other: "Other",
};

export default async function AdminLegalPage() {
  const docs = await getLegalDocs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Legal & policy archive
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Contracts, compliance, and publication rules. Open a document and leave comments for your
          team (visible to admins).
        </p>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2">
        {docs.map((doc) => (
          <li key={doc.id} className="seaps-card flex flex-col rounded-[var(--radius-lg)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-accent-soft)]">
              {CATEGORY_LABEL[doc.category] ?? doc.category}
            </p>
            <h2 className="mt-1 text-lg font-semibold">{doc.title}</h2>
            <p className="mt-2 flex-1 text-sm text-[var(--color-muted)]">{doc.summary}</p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Updated {new Date(doc.updatedAt).toLocaleDateString()}
            </p>
            <Link
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-fit rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              Open document
            </Link>
            <div className="mt-4">
              <AdminCommentsPanel
                subject={{ type: "legal_doc", id: doc.id }}
                title="Comments on this document"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
