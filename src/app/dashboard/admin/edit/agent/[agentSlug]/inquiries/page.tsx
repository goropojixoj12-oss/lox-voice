import type { Metadata } from "next";
import { EmptyState } from "@/components/shared/states";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { getRuntimeListings, getInquiries } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = await requireAgentForEditSlug((await params).agentSlug);
  return { title: `${agent.name} — inquiries` };
}

export default async function AdminEditAgentInquiriesPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);
  const [inquiries, listings] = await Promise.all([getInquiries(), getRuntimeListings()]);
  const agentListingIds = new Set(
    listings.filter((l) => l.createdByUserId === agent.id).map((l) => l.id),
  );
  const agentInquiries = inquiries.filter((i) => agentListingIds.has(i.propertyId));

  if (!agentInquiries.length) {
    return (
      <EmptyState
        title="No inquiries yet"
        description={`When someone inquires about ${agent.name}'s listings, they appear here.`}
        actionHref="/search"
        actionLabel="Browse listings"
      />
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Inquiries · {agent.name}
      </h1>
      <ul className="mt-5 space-y-3">
        {agentInquiries.map((inquiry) => (
          <li key={inquiry.id} className="rounded-[var(--radius-md)] seaps-card p-4">
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
