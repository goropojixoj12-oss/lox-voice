export type AggregationSourceType =
  | "portal"
  | "agency"
  | "facebook"
  | "telegram"
  | "other";

export type AggregationSourceStatus =
  | "idle"
  | "ok"
  | "error"
  | "adapter_needed"
  | "skipped";

export interface AggregationSourceCatalogEntry {
  id: string;
  name: string;
  url: string;
  type: AggregationSourceType;
  enabled: boolean;
  adapterId: string | null;
}

export interface AggregationSourcesCatalog {
  generatedAt: string;
  sourceDocument: string;
  total: number;
  defaultEnabledCount: number;
  sources: AggregationSourceCatalogEntry[];
}

export interface AggregationSourceRuntime {
  lastRun: string | null;
  itemsFetched: number;
  status: AggregationSourceStatus;
  message: string | null;
}

export interface AggregationSourceView extends AggregationSourceCatalogEntry {
  runtime: AggregationSourceRuntime;
}
