import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/states";
import { adminEditAgentListPropertyStepPath, adminEditAgentPath } from "@/lib/admin-edit-agent-paths";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { getRuntimeListings } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = await requireAgentForEditSlug((await params).agentSlug);
  return { title: `${agent.name} — listings` };
}

export default async function AdminEditAgentListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentSlug: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { agentSlug } = await params;
  const { submitted } = await searchParams;
  const agent = await requireAgentForEditSlug(agentSlug);
  const listings = (await getRuntimeListings()).filter((l) => l.createdByUserId === agent.id);

  const wizardEntry = adminEditAgentListPropertyStepPath(agentSlug, 1);

  if (!listings.length) {
    return (
      <EmptyState
        title="No runtime listings yet"
        description={`Create a listing on behalf of ${agent.name}. Submissions appear here after save.`}
        actionHref={wizardEntry}
        actionLabel="Create listing"
      />
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Listings · {agent.name}
      </h1>
      {submitted === "pending" ? (
        <p className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-mist)] px-4 py-3 text-sm text-[var(--color-text)]">
          Listing sent to <strong>moderation</strong> under this agent account.
        </p>
      ) : null}
      <ul className="mt-5 space-y-3">
        {listings.map((listing) => (
          <li key={listing.id} className="rounded-[var(--radius-md)] seaps-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/property/${listing.slug}`} className="font-semibold">
                  {listing.title}
                </Link>
                <p className="text-sm text-[var(--color-muted)]">
                  Status: {listing.status} · {listing.location.city}
                </p>
              </div>
              <Link href={wizardEntry} className="text-sm text-[var(--color-accent)]">
                Create another
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-[var(--color-muted)]">
        <Link href={adminEditAgentPath(agentSlug, "overview")} className="text-[var(--color-accent-soft)] underline">
          Back to overview
        </Link>
      </p>
    </div>
  );
}
