import { properties } from "@/data/properties";
import { parseSearchParams, searchProperties } from "@/lib/search";
import type { SearchFilters, TransactionType } from "@/lib/types";

/**
 * Single source of truth: `content/listings/*.json` -> `src/data/properties.ts`.
 * The runtime store is intentionally NOT merged here any more: mixing the two
 * produced duplicate cards (same listing twice) and stale copies without photos.
 * Store records stay available for drafts/moderation and must be exported into
 * `content/listings` to become part of the site.
 */
export async function getAllProperties() {
  return properties;
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

/**
 * Catalogs no longer wipe whole deal types. Visibility of a card is decided by
 * the listing itself (`visibility` field), so hidden inventory is explicit.
 */
export function catalogVisibilityForDeal(_deal?: TransactionType): CatalogVisibility {
  return "normal";
}