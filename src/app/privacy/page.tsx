import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Privacy
      </h1>
      <div className="mt-4 space-y-4 text-[var(--color-muted)]">
        <p>
          {brand.name} minimizes personal data. Inquiry forms collect only the fields needed to
          respond: name, contact method, and message.
        </p>
        <p>
          Session cookies identify signed-in users. Guest favorites stay in local browser storage
          until you sign in.
        </p>
        <p>
          For questions about data handling, contact {brand.supportEmail}.
        </p>
      </div>
    </div>
  );
}
