import { redirect } from "next/navigation";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";

export default function LegacyAdminRedirect() {
  redirect(agentDeskPath("admin"));
}
