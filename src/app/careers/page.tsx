import type { Metadata } from "next";
import { ContentStubPage } from "@/components/shared/content-stub-page";

export const metadata: Metadata = {
  title: "Careers",
  description: "Careers at SEAPS — South East Asia Property Services.",
};

export default function CareersPage() {
  return (
    <ContentStubPage
      eyebrow="Careers"
      title="Work with SEAPS"
      description="Open roles and how to apply will be listed here. For enquiries in the meantime, use Contact Us on the About page."
    />
  );
}
