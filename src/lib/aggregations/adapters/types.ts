import type { AggregatedContacts, PropertyType } from "@/lib/types";

/** Normalized draft before store assigns id / timestamps. */
export interface AggregatedDraft {
  title: string;
  description: string;
  price: number | null;
  currency: string;
  location: string | null;
  propertyType: PropertyType | null;
  photos: string[];
  publishedAt: string | null;
  sourceName: string;
  sourceUrl: string | null;
  contacts: AggregatedContacts;
  externalId: string;
}

export interface AdapterResult {
  adapterId: string;
  items: AggregatedDraft[];
  warnings: string[];
}

export interface AggregationAdapter {
  id: string;
  label: string;
  fetchDrafts: () => Promise<AdapterResult>;
}
