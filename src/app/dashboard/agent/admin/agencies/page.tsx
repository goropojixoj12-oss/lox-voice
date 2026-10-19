import { redirect } from "next/navigation";

export default function LegacyAdminAgenciesPage() {
  redirect("/dashboard/agent/admin");
}
