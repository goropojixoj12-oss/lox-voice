import type { DealSelection, ListingCategory } from "@/components/dashboard/list-property-deal-step";
import { DEFAULT_COUNTRY_CODE, worldCountries } from "@/data/countries";
import type { ListingMediaItem } from "@/lib/list-property-media";
import { sortListingMedia } from "@/lib/list-property-media";
import type { Property, PropertyType, TransactionType } from "@/lib/types";

export function countryCodeFromPropertyLocation(countryName: string): string {
  const match = worldCountries.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase(),
  );
  return match?.code ?? DEFAULT_COUNTRY_CODE;
}

export function inferDealSelection(listing: Property): DealSelection | null {
  let transactionType: TransactionType = listing.transactionType;
  if (transactionType === "short_stay") {
    transactionType = "rent";
  }
  if (transactionType !== "sale" && transactionType !== "rent") {
    return null;
  }

  const category = propertyTypeToListingCategory(listing.propertyType);
  return { transactionType, category };
}

function propertyTypeToListingCategory(propertyType: PropertyType): ListingCategory {
  switch (propertyType) {
    case "land":
      return "land";
    case "project_unit":
      return "development";
    case "commercial":
    case "office":
    case "retail":
    case "warehouse":
      return "commercial";
    default:
      return "residential";
  }
}

export function propertyToListingMedia(listing: Property): ListingMediaItem[] {
  const items: ListingMediaItem[] = [];

  for (const img of listing.images) {
    items.push({
      id: img.id,
      kind: "image",
      url: img.url,
      name: img.alt || listing.title,
      isCover: img.isCover,
    });
  }

  for (const vid of listing.videos ?? []) {
    items.push({
      id: vid.id,
      kind: "video",
      url: vid.url,
      name: vid.label ?? "Video",
      isCardPreview: vid.role === "card_preview",
    });
  }

  return sortListingMedia(items);
}

export function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}
