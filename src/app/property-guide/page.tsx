import type { Metadata } from "next";
import { PropertyGuidePdfPreview } from "@/components/property-guide/property-guide-pdf-preview";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Property Guide",
  description:
    "The SEAPS Property Guide — essential information on property transactions, legal considerations, risk management and ownership rights across South East Asia.",
};

export default function PropertyGuidePage() {
  return (
    <Section>
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Property Guide
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight text-[var(--color-accent-soft)] md:text-5xl">
          SEAPS Property Guide
        </h1>

        <div className="mt-10 space-y-5 text-lg leading-relaxed text-[var(--color-muted)]">
          <p>
            The South East Asia Property Services (SEAPS) Property Guide is a comprehensive resource
            designed to help buyers, sellers, investors and property owners navigate the property
            market with greater confidence, knowledge and security.
          </p>
          <p>
            By bringing together essential information on property transactions, legal
            considerations, risk management and ownership rights, the SEAPS Property Guide aims to
            promote transparency, informed decision-making and professional standards throughout the
            property market. It serves as a practical reference for anyone looking to buy, sell,
            invest in or manage property, supporting a more informed and confident approach to
            property ownership across South East Asia.
          </p>
        </div>

        <PropertyGuidePdfPreview />

        <aside
          className="seaps-card mt-10 rounded-[var(--radius-lg)] border-[rgba(212,175,55,0.35)] bg-[rgba(212,175,55,0.06)] p-6 md:p-8"
          role="note"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-accent)]">
            Important note
          </p>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-text)]">
            Property laws, ownership rights, foreign ownership restrictions, taxes and transfer
            procedures vary by country and property type. Readers should obtain independent legal and
            tax advice and verify all applicable requirements in the relevant jurisdiction before
            proceeding with a transaction.
          </p>
        </aside>
      </article>
    </Section>
  );
}
