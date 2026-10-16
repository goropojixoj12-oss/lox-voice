import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { PropertyGrid } from "@/components/property/property-card";
import { agents, getAgent } from "@/data/agencies";
import { getPropertiesByAgent } from "@/data/properties";
import { getSession } from "@/lib/auth";

export function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return { title: "Agent not found" };
  return { title: agent.name, description: agent.bio };
}

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) notFound();
  const listings = getPropertiesByAgent(agent.id);
  const session = await getSession();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.3fr]">
        <aside className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <div className="relative mx-auto h-40 w-40 overflow-hidden rounded-full">
            <Image src={agent.photo} alt={agent.name} fill className="object-cover" sizes="160px" />
          </div>
          <h1 className="mt-5 text-center font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            {agent.name}
          </h1>
          <p className="mt-1 text-center text-[var(--color-muted)]">{agent.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">{agent.bio}</p>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Languages:</span> {agent.languages.join(", ")}
            </p>
            <p>
              <span className="font-semibold">Focus:</span> {agent.specializations.join(", ")}
            </p>
            <p>{agent.verified ? "Verified agent profile" : "Verification pending"}</p>
          </div>
          <div className="mt-6">
            <InquiryForm propertyId={agent.id} propertyTitle={`Inquiry for ${agent.name}`} />
          </div>
        </aside>
        <section>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
            Listings
          </h2>
          <PropertyGrid items={listings} userId={session?.id} />
        </section>
      </div>
    </div>
  );
}
