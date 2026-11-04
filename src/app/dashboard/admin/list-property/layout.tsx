"use client";

import { ListPropertyDeskProvider } from "@/components/dashboard/list-property-desk-provider";
import { ADMIN_LIST_PROPERTY_DESK } from "@/lib/list-property-desk";
import { ListPropertyWizardProvider } from "@/components/dashboard/list-property-wizard";

export default function AdminListPropertyWizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ListPropertyDeskProvider desk={ADMIN_LIST_PROPERTY_DESK}>
      <ListPropertyWizardProvider>{children}</ListPropertyWizardProvider>
    </ListPropertyDeskProvider>
  );
}
