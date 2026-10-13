import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "About",
  description: `About ${brand.name}`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        About {brand.name}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--color-muted)]">{brand.description}</p>
      <p className="mt-4 leading-relaxed text-[var(--color-muted)]">
        Founded in {brand.foundedYear}, {brand.fullName} supports buyers, renters, owners, and
        agents across Phnom Penh, Siem Reap, Sihanoukville, Battambang, Kampot, and Kep.
      </p>
      <p className="mt-4 leading-relaxed text-[var(--color-muted)]">
        From verified listings to project pages and local market guides, SEAPS is built to make
        Cambodian property search clearer and more trustworthy.
      </p>
    </div>
  );
}
