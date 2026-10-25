import { properties } from "@/data/properties";
import { getRuntimeListings } from "@/lib/store";
import { parseSearchParams, searchProperties } from "@/lib/search";
import type { SearchFilters, TransactionType } from "@/lib/types";

export async function getAllProperties() {
  const runtime = await getRuntimeListings();
  return [...runtime, ...properties];
}

export type CatalogVisibility = "normal" | "cleared";

export async function runCatalogSearch(
  params: Record<string, string | string[] | undefined>,
  defaults?: Partial<SearchFilters>,
  options?: { visibility?: CatalogVisibility },
) {
  const filters = { ...parseSearchParams(params), ...defaults };
  if (options?.visibility === "cleared") {
    return {
      items: [],
      total: 0,
      page: filters.page ?? 1,
      totalPages: 0,
      filters,
    };
  }
  const source = await getAllProperties();
  return { ...searchProperties(filters, source), filters };
}

export function dealDefault(deal: TransactionType): Partial<SearchFilters> {
  return { deal };
}
