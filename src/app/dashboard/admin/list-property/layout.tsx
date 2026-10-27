"use client";

import {
  ADMIN_LIST_PROPERTY_DESK,
  ListPropertyDeskProvider,
} from "@/components/dashboard/list-property-desk-provider";
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
