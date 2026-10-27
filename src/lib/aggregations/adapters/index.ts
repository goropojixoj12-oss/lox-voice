import { demoAdapter } from "./demo";
import { htmlPortalAdapters } from "./html-portal";
import type { AggregationAdapter } from "./types";

export type { AggregatedDraft, AdapterResult, AggregationAdapter } from "./types";

/** Built-in adapters run by /api/aggregations/sync. */
export const aggregationAdapters: AggregationAdapter[] = [
  demoAdapter,
  ...htmlPortalAdapters,
];

export function getAdapter(id: string): AggregationAdapter | undefined {
  return aggregationAdapters.find((a) => a.id === id);
}
