import { redirect } from "next/navigation";

/** Legacy agency profile URLs — removed from public site. */
export default function LegacyAgencyDetailPage() {
  redirect("/usefullinks");
}
