import type { Metadata } from "next";
import { AgencyCard } from "@/components/agency/agency-card";
import { Section, SectionHeader } from "@/components/shared/section";
import { agencies } from "@/data/agencies";

export const metadata: Metadata = {
  title: "Agencies",
  description: "Directory of real estate agencies working with SEAPS.",
};

export default function AgenciesPage() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Professionals"
        title="Agency directory"
        description="Browse agencies by city, specialization, and verification status."
      />
      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} />
        ))}
      </div>
    </Section>
  );
}
