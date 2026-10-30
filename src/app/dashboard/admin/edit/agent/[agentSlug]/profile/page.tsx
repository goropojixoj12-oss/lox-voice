import type { Metadata } from "next";
import { AgentProfilePanel } from "@/components/dashboard/agent-profile-panel";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";
import { getAgentProfile } from "@/lib/agent-profile";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = await requireAgentForEditSlug((await params).agentSlug);
  return { title: `${agent.name} — profile` };
}

export default async function AdminEditAgentProfilePage({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);
  const profile = await getAgentProfile(agent.id, {
    name: agent.name,
    email: agent.email,
  });

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Agent profile
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        Edit {agent.name}&apos;s desk profile, documents, and contact details. The agent can still
        sign in with their own password; you are not switching sessions.
      </p>
      <AgentProfilePanel
        initialProfile={profile}
        sessionRole="admin"
        actingUserId={agent.id}
      />
    </div>
  );
}
