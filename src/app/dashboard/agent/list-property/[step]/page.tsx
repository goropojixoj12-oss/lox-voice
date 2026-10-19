import { redirect } from "next/navigation";
import { ListPropertyWizard } from "@/components/dashboard/list-property-wizard";
import {
  LIST_PROPERTY_WIZARD_ENTRY,
  parseListPropertyStepSlug,
} from "@/lib/list-property-steps";

export default async function ListPropertyStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step: stepSlug } = await params;
  const stepIndex = parseListPropertyStepSlug(stepSlug);
  if (stepIndex == null) {
    redirect(LIST_PROPERTY_WIZARD_ENTRY);
  }
  return <ListPropertyWizard stepIndex={stepIndex} />;
}
