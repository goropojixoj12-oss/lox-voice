import {
  adminEditAgentListPropertyDesk,
  ListPropertyDeskProvider,
} from "@/components/dashboard/list-property-desk-provider";
import { ListPropertyWizardProvider } from "@/components/dashboard/list-property-wizard";
import { requireAgentForEditSlug } from "@/lib/admin-edit-agent-page";

export default async function AdminEditAgentListPropertyLayout({
  params,
  children,
}: {
  params: Promise<{ agentSlug: string }>;
  children: React.ReactNode;
}) {
  const { agentSlug } = await params;
  const agent = await requireAgentForEditSlug(agentSlug);
  const desk = adminEditAgentListPropertyDesk(agentSlug, agent.id);

  return (
    <ListPropertyDeskProvider desk={desk}>
      <ListPropertyWizardProvider>{children}</ListPropertyWizardProvider>
    </ListPropertyDeskProvider>
  );
}
