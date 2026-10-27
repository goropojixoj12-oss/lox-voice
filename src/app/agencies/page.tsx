import { redirect } from "next/navigation";

/** Legacy URL — permanent redirect to Useful Links. */
export default function LegacyAgenciesIndexPage() {
  redirect("/usefullinks");
}
