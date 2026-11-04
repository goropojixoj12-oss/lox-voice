import type { Property } from "@/lib/types";

export function hasMapCoords(property: Property) {
  const { lat, lng } = property.location;
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}
