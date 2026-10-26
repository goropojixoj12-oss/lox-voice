"use client";

import {
  AGENT_LIST_PROPERTY_DESK,
  ListPropertyDeskProvider,
} from "@/components/dashboard/list-property-desk-provider";
import { ListPropertyWizardProvider } from "@/components/dashboard/list-property-wizard";

export default function ListPropertyWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ListPropertyDeskProvider desk={AGENT_LIST_PROPERTY_DESK}>
      <ListPropertyWizardProvider>{children}</ListPropertyWizardProvider>
    </ListPropertyDeskProvider>
  );
}
