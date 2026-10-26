import { redirect } from "next/navigation";
import { ListPropertyWizard } from "@/components/dashboard/list-property-wizard";
import { adminListPropertyStepPath, parseListPropertyStepSlug } from "@/lib/list-property-steps";

export default async function AdminListPropertyStepPage({
  params,
}: {
  params: Promise<{ step?: string[] }>;
}) {
  const { step: segments } = await params;
  const slug = segments?.[0];
  const entry = adminListPropertyStepPath(1);

  if (!slug) {
    redirect(entry);
  }

  const stepIndex = parseListPropertyStepSlug(slug);
  if (stepIndex == null) {
    redirect(entry);
  }

  return <ListPropertyWizard stepIndex={stepIndex} />;
}
