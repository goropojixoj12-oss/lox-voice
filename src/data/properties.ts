import type { Property } from "@/lib/types";
import { isPublicListing } from "@/lib/listing-access";

/**
 * MIGRATION: All listings are now stored in Supabase (runtime listings).
 * This file previously contained seed listings in code, but they have been moved to Supabase.
 * The properties array below is kept for backwards compatibility but returns an empty array.
 *
 * The catalog, search, and individual listing pages use getRuntimeListings() from @/lib/store.ts,
 * which reads from Supabase backend.
 */

export const properties: Property[] = [];

export function getPropertyBySlug(slug: string) {
  return properties.find((p) => p.slug === slug);
}

export function getPropertyById(id: string) {
  return properties.find((p) => p.id === id);
}

export function getPropertiesByAgency(agencyId: string) {
  return properties.filter((p) => p.agencyId === agencyId && isPublicListing(p));
}

export function getPropertiesByAgent(agentId: string) {
  return properties.filter((p) => p.agentId === agentId && isPublicListing(p));
}

export function getPropertiesByProject(projectId: string) {
  return properties.filter((p) => p.projectId === projectId && isPublicListing(p));
}

export function getRelatedProperties(property: Property, limit = 3, source: Property[] = properties) {
  return source
    .filter(
      (p) =>
        p.id !== property.id &&
        isPublicListing(p) &&
        (p.location.citySlug === property.location.citySlug ||
          p.propertyType === property.propertyType),
    )
    .slice(0, limit);
}
