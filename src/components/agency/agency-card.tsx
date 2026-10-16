import Image from "next/image";
import Link from "next/link";
import type { Agent } from "@/lib/types";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-full">
          <Image src={agent.photo} alt={agent.name} fill className="object-cover" sizes="56px" />
        </div>
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
