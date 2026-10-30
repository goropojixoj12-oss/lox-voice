import type { Metadata } from "next";
import { properties } from "@/data/properties";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { getRuntimeListings, getInquiries } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = await requireAgentForEditSlug((await params).agentSlug);
  return { title: `${agent.name} — stats` };
}

export default async function AdminEditAgentStatsPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);
  const [runtime, inquiries] = await Promise.all([getRuntimeListings(), getInquiries()]);
  const agentListings = runtime.filter((l) => l.createdByUserId === agent.id);
  const agentListingIds = new Set(agentListings.map((l) => l.id));
  const agentInquiries = inquiries.filter((i) => agentListingIds.has(i.propertyId));
  const views = properties.reduce((sum, p) => sum + (p.views ?? 0), 0);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Performance · {agent.name}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Desk metrics for this agent account (catalog views are site-wide reference).
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] seaps-card p-5">
          <p className="text-sm text-[var(--color-muted)]">Catalog views (site)</p>
          <p className="mt-2 text-3xl font-semibold">{views}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] seaps-card p-5">
          <p className="text-sm text-[var(--color-muted)]">Runtime listings</p>
          <p className="mt-2 text-3xl font-semibold">{agentListings.length}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] seaps-card p-5">
          <p className="text-sm text-[var(--color-muted)]">Inquiries on their listings</p>
          <p className="mt-2 text-3xl font-semibold">{agentInquiries.length}</p>
        </div>
      </div>
    </div>
  );
}
