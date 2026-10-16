import type { Metadata } from "next";
import { AgencyCard } from "@/components/agency/agency-card";
import { Section, SectionHeader } from "@/components/shared/section";
import { agencies } from "@/data/agencies";

export const metadata: Metadata = {
  title: "SEAPS offices",
  description: "SEAPS regional desks across Cambodia — Phnom Penh, Siem Reap, coastal, and commercial.",
};

export default function AgenciesPage() {
  return (
    <Section>
      <SectionHeader
        eyebrow="SEAPS"
        title="Our offices"
        description="Browse SEAPS desks by city, specialization, and verification status."
      />
      <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-4">
        {agencies.map((agency) => (
          <AgencyCard key={agency.id} agency={agency} />
        ))}
      </div>
    </Section>
  );
}
