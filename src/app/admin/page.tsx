import { redirect } from "next/navigation";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export default function LegacyAdminRedirect() {
  redirect(adminDeskPath());
}
