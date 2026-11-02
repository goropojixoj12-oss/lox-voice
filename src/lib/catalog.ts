import { properties } from "@/data/properties";
import { getRuntimeListings } from "@/lib/store";
import { parseSearchParams, searchProperties } from "@/lib/search";
import type { SearchFilters, TransactionType } from "@/lib/types";

/** Store listings that were promoted into `src/data/properties.ts` (see `promotedFrom`). */
function promotedStoreIds() {
  return new Set(properties.map((p) => p.promotedFrom).filter(Boolean) as string[]);
}

export async function getAllProperties() {
  const promoted = promotedStoreIds();
  const runtime = await getRuntimeListings();
  return [...runtime.filter((listing) => !promoted.has(listing.id)), ...properties];
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

/** Long-term rent catalog routes show no public inventory (CEO site request). Sale catalogs list published inventory. */
export function catalogVisibilityForDeal(deal?: TransactionType): CatalogVisibility {
  if (deal === "rent") return "cleared";
  return "normal";
}
