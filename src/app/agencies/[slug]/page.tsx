import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AgentCard } from "@/components/agency/agency-card";
import { InquiryForm } from "@/components/forms/inquiry-form";
import { PropertyGrid } from "@/components/property/property-card";
import { agencies, getAgency, getAgentsByAgency } from "@/data/agencies";
import { getPropertiesByAgency } from "@/data/properties";
import { getSession } from "@/lib/auth";

export function generateStaticParams() {
  return agencies.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agency = getAgency(slug);
  if (!agency) return { title: "Agency not found" };
  return { title: agency.name, description: agency.description };
}

export default async function AgencyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agency = getAgency(slug);
  if (!agency) notFound();
  const agents = getAgentsByAgency(agency.id);
  const listings = getPropertiesByAgency(agency.id);
  const session = await getSession();

  return (
    <div>
      <div className="relative h-56 md:h-72">
        <Image src={agency.cover} alt={`${agency.name} cover`} fill className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[var(--color-primary)]/55" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="-mt-16 mb-8 flex flex-col gap-4 rounded-[var(--radius-xl)] seaps-card p-5 shadow-[var(--shadow-soft)] md:flex-row md:items-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-[var(--color-border)]">
            <Image src={agency.logo} alt={`${agency.name} logo`} fill className="object-cover" sizes="80px" />
          </div>
          <div className="flex-1">
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
              {agency.name}
            </h1>
            <p className="mt-1 text-[var(--color-muted)]">
              {agency.city} · Founded {agency.foundedYear} · {agency.propertyCount} listings
            </p>
            <p className="mt-2 text-sm">
              {agency.verified ? "Verified agency profile" : "Verification pending"}
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-8">
            <section>
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                About
              </h2>
              <p className="mt-3 text-[var(--color-muted)]">{agency.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {agency.specializations.map((item) => (
                  <span key={item} className="rounded-full bg-[var(--color-mist)] px-3 py-1 text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                Agents
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {agents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]">
                Listings
              </h2>
              <PropertyGrid items={listings} userId={session?.id} />
            </section>
          </div>
          <aside>
            <InquiryForm propertyId={agency.id} propertyTitle={`${agency.name} agency contact`} />
          </aside>
        </div>
      </div>
    </div>
  );
}
