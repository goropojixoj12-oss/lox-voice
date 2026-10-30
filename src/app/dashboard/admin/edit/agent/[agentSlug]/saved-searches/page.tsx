import type { Metadata } from "next";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = await requireAgentForEditSlug((await params).agentSlug);
  return { title: `${agent.name} — saved searches` };
}

export default async function AdminEditAgentSavedSearchesPage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Saved searches · {agent.name}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Saved searches for agent accounts are stored in the browser session when the agent uses
        their desk. Open{" "}
        <strong className="text-[var(--color-text)]">Agent Desk</strong> while signed in as{" "}
        {agent.email} to manage them, or extend server-side saved-search storage in a follow-up.
      </p>
      <p className="mt-4 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
        As admin you can still run searches on their behalf from the public{" "}
        <a href="/search" className="text-[var(--color-accent-soft)] underline">
          search page
        </a>{" "}
        and share links with the agent.
      </p>
    </div>
  );
}
