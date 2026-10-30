import type { Metadata } from "next";
import Link from "next/link";
import { AgentOverviewPanel } from "@/components/dashboard/agent-overview-panel";
import { adminEditAgentPath } from "@/lib/admin-edit-agent-paths";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { getAgentProfile } from "@/lib/agent-profile";
import { buildAgentOverviewBundle } from "@/lib/agent-desk-metrics";
import { getFavorites, getInquiries, getRuntimeListings } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const { agentSlug } = await params;
  const agent = await findAgentByDeskSlugSafe(agentSlug);
  return { title: agent ? `${agent.name} — agent desk` : "Agent desk" };
}

async function findAgentByDeskSlugSafe(slug: string) {
  try {
    return await requireAgentForEditSlug(slug);
  } catch {
    return null;
  }
}

export default async function AdminEditAgentOverviewPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);

  const [favorites, inquiries, listings] = await Promise.all([
    getFavorites(agent.id),
    getInquiries(),
    getRuntimeListings(),
  ]);

  const profile = await getAgentProfile(agent.id, {
    name: agent.name,
    email: agent.email,
  });
  const agentOverview = buildAgentOverviewBundle(agent.id, profile, inquiries, listings);

  const agentListings = listings.filter((l) => l.createdByUserId === agent.id);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        {agent.name}
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Agent desk · {agent.email}. You are editing this account as admin — changes apply to their
        profile, listings, and desk data.
      </p>

      <AgentOverviewPanel bundle={agentOverview} />

      <div className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Quick counts
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Favorites",
              value: favorites.length,
              href: adminEditAgentPath(agentSlug, "favorites"),
            },
            {
              label: "Inquiries",
              value: inquiries.filter((i) =>
                agentListings.some((l) => l.id === i.propertyId),
              ).length,
              href: adminEditAgentPath(agentSlug, "inquiries"),
            },
            { label: "Listings", value: agentListings.length, href: adminEditAgentPath(agentSlug, "listings") },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="rounded-[var(--radius-lg)] seaps-card p-5 transition hover:border-[rgba(212,175,55,0.55)]"
            >
              <p className="text-sm text-[var(--color-muted)]">{card.label}</p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{card.value}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
