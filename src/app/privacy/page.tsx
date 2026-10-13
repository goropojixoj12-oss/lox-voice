import type { Metadata } from "next";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 prose-like">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Privacy
      </h1>
      <div className="mt-4 space-y-4 text-[var(--color-muted)]">
        <p>
          {brand.name} minimizes personal data in demo mode. Inquiry forms collect only the fields
          needed to respond: name, contact method, and message.
        </p>
        <p>
          Session cookies identify signed-in demo users. Guest favorites stay in local browser
          storage and are not uploaded until sign-in.
        </p>
        <p>
          When production services are connected, document retention, subprocessors, and regional
          hosting details should be updated here before collecting real user data.
        </p>
      </div>
    </div>
  );
}
