import type { Metadata } from "next";
import { ListingsDisabledNotice } from "@/components/shared/listings-disabled-notice";

export const metadata: Metadata = { title: "Listing stats" };

export default function StatsPage() {
  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Performance snapshot
      </h1>
      <div className="mt-8">
        <ListingsDisabledNotice />
      </div>
    </div>
  );
}
