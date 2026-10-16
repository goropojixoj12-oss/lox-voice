import type { Metadata } from "next";
import { PageFeedbackForm } from "@/components/forms/page-feedback-form";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Sale your property",
  description: "Contact SEAPS to sell your property.",
};

export default function SalePage() {
  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <PageFeedbackForm
          formId="sale"
          inquiryPropertyId="sale-page"
          inquiryPropertyTitle="Sale your property"
        />
      </div>
    </Section>
  );
}
