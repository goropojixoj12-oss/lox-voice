import Link from "next/link";
import type { Agent } from "@/lib/types";
import { AgentAvatar } from "@/components/agency/agent-avatar";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <AgentAvatar agent={agent} size="sm" />
        <div>
          <Link href={`/agents/${agent.slug}`} className="font-semibold text-[var(--color-accent-soft)]">
            {agent.name}
          </Link>
          <p className="text-sm text-[var(--color-muted)]">{agent.title}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-[var(--color-muted)]">{agent.bio}</p>
    </article>
  );
}
