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

/** 1-based step number in URL path. */
export function listPropertyStepPath(stepNumber: number): string {
  return agentDeskPath("list-property", listPropertyStepSlug(stepNumber));
}

export const LIST_PROPERTY_WIZARD_ENTRY = listPropertyStepPath(1);

/** 0-based wizard index, or null if slug is invalid. */
export function parseListPropertyStepSlug(slug: string): number | null {
  const match = /^step([1-7])$/i.exec(slug.trim());
  if (!match) return null;
  return Number(match[1]) - 1;
}
