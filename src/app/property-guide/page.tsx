import type { Metadata } from "next";
import { ContentStubPage } from "@/components/shared/content-stub-page";

export const metadata: Metadata = {
  title: "Property Guide",
  description: "SEAPS property guide for buyers, renters, and investors in Cambodia.",
};

export default function PropertyGuidePage() {
  return (
    <ContentStubPage
      eyebrow="Property Guide"
      title="Your Cambodia property guide"
      description="Practical guides for buying, renting, and investing in Cambodian real estate will be published here."
    />
  );
}
