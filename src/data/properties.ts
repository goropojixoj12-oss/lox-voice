import type { Property } from "@/lib/types";
import { isPublicListing } from "@/lib/listing-access";
import { photoImage } from "@/lib/media";

const img = (id: string, alt: string) => photoImage(id, alt);

const kh = (
  city: string,
  citySlug: string,
  district: string,
  districtSlug: string,
  address: string,
  lat: number,
  lng: number,
) => ({
  country: "Cambodia",
  countrySlug: "cambodia",
  city,
  citySlug,
  district,
  districtSlug,
  address,
  lat,
  lng,
});

export const properties: Property[] = [
  {
    id: "p-001",
    slug: "bkk1-riverside-apartment",
    title: "Bright BKK 1 Apartment Near Riverside",
    summary: "Two-bedroom apartment with balcony light and quiet courtyard access.",
    description:
      "A renovated two-bedroom apartment in Boeng Keng Kang 1. Tall windows, updated kitchen, and a balcony suited to evening breezes. Walkable to cafés along Street 308 and the riverside.",
    transactionType: "sale",
    propertyType: "apartment",
    status: "draft",
    verification: "verified",
    sellerType: "agent",
    price: 185000,
    currency: "USD",
    pricePeriod: null,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 92,
    landSqm: null,
    furnishing: "semi",
    amenities: ["elevator", "balcony", "air_conditioning", "security"],
    images: [
      { ...img("photo-1502672260266-1c1ef2d93688", "Living room"), isCover: true },
      img("photo-1560448204-e02f11c3d0e2", "Kitchen"),
    ],
    location: kh("Phnom Penh", "phnom-penh", "BKK 1", "bkk-1", "Street 308 area", 11.551, 104.923),
    agentId: "agent-sokha",
    agencyId: "ag-mekong",
    publishedAt: "2026-10-16T10:00:00.000Z",
    updatedAt: "2026-04-02T12:00:00.000Z",
    hasVideoTour: true,
    isPremium: false,
    isFeatured: true,
    views: 200,
    inquiries: 6,
  },
  {
    id: "p-002",
    slug: "toul-kork-family-villa",
    title: "Toul Kork Family Villa with Private Garden",
    summary: "Four-bedroom villa inside a secure compound.",
    description:
      "A spacious villa in Toul Kork with a private garden, covered parking, and separate staff quarters. Ideal for families needing space and a quieter residential street.",
    transactionType: "sale",
    propertyType: "villa",
    status: "draft",
    verification: "premium",
    sellerType: "agent",
    price: 485000,
    currency: "USD",
    pricePeriod: null,
    bedrooms: 4,
    bathrooms: 5,
    areaSqm: 320,
    landSqm: 450,
    furnishing: "furnished",
    amenities: ["parking", "garden", "security", "air_conditioning", "terrace"],
    images: [
      { ...img("photo-1613490493576-7fde63acd811", "Villa exterior"), isCover: true },
      img("photo-1600596542815-ffad4c1539a9", "Garden terrace"),
    ],
    location: kh("Phnom Penh", "phnom-penh", "Toul Kork", "toul-kork", "Street 315 corridor", 11.577, 104.898),
    agentId: "agent-dara",
    agencyId: "ag-mekong",
    publishedAt: "2026-10-15T10:00:00.000Z",
    updatedAt: "2026-03-28T12:00:00.000Z",
    hasVideoTour: true,
    isPremium: true,
    isFeatured: true,
    views: 200,
    inquiries: 6,
  },
  {
    id: "p-003",
    slug: "daun-penh-serviced-rent",
    title: "Daun Penh Serviced Apartment for Rent",
    summary: "One-bedroom furnished rental near the riverside.",
    description:
      "Long-term rental with housekeeping options available through building management. Compact layout, full kitchenette, and strong walkability to Daun Penh offices.",
    transactionType: "rent",
    propertyType: "apartment",
    status: "draft",
    verification: "verified",
    sellerType: "agent",
    price: 950,
    currency: "USD",
    pricePeriod: "month",
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 48,
    landSqm: null,
    furnishing: "furnished",
    amenities: ["elevator", "air_conditioning", "security", "workspace"],
    images: [
      { ...img("photo-1493809842364-78817add7ffb", "Serviced apartment"), isCover: true },
    ],
    location: kh("Phnom Penh", "phnom-penh", "Daun Penh", "daun-penh", "Near Sisowath Quay", 11.568, 104.931),
    agentId: "agent-chenda",
    agencyId: "ag-royal",
    publishedAt: "2026-10-14T10:00:00.000Z",
    updatedAt: "2026-04-01T12:00:00.000Z",
    hasVideoTour: false,
    isPremium: false,
    isFeatured: false,
    views: 200,
    inquiries: 6,
  },
];

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

export function getRelatedProperties(property: Property, limit = 3) {
  return properties
    .filter(
      (p) =>
        p.id !== property.id &&
        isPublicListing(p) &&
        (p.location.citySlug === property.location.citySlug ||
          p.propertyType === property.propertyType),
    )
    .slice(0, limit);
}
