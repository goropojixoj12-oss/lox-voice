import { properties } from "@/data/properties";
import type { Property, PropertyType, SearchFilters } from "@/lib/types";

const COMMERCIAL_PROPERTY_TYPES = new Set<PropertyType>([
  "commercial",
  "office",
  "retail",
  "warehouse",
]);

const HOME_SEARCH_OTHER_TYPES = new Set<PropertyType>([
  "villa",
  "townhouse",
  "land",
  "project_unit",
]);

function matchesSearchType(propertyType: PropertyType, filter: SearchFilters["type"]): boolean {
  if (!filter || filter === "all") return true;
  switch (filter) {
    case "apartment_condo":
      return propertyType === "apartment" || propertyType === "condo";
    case "house":
      return propertyType === "house";
    case "commercial":
      return COMMERCIAL_PROPERTY_TYPES.has(propertyType);
    case "other":
      return HOME_SEARCH_OTHER_TYPES.has(propertyType);
    default:
      return propertyType === filter;
  }
}

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchFilters {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const amenitiesRaw = get("amenities");
  const amenities = amenitiesRaw
    ? (amenitiesRaw.split(",").filter(Boolean) as SearchFilters["amenities"])
    : undefined;

  return {
    q: get("q") || undefined,
    deal: (get("deal") as SearchFilters["deal"]) || "all",
    city: get("city") || undefined,
    district: get("district") || undefined,
    type: (get("type") as SearchFilters["type"]) || "all",
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
    bedrooms: get("bedrooms") ? Number(get("bedrooms")) : undefined,
    bathrooms: get("bathrooms") ? Number(get("bathrooms")) : undefined,
    minArea: get("minArea") ? Number(get("minArea")) : undefined,
    maxArea: get("maxArea") ? Number(get("maxArea")) : undefined,
    minLand: get("minLand") ? Number(get("minLand")) : undefined,
    furnishing: (get("furnishing") as SearchFilters["furnishing"]) || "all",
    amenities,
    verification: (get("verification") as SearchFilters["verification"]) || "all",
    sellerType: (get("sellerType") as SearchFilters["sellerType"]) || "all",
    publishedWithinDays: get("publishedWithinDays")
      ? Number(get("publishedWithinDays"))
      : undefined,
    sort: (get("sort") as SearchFilters["sort"]) || "newest",
    page: get("page") ? Number(get("page")) : 1,
    pageSize: get("pageSize") ? Number(get("pageSize")) : 9,
    premium: get("premium") === "1" || undefined,
    featured: get("featured") === "1" || undefined,
    hasVideo: get("hasVideo") === "1" || undefined,
  };
}

export function filtersToQuery(filters: SearchFilters): Record<string, string> {
  const query: Record<string, string> = {};
  const entries: [keyof SearchFilters, unknown][] = Object.entries(filters) as [
    keyof SearchFilters,
    unknown,
  ][];

  for (const [key, value] of entries) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    if (key === "page" && value === 1) continue;
    if (key === "pageSize" && value === 9) continue;
    if (key === "sort" && value === "newest") continue;
    if (Array.isArray(value)) {
      if (value.length) query[key] = value.join(",");
      continue;
    }
    if (typeof value === "boolean") {
      if (value) query[key] = "1";
      continue;
    }
    query[key] = String(value);
  }
  return query;
}

export function searchProperties(filters: SearchFilters, source: Property[] = properties) {
  let results = source.filter((p) => p.status === "published");

  if (filters.deal && filters.deal !== "all") {
    results = results.filter((p) => p.transactionType === filters.deal);
  }
  if (filters.city) {
    results = results.filter((p) => p.location.citySlug === filters.city);
  }
  if (filters.district) {
    results = results.filter((p) => p.location.districtSlug === filters.district);
  }
  if (filters.type && filters.type !== "all") {
    results = results.filter((p) => matchesSearchType(p.propertyType, filters.type));
  }
  if (filters.minPrice !== undefined) {
    results = results.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    results = results.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.bedrooms !== undefined) {
    results = results.filter(
      (p) => p.bedrooms !== null && p.bedrooms >= filters.bedrooms!,
    );
  }
  if (filters.bathrooms !== undefined) {
    results = results.filter(
      (p) => p.bathrooms !== null && p.bathrooms >= filters.bathrooms!,
    );
  }
  if (filters.minArea !== undefined) {
    results = results.filter((p) => p.areaSqm !== null && p.areaSqm >= filters.minArea!);
  }
  if (filters.maxArea !== undefined) {
    results = results.filter((p) => p.areaSqm !== null && p.areaSqm <= filters.maxArea!);
  }
  if (filters.minLand !== undefined) {
    results = results.filter((p) => p.landSqm !== null && p.landSqm >= filters.minLand!);
  }
  if (filters.furnishing && filters.furnishing !== "all") {
    results = results.filter((p) => p.furnishing === filters.furnishing);
  }
  if (filters.verification && filters.verification !== "all") {
    results = results.filter((p) => p.verification === filters.verification);
  }
  if (filters.sellerType && filters.sellerType !== "all") {
    results = results.filter((p) => p.sellerType === filters.sellerType);
  }
  if (filters.amenities?.length) {
    results = results.filter((p) =>
      filters.amenities!.every((amenity) => p.amenities.includes(amenity)),
    );
  }
  if (filters.publishedWithinDays) {
    const cutoff = Date.now() - filters.publishedWithinDays * 24 * 60 * 60 * 1000;
    results = results.filter((p) => new Date(p.publishedAt).getTime() >= cutoff);
  }
  if (filters.premium) results = results.filter((p) => p.isPremium);
  if (filters.featured) results = results.filter((p) => p.isFeatured);
  if (filters.hasVideo) results = results.filter((p) => p.hasVideoTour);

  if (filters.q) {
    const q = filters.q.toLowerCase();
    results = results.filter((p) =>
      [p.title, p.summary, p.location.city, p.location.district, p.propertyType]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  switch (filters.sort) {
    case "price_asc":
      results = [...results].sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      results = [...results].sort((a, b) => b.price - a.price);
      break;
    case "area_desc":
      results = [...results].sort((a, b) => (b.areaSqm ?? 0) - (a.areaSqm ?? 0));
      break;
    case "relevance":
      results = [...results].sort((a, b) => {
        const score = (p: Property) =>
          (p.isFeatured ? 3 : 0) + (p.isPremium ? 2 : 0) + (p.verification === "verified" ? 1 : 0);
        return score(b) - score(a);
      });
      break;
    case "newest":
    default:
      results = [...results].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      );
  }

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : 9;
  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const items = results.slice(start, start + pageSize);

  return { items, total, page, pageSize, totalPages };
}

export function buildSearchHref(path: string, filters: SearchFilters) {
  const query = filtersToQuery(filters);
  const qs = new URLSearchParams(query).toString();
  return qs ? `${path}?${qs}` : path;
}
