import Link from "next/link";
import type { Agent } from "@/lib/types";
import { AgentAvatar } from "@/components/agency/agent-avatar";

export function AgentListingSnippet({
  agent,
  listedByName,
  listedByTitle,
}: {
  agent: Agent;
  listedByName?: string;
  listedByTitle?: string;
}) {
  const displayName = listedByName ?? agent.name;
  const displayTitle = listedByTitle ?? agent.title;

  return (
    <div className="flex items-center gap-3">
      <AgentAvatar agent={agent} size="sm" />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Listed by</p>
        {listedByName ? (
          <p className="mt-0.5 truncate font-semibold uppercase tracking-wide text-[var(--color-accent-soft)]">
            {displayName}
          </p>
        ) : (
          <Link
            href={`/agents/${agent.slug}`}
            className="mt-0.5 block truncate font-semibold text-[var(--color-accent-soft)]"
          >
            {displayName}
          </Link>
        )}
        <p className="truncate text-sm text-[var(--color-muted)]">{displayTitle}</p>
      </div>
    </div>
  );
}
