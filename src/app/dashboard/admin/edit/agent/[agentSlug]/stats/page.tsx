import type { Metadata } from "next";
import { properties } from "@/data/properties";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { sumPaths } from "@/lib/admin-analytics";
import { getPageViewEvents } from "@/lib/admin-store";
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
  const [runtime, inquiries, events] = await Promise.all([
    getRuntimeListings(),
    getInquiries(),
    getPageViewEvents(),
  ]);
  const agentListings = runtime.filter((l) => l.createdByUserId === agent.id);
  const agentListingIds = new Set(agentListings.map((l) => l.id));
  const agentInquiries = inquiries.filter((i) => agentListingIds.has(i.propertyId));

  const ownSlugs = [
    ...agentListings.map((l) => l.slug),
    ...properties.filter((p) => p.agentId === agent.id).map((p) => p.slug),
  ];
  const traffic = sumPaths(
    events,
    ownSlugs.map((slug) => `/property/${slug}`),
  );

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Performance · {agent.name}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Real analytics of this agent&apos;s own property pages, last 30 days. Unique = distinct
        analytics cookies, not people.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] seaps-card p-5">
          <p className="text-sm text-[var(--color-muted)]">Views of their pages</p>
          <p className="mt-2 text-3xl font-semibold">{traffic.views}</p>
        </div>
        <div className="rounded-[var(--radius-lg)] seaps-card p-5">
          <p className="text-sm text-[var(--color-muted)]">Unique visitors</p>
          <p className="mt-2 text-3xl font-semibold">{traffic.unique}</p>
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
      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Measured on {ownSlugs.length} of their own pages. A page nobody opened shows 0 — nothing here
        is estimated or seeded.
      </p>
    </div>
  );
}
