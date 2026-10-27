import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Terms of use
      </h1>
      <div className="mt-4 space-y-4 text-[var(--color-muted)]">
        <p>
          {brand.name} publishes property listings and project information for Cambodia. Users must
          verify documents, zoning, and ownership before completing any transaction.
        </p>
        <p>
          Users must not upload unlawful content, scrape personal data, or attempt to access admin
          tools without authorization.
        </p>
        <p>
          External integrations such as maps and messaging require configuration and are enabled
          only when credentials are provided.
        </p>
      </div>
    </div>
  );
}
