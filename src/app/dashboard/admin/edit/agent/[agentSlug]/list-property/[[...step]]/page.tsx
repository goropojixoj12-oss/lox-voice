import { redirect } from "next/navigation";
import { ListPropertyWizard } from "@/components/dashboard/list-property-wizard";
import { adminEditAgentListPropertyStepPath } from "@/lib/admin-edit-agent-paths";
import { parseListPropertyStepSlug } from "@/lib/list-property-steps";

export default async function AdminEditAgentListPropertyStepPage({
  params,
}: {
  params: Promise<{ agentSlug: string; step?: string[] }>;
}) {
  const { agentSlug, step: segments } = await params;
  const slug = segments?.[0];
  const entry = adminEditAgentListPropertyStepPath(agentSlug, 1);

  if (!slug) {
    redirect(entry);
  }

  const stepIndex = parseListPropertyStepSlug(slug);
  if (stepIndex == null) {
    redirect(entry);
  }

  return <ListPropertyWizard stepIndex={stepIndex} />;
}
