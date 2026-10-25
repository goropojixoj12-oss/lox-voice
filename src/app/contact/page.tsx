import type { Metadata } from "next";
import { PageFeedbackForm } from "@/components/forms/page-feedback-form";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "All inquiries",
  description: "Send an inquiry to SEAPS.",
};

export default function ContactPage() {
  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <PageFeedbackForm
          formId="contact"
          inquiryPropertyId="inquires-page"
          inquiryPropertyTitle="All inquiries"
        />
      </div>
    </Section>
  );
}
