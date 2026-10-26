import type { Metadata } from "next";
import Link from "next/link";
import { AgentOverviewPanel } from "@/components/dashboard/agent-overview-panel";
import { getAgentProfile } from "@/lib/agent-profile";
import { buildAgentOverviewBundle } from "@/lib/agent-desk-metrics";
import { getSession } from "@/lib/auth";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import { getFavorites, getInquiries, getRuntimeListings } from "@/lib/store";

export const metadata: Metadata = { title: "Overview" };

export default async function DashboardOverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const [favorites, inquiries, listings] = await Promise.all([
    getFavorites(session.id),
    getInquiries(),
    getRuntimeListings(),
  ]);

  let agentOverview = null;
  if (session.role === "agent") {
    const profile = await getAgentProfile(session.id, {
      name: session.name,
      email: session.email,
    });
    agentOverview = buildAgentOverviewBundle(
      session.id,
      profile,
      inquiries,
      listings,
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Welcome back, {session.name}
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Role: {session.role}. Manage favorites, inquiries, and your listings from this desk.
      </p>

      {agentOverview ? <AgentOverviewPanel bundle={agentOverview} /> : null}

      <div className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Quick counts
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Favorites", value: favorites.length, href: agentDeskPath("favorites") },
            { label: "Inquiries", value: inquiries.length, href: agentDeskPath("inquiries") },
            {
              label: "Your listings",
              value: listings.filter((l) => l.createdByUserId === session.id).length,
              href: agentDeskPath("listings"),
            },
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
