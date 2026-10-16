import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/shared/section";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Useful Links",
  description:
    "Partner resources for Cambodia — tourism, lifestyle, and business information via Cambodia2U.",
};

export default function UsefulLinksPage() {
  return (
    <Section>
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Useful Links
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)] md:text-5xl">
          Partner platform
        </h1>
        <div className="seaps-card mt-10 rounded-[var(--radius-xl)] p-8 md:p-10">
          <p className="text-lg leading-relaxed text-[var(--color-text)] md:text-xl">
            Cambodia2U is a Cambodia-focused Tourism, Lifestyle and Business Information Platform
            designed to help Visitors, Expatriates and Local Residents discover Places to Visit,
            Services to use, and Introduce useful Businesses and Services across the Kingdom.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <ButtonLink
              href="https://www.cambodia2u.com/"
              target="_blank"
              rel="noopener noreferrer"
              variant="accent"
              className="min-w-[12rem] justify-center"
            >
              Visit Cambodia2U
            </ButtonLink>
            <Link
              href="https://www.cambodia2u.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--color-accent-soft)] underline-offset-4 hover:underline"
            >
              www.cambodia2u.com
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
