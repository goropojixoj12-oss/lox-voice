import type { Metadata } from "next";
import { ContentStubPage } from "@/components/shared/content-stub-page";

export const metadata: Metadata = {
  title: "Land for rent",
  description: "Land and plot leases across Cambodia — SEAPS.",
};

export default function RentLandPage() {
  return (
    <ContentStubPage
      eyebrow="Rent · Land"
      title="Land for rent"
      description="Dedicated land-for-rent listings will appear here. Contact SEAPS if you need help finding leasehold land or long-term plot arrangements."
    />
  );
}
