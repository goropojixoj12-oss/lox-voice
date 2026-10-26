import { z } from "zod";
import { countrySlugFromName, getCountryByCode, isWorldCountryCode } from "@/data/countries";
import { listingMediaToPropertyPayload } from "@/lib/list-property-media";
import type { ListingStatus, Property } from "@/lib/types";

const imageSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string().min(1),
  isCover: z.boolean().optional(),
});

const videoSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  label: z.string().optional(),
  role: z.enum(["tour", "card_preview"]).optional(),
});

const mediaItemSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["image", "video"]),
  url: z.string().min(1),
  name: z.string().min(1),
  storageKey: z.string().optional(),
  size: z.number().optional(),
  isCover: z.boolean().optional(),
  isCardPreview: z.boolean().optional(),
});

export const adminListingPatchSchema = z.object({
  action: z.enum(["save", "publish", "reject", "reopen"]).optional(),
  slug: z.string().min(3).optional(),
  title: z.string().min(8).optional(),
  summary: z.string().min(12).optional(),
  description: z.string().min(40).optional(),
  transactionType: z.enum(["sale", "rent", "short_stay"]).optional(),
  propertyType: z.enum([
    "apartment",
    "condo",
    "house",
    "villa",
    "townhouse",
    "commercial",
    "office",
    "retail",
    "warehouse",
    "land",
    "project_unit",
  ]).optional(),
  price: z.number().positive().optional(),
  currency: z.string().min(3).optional(),
  pricePeriod: z.enum(["month", "night", "year"]).nullable().optional(),
  bedrooms: z.number().nullable().optional(),
  bathrooms: z.number().nullable().optional(),
  areaSqm: z.number().nullable().optional(),
  landSqm: z.number().nullable().optional(),
  furnishing: z.enum(["unfurnished", "semi", "furnished"]).nullable().optional(),
  amenities: z
    .array(
      z.enum([
        "parking",
        "pool",
        "elevator",
        "balcony",
        "terrace",
        "garden",
        "gym",
        "security",
        "air_conditioning",
        "sea_view",
        "pet_friendly",
        "workspace",
      ]),
    )
    .optional(),
  verification: z.enum(["unverified", "verified", "premium"]).optional(),
  sellerType: z.enum(["owner", "agent", "developer"]).optional(),
  isFeatured: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
  countryCode: z
    .string()
    .length(2)
    .refine((code) => isWorldCountryCode(code.toUpperCase()), { message: "Invalid country" })
    .optional(),
  city: z.string().min(2).optional(),
  citySlug: z.string().min(2).optional(),
  district: z.string().min(2).optional(),
  districtSlug: z.string().min(2).optional(),
  commune: z.string().min(2).optional(),
  communeSlug: z.string().min(2).optional(),
  address: z.string().min(3).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  images: z.array(imageSchema).optional(),
  videos: z.array(videoSchema).optional(),
  cardPreviewVideoUrl: z.string().nullable().optional(),
  mediaItems: z.array(mediaItemSchema).optional(),
});

export type AdminListingPatchInput = z.infer<typeof adminListingPatchSchema>;

function resolveStatus(
  existing: Property,
  data: AdminListingPatchInput,
): ListingStatus {
  if (data.action === "publish") return "published";
  if (data.action === "reject") return "rejected";
  if (data.action === "reopen") return "pending";
  if (data.action === "save") {
    if (existing.status === "published") return "published";
    if (existing.status === "rejected") return "rejected";
    return "pending";
  }
  if (data.status) return data.status;
  return existing.status;
}

export function applyAdminListingPatch(
  existing: Property,
  data: AdminListingPatchInput,
): Property {
  const now = new Date().toISOString();
  const status = resolveStatus(existing, data);

  let images = existing.images;
  let videos = existing.videos;
  let cardPreviewVideoUrl = existing.cardPreviewVideoUrl ?? null;
  let hasVideoTour = existing.hasVideoTour;

  if (data.mediaItems) {
    const mediaPayload = listingMediaToPropertyPayload(data.mediaItems, data.title ?? existing.title);
    images = mediaPayload.images;
    videos = mediaPayload.videos;
    cardPreviewVideoUrl = mediaPayload.cardPreviewVideoUrl;
    hasVideoTour = mediaPayload.hasVideoTour;
  } else {
    if (data.images) images = data.images;
    if (data.videos !== undefined) videos = data.videos;
    if (data.cardPreviewVideoUrl !== undefined) {
      cardPreviewVideoUrl = data.cardPreviewVideoUrl;
    }
    if (data.videos !== undefined) {
      hasVideoTour = Boolean(data.videos?.length);
    }
  }

  let location = existing.location;
  const locFields = [
    "city",
    "citySlug",
    "district",
    "districtSlug",
    "commune",
    "communeSlug",
    "address",
  ] as const;
  const hasLocUpdate =
    data.countryCode != null || locFields.some((k) => data[k] !== undefined);

  if (hasLocUpdate) {
    const countryCode = data.countryCode?.toUpperCase();
    const countryRow = countryCode ? getCountryByCode(countryCode) : null;
    location = {
      ...location,
      ...(countryRow
        ? {
            country: countryRow.name,
            countrySlug: countrySlugFromName(countryRow.name),
          }
        : {}),
      city: data.city ?? location.city,
      citySlug: data.citySlug ?? location.citySlug,
      district: data.district ?? location.district,
      districtSlug: data.districtSlug ?? location.districtSlug,
      commune: data.commune ?? location.commune,
      communeSlug: data.communeSlug ?? location.communeSlug,
      address: data.address ?? location.address,
      lat: data.lat ?? location.lat,
      lng: data.lng ?? location.lng,
    };
  }

  return {
    ...existing,
    slug: data.slug ?? existing.slug,
    title: data.title ?? existing.title,
    summary: data.summary ?? existing.summary,
    description: data.description ?? existing.description,
    transactionType: data.transactionType ?? existing.transactionType,
    propertyType: data.propertyType ?? existing.propertyType,
    price: data.price ?? existing.price,
    currency: data.currency ?? existing.currency,
    pricePeriod: data.pricePeriod !== undefined ? data.pricePeriod : existing.pricePeriod,
    bedrooms: data.bedrooms !== undefined ? data.bedrooms : existing.bedrooms,
    bathrooms: data.bathrooms !== undefined ? data.bathrooms : existing.bathrooms,
    areaSqm: data.areaSqm !== undefined ? data.areaSqm : existing.areaSqm,
    landSqm: data.landSqm !== undefined ? data.landSqm : existing.landSqm,
    furnishing: data.furnishing !== undefined ? data.furnishing : existing.furnishing,
    amenities: data.amenities ?? existing.amenities,
    verification: data.verification ?? existing.verification,
    sellerType: data.sellerType ?? existing.sellerType,
    isFeatured: data.isFeatured ?? existing.isFeatured,
    isPremium: data.isPremium ?? existing.isPremium,
    images,
    videos,
    cardPreviewVideoUrl,
    hasVideoTour,
    location,
    status,
    updatedAt: now,
    publishedAt: status === "published" ? now : existing.publishedAt,
  };
}
