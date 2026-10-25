import type { Metadata } from "next";
import { ListingsDisabledNotice } from "@/components/shared/listings-disabled-notice";
export const metadata: Metadata = { title: "Moderate listings" };

export default async function AdminListingsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Listing moderation
      </h1>
      <div className="mt-8">
        <ListingsDisabledNotice />
      </div>
    </div>
  );
}
