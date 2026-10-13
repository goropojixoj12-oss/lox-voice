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
          {brand.name} demo listings are fictional sample inventory for product evaluation. They are
          not real offers to sell or rent property.
        </p>
        <p>
          Users must not upload unlawful content, scrape personal data, or attempt to access admin
          tools without authorization.
        </p>
        <p>
          External integrations (maps, email, SMS, payments, WhatsApp) require explicit configuration
          and are not implied to be active in this demo.
        </p>
      </div>
    </div>
  );
}
