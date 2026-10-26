import type { Metadata } from "next";
import { AgentProfilePanel } from "@/components/dashboard/agent-profile-panel";
import { requireAgentDeskContext } from "@/lib/admin-agent-manage";
import { getAgentProfile } from "@/lib/agent-profile";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const operator = await getSession();
  if (!operator) return null;

  const ctx = await requireAgentDeskContext();
  const desk = ctx.deskUser;

  if (desk.role === "agent") {
    const profile = await getAgentProfile(desk.id, {
      name: desk.name,
      email: desk.email,
    });
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          Agent profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          {ctx.isGodManaging
            ? "Edit this agent’s personal details and verification documents on their behalf."
            : "Complete your personal details and upload verification documents for SEAPS onboarding."}
        </p>
        <AgentProfilePanel
          initialProfile={profile}
          sessionRole={ctx.isGodManaging ? "god" : desk.role}
        />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Profile
      </h1>
      <dl className="mt-5 max-w-lg space-y-3 rounded-[var(--radius-lg)] seaps-card p-5">
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Name</dt>
          <dd className="font-semibold">{desk.name}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Email</dt>
          <dd className="font-semibold">{desk.email}</dd>
        </div>
      </dl>
    </div>
  );
}
