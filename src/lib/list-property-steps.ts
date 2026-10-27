import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { agentDeskPath } from "@/lib/dashboard-agent-paths";

export const LIST_PROPERTY_STEP_LABELS = [
  "Deal & category",
  "Location",
  "Price & specs",
  "Description",
  "Photos",
  "Contact",
  "Preview",
] as const;

export const LIST_PROPERTY_STEP_COUNT = LIST_PROPERTY_STEP_LABELS.length;

export type ListPropertyStepSlug = `step${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

export function listPropertyStepSlug(stepNumber: number): ListPropertyStepSlug {
  const n = Math.min(LIST_PROPERTY_STEP_COUNT, Math.max(1, Math.round(stepNumber)));
  return `step${n}` as ListPropertyStepSlug;
}

export function listPropertyStepPathForBase(deskBase: string, stepNumber: number): string {
  const slug = listPropertyStepSlug(stepNumber);
  const base = deskBase.replace(/\/+$/, "");
  return `${base}/list-property/${slug}`;
}

/** Agent desk (default). */
export function listPropertyStepPath(stepNumber: number): string {
  return listPropertyStepPathForBase(agentDeskPath(), stepNumber);
}

export function adminListPropertyStepPath(stepNumber: number): string {
  return listPropertyStepPathForBase(adminDeskPath(), stepNumber);
}

export const LIST_PROPERTY_WIZARD_ENTRY = listPropertyStepPath(1);

/** 0-based wizard index, or null if slug is invalid. */
export function parseListPropertyStepSlug(slug: string): number | null {
  const match = /^step([1-7])$/i.exec(slug.trim());
  if (!match) return null;
  return Number(match[1]) - 1;
}
