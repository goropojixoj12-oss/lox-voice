import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/states";
import { properties } from "@/data/properties";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { getFavorites } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = await requireAgentForEditSlug((await params).agentSlug);
  return { title: `${agent.name} — favorites` };
}

export default async function AdminEditAgentFavoritesPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);
  const ids = await getFavorites(agent.id);
  const items = properties.filter((p) => ids.includes(p.id));

  if (!items.length) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Favorites · {agent.name}
        </h1>
        <div className="mt-6">
          <EmptyState
            title="No saved homes"
            description={`${agent.name} has not saved any listings to their account yet.`}
            actionHref="/search"
            actionLabel="Browse listings"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Favorites · {agent.name}
      </h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <li key={p.id} className="seaps-card rounded-[var(--radius-md)] p-4">
            <Link href={`/property/${p.slug}`} className="font-semibold hover:underline">
              {p.title}
            </Link>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {p.location.city} · {p.price.toLocaleString()} {p.currency}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
