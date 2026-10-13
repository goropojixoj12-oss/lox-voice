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
        SEAPS is an original product concept for international property discovery. Brand name,
        logo mark, colors, and copy are configuration-driven so teams can rebrand without rewriting
        the information architecture.
      </p>
      <p className="mt-4 leading-relaxed text-[var(--color-muted)]">
        This repository ships a working demo marketplace with seed inventory, search filters,
        role-aware dashboards, and a Prisma schema ready for PostgreSQL.
      </p>
    </div>
  );
}
