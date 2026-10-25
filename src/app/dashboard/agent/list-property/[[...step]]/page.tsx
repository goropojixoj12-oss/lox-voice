import { redirect } from "next/navigation";
import { ListPropertyWizard } from "@/components/dashboard/list-property-wizard";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";
import { propertyListingsEnabled } from "@/lib/listings-policy";
import {
  LIST_PROPERTY_WIZARD_ENTRY,
  parseListPropertyStepSlug,
} from "@/lib/list-property-steps";

export default async function ListPropertyStepPage({
  params,
}: {
  params: Promise<{ step?: string[] }>;
}) {
  if (!propertyListingsEnabled()) {
    redirect(agentDeskPath("overview"));
  }

  const { step: segments } = await params;
  const slug = segments?.[0];

  if (!slug) {
    redirect(LIST_PROPERTY_WIZARD_ENTRY);
  }

  const stepIndex = parseListPropertyStepSlug(slug);
  if (stepIndex == null) {
    redirect(LIST_PROPERTY_WIZARD_ENTRY);
  }

  return <ListPropertyWizard stepIndex={stepIndex} />;
}
