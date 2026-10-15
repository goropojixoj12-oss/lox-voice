import type {
  AggregatedListing,
  PublicAggregatedListing,
} from "@/lib/types";

/** Strip contacts + source identity for public API / UI. */
export function toPublicAggregatedListing(
  listing: AggregatedListing,
): PublicAggregatedListing {
  const {
    sourceName: _sourceName,
    sourceUrl: _sourceUrl,
    contacts: _contacts,
    ...publicFields
  } = listing;
  return publicFields;
}

export function toPublicAggregatedListings(
  listings: AggregatedListing[],
): PublicAggregatedListing[] {
  return listings.map(toPublicAggregatedListing);
}

/** Light HTML/script scrub for pasted or scraped descriptions. */
export function sanitizeDescription(raw: string): string {
  return raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}
