import type { Metadata } from "next";
import { ContentStubPage } from "@/components/shared/content-stub-page";

export const metadata: Metadata = {
  title: "Land for sale",
  description: "Land listings for sale across Cambodia — SEAPS.",
};

export default function BuyLandPage() {
  return (
    <ContentStubPage
      eyebrow="Buy · Land"
      title="Land for sale"
      description="Dedicated land-for-sale listings will appear here. For now, browse all sale inventory from residential search or contact SEAPS for off-market parcels."
    />
  );
}
