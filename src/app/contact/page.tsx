import type { Metadata } from "next";
import { ContactPageIntro } from "@/components/contact/contact-page-intro";
import { PageFeedbackForm } from "@/components/forms/page-feedback-form";
import { Section } from "@/components/shared/section";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send an inquiry to SEAPS.",
};

export default function ContactPage() {
  return (
    <Section>
      <div className="mx-auto max-w-xl">
        <ContactPageIntro />
        <PageFeedbackForm
          formId="contact"
          inquiryPropertyId="inquires-page"
          inquiryPropertyTitle="All inquiries"
        />
      </div>
    </Section>
  );
}
