import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${brand.name} collects and processes personal data.`,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Privacy policy
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Last updated: {new Date().toISOString().slice(0, 10)} · {brand.fullName} ({brand.name})
      </p>
      <div className="mt-4 space-y-4 text-[var(--color-muted)]">
        <p>
          {brand.name} minimizes personal data. Inquiry and contact forms collect only the fields
          needed to respond: name, contact method, and message. By submitting a form you consent to
          that processing for the purpose of answering your request (GDPR / comparable local rules).
        </p>
        <p>
          Session cookies identify signed-in users and are essential. Preference cookies (language,
          cookie banner choice) stay in local browser storage. We do not load third-party analytics
          unless you accept optional cookies in the banner.
        </p>
        <p>
          Data controller contact:{" "}
          <a
            href={`mailto:${brand.supportEmail}`}
            className="font-semibold text-[var(--color-accent-soft)] underline"
          >
            {brand.supportEmail}
          </a>
          . You may request access, correction, or deletion of inquiry records by emailing us.
        </p>
        <p>
          Legal entity branding: {brand.fullName}, Cambodia, founded {brand.foundedYear}. For
          contractual terms see the Terms page.
        </p>
      </div>
    </div>
  );
}
