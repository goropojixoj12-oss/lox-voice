import type { Property } from "@/lib/types";
import { isPublicListing } from "@/lib/listing-access";

/**
 * Runtime listings synced from production API
 * These are the authoritative property records for the site.
 */

export const properties: Property[] = [
  {
    id: "runtime-FpQKSPTb",
    slug: "cheapest-ever-studio-sold-vue-aston-never-seen-before-foreign-ownership-approved-hard-title-_ZFWs",
    title: "LUXURY @ VUE ASTON - CHEAPEST.....EVER....STUDIO.... NEVER SEEN BEFORE PRICE- FOREIGN OWNERSHIP APPROVED (Hard Title Ready) - EXCLUSIVE to SEAPS",
    summary: "This Studio Apartment is SIGNIFICANTLY reduced in price and ready for Immediate Ownership.",
    description: "<p>CHEAPEST STUDIO @ VUE ASTON</p>",
    transactionType: "sale" as const,
    propertyType: "apartment" as const,
    status: "published" as const,
    verification: "unverified" as const,
    sellerType: "owner" as const,
    price: 43460,
    currency: "USD",
    pricePeriod: null,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 27.08,
    landSqm: null,
    furnishing: null,
    amenities: [],
    images: [
      {
        id: "vue-aston-01",
        url: "/media/listings/vue-aston/01.jpg",
        alt: "LUXURY @ VUE ASTON",
        isCover: true,
        storageKey: "public/vue-aston/01.jpg",
      },
      {
        id: "vue-aston-02",
        url: "/media/listings/vue-aston/02.jpg",
        alt: "LUXURY @ VUE ASTON",
        isCover: false,
        storageKey: "public/vue-aston/02.jpg",
      },
    ],
    cardPreviewVideoUrl: null,
    hasVideoTour: false,
    location: { country: "Cambodia", countrySlug: "cambodia", city: "Phnom Penh", citySlug: "phnom-penh", district: "Koh Norea", districtSlug: "koh-norea", commune: "Koh Norea", communeSlug: "koh-norea", address: "Vue Aston", lat: 0, lng: 0 },
    createdByUserId: "user-admin",
    publishedAt: "2026-11-04T20:39:29.539Z",
    updatedAt: "2026-11-04T20:39:29.539Z",
    views: 0,
    inquiries: 0,
    previewPhotoCount: 3,
  },
  {
    id: "runtime-Iyrq-T59",
    slug: "stunning-architectural-masterpiece-large-executive-3-bedroom-all-ensuites-modern-colonial-style-house-beautiful-pool-western-award-winning-architect-a-personal-project-designed-built-and-proudly-displayed-by-one-of-cambodia-s-most-respected-and-trusted-architect-builders-dA5Dl",
    title: "STUNNING, ARCHITECTURAL MASTERPIECE. A Personal Project - Designed, Built and Proudly Displayed by one of Cambodia's most Respected, Western (Award Winning) Architects.",
    summary: "Modern Colonial Style House - Beautiful Pool - 3 Bedrooms",
    description: "<p>A PROPERTY THAT DELIVERS ON EVERY LEVEL</p>",
    transactionType: "sale" as const,
    propertyType: "apartment" as const,
    status: "published" as const,
    verification: "unverified" as const,
    sellerType: "owner" as const,
    price: 330000,
    currency: "USD",
    pricePeriod: null,
    bedrooms: 3,
    bathrooms: 4,
    areaSqm: 700,
    landSqm: null,
    furnishing: null,
    amenities: [],
    images: [],
    cardPreviewVideoUrl: null,
    hasVideoTour: false,
    location: { country: "Cambodia", countrySlug: "cambodia", city: "Kampot", citySlug: "kampot", district: "Andong Khmer", districtSlug: "andong-khmer", commune: "International Village", communeSlug: "international-village", address: "Andong Khmer", lat: 0, lng: 0 },
    createdByUserId: "user-admin",
    publishedAt: "2026-11-05T15:05:20.582Z",
    updatedAt: "2026-11-05T15:05:20.582Z",
    views: 0,
    inquiries: 0,
    previewPhotoCount: 3,
    commissionCompany: 3,
  },
  {
    id: "runtime-yl1YBrlr",
    slug: "vue-aston-3-bedroom-2-bathroom-fully-furnished-102m2-fBb84",
    title: "Vue Aston (Riverside) - 3 Bedrooms, 2 Bathrooms, Fully Furnished",
    summary: "Foreign Ownership Approved. Stunning City and River Views, 102.34 m2",
    description: "<p>Luxury 3 Bedroom Condominium</p>",
    transactionType: "sale" as const,
    propertyType: "apartment" as const,
    status: "published" as const,
    verification: "premium" as const,
    sellerType: "agent" as const,
    price: 239000,
    currency: "USD",
    pricePeriod: null,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 102.35,
    landSqm: null,
    furnishing: null,
    amenities: ["parking", "pool", "gym"],
    images: [],
    cardPreviewVideoUrl: null,
    hasVideoTour: false,
    location: { country: "Cambodia", countrySlug: "cambodia", city: "Phnom Penh", citySlug: "phnom-penh", district: "Koh Norea", districtSlug: "koh-norea", commune: "Koh Norea", communeSlug: "koh-norea", address: "Vue Aston", lat: 0, lng: 0 },
    createdByUserId: "user-agent",
    agentId: "agent-sokha",
    agencyId: "ag-mekong",
    publishedAt: "2026-11-04T14:15:15.944Z",
    updatedAt: "2026-11-04T14:15:15.944Z",
    views: 0,
    inquiries: 0,
    isFeatured: true,
    isPremium: true,
    previewPhotoCount: 3,
    commissionCompany: 3,
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
