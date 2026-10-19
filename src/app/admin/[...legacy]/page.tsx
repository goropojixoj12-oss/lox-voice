import { redirect } from "next/navigation";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";

export default async function LegacyAdminSubpathRedirect({
  params,
}: {
  params: Promise<{ legacy: string[] }>;
}) {
  const { legacy } = await params;
  redirect(adminDeskPath(...legacy));
}
