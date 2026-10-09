import Image from "next/image";
import Link from "next/link";
import type { Agency, Agent } from "@/lib/types";

export function AgencyCard({ agency }: { agency: Agency }) {
  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="relative h-36">
        <Image src={agency.cover} alt="" fill className="object-cover" sizes="400px" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border border-[var(--color-border)]">
            <Image src={agency.logo} alt="" fill className="object-cover" sizes="48px" />
          </div>
          <div>
            <Link href={`/agencies/${agency.slug}`} className="font-semibold text-[var(--color-primary)]">
              {agency.name}
            </Link>
            <p className="text-sm text-[var(--color-muted)]">
              {agency.city} · {agency.propertyCount} listings
            </p>
          </div>
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-[var(--color-muted)]">{agency.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {agency.verified ? (
            <span className="rounded-full bg-[var(--color-mist)] px-2 py-1 text-xs">Verified profile</span>
          ) : (
            <span className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-xs">
              Verification pending
            </span>
          )}
          {agency.specializations.slice(0, 2).map((item) => (
            <span key={item} className="rounded-full bg-[var(--color-secondary)] px-2 py-1 text-xs">
              {item}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-full">
          <Image src={agent.photo} alt={agent.name} fill className="object-cover" sizes="56px" />
        </div>
        <div>
          <Link href={`/agents/${agent.slug}`} className="font-semibold text-[var(--color-primary)]">
            {agent.name}
          </Link>
          <p className="text-sm text-[var(--color-muted)]">{agent.title}</p>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-[var(--color-muted)]">{agent.bio}</p>
    </article>
  );
}
