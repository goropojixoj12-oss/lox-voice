import type { Property } from "@/lib/types";

/** Seed catalog empty — live listings also gated in store/catalog when disabled. */
export const properties: Property[] = [];

export function getPropertyBySlug(slug: string) {
  return properties.find((p) => p.slug === slug);
}

export function getPropertyById(id: string) {
  return properties.find((p) => p.id === id);
}

export function getPropertiesByAgency(agencyId: string) {
  return properties.filter((p) => p.agencyId === agencyId && p.status === "published");
}

export function getPropertiesByAgent(agentId: string) {
  return properties.filter((p) => p.agentId === agentId && p.status === "published");
}

export function getPropertiesByProject(projectId: string) {
  return properties.filter((p) => p.projectId === projectId && p.status === "published");
}

export function getRelatedProperties(property: Property, limit = 3) {
  return properties
    .filter(
      (p) =>
        p.id !== property.id &&
        p.status === "published" &&
        (p.location.citySlug === property.location.citySlug ||
          p.propertyType === property.propertyType),
    )
    .slice(0, limit);
}
