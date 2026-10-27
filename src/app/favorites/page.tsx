import { redirect } from "next/navigation";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";

export default function LegacyFavoritesRedirect() {
  redirect(agentDeskPath("favorites"));
}
