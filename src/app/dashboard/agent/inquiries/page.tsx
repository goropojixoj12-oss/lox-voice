import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/states";
import { requireRole } from "@/lib/auth";
import { getInquiries } from "@/lib/store";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Inquiries" };

export default async function DashboardInquiriesPage() {
  const session = await requireRole(["owner", "agent", "admin", "buyer"]);
  if (!session) redirect("/auth/login");
  const inquiries = await getInquiries();

  if (!inquiries.length) {
    return (
      <EmptyState
        title="No inquiries yet"
        description="When someone submits a property inquiry form, it appears here."
        actionHref="/search"
        actionLabel="Browse listings"
      />
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Inquiries
      </h1>
      <ul className="mt-5 space-y-3">
        {inquiries.map((inquiry) => (
          <li
            key={inquiry.id}
            className="rounded-[var(--radius-md)] seaps-card p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{inquiry.propertyTitle}</p>
              <span className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
                {inquiry.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {inquiry.name} · {inquiry.contact}
            </p>
            <p className="mt-2 text-sm">{inquiry.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
