"use client";

import { ListPropertyWizardProvider } from "@/components/dashboard/list-property-wizard";

export default function ListPropertyWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ListPropertyWizardProvider>{children}</ListPropertyWizardProvider>;
}
