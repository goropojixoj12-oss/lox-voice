import { redirect } from "next/navigation";
import { LIST_PROPERTY_WIZARD_ENTRY } from "@/lib/list-property-steps";

export default function LegacyListPropertyRedirect() {
  redirect(LIST_PROPERTY_WIZARD_ENTRY);
}
