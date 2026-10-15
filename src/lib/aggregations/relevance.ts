import type { AggregatedListing, PropertyType } from "@/lib/types";

const RE_PROPERTY_TYPES = new Set<PropertyType>([
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
]);

/** Demo seed rows — always keep. */
export function isDemoAggregatedListing(listing: AggregatedListing): boolean {
  return (
    listing.externalId.startsWith("demo:") ||
    (listing.sourceUrl?.includes("example.local/demo") ?? false)
  );
}

const INCLUDE_PATTERNS: RegExp[] = [
  /\breal[\s-]?estate\b/i,
  /\bproperty\b/i,
  /\bproperties\b/i,
  /\bfor[\s-]?rent\b/i,
  /\bfor[\s-]?sale\b/i,
  /\brent(?:al|ing)?\b/i,
  /\blease\b/i,
  /\bsale\b/i,
  /\bapartment\b/i,
  /\bcondo(?:minium)?\b/i,
  /\bvilla\b/i,
  /\btownhouse\b/i,
  /\bshophouse\b/i,
  /\bhouse\b/i,
  /\bhome\b/i,
  /\bland\b/i,
  /\bplot\b/i,
  /\bborey\b/i,
  /\bwarehouse\b/i,
  /\boffice\b/i,
  /\bcommercial\b/i,
  /\bretail\b/i,
  /\bbedroom\b/i,
  /\bbr\b/i,
  /\bb\d+\/?\s*b\d*\b/i,
  /\bsqm\b/i,
  /\bm²\b/i,
  /\bm2\b/i,
  /\bផ្ទះ\b/u,
  /\bដី\b/u,
  /\bជួល\b/u,
  /\bលក់\b/u,
  /\bអាគារ\b/u,
  /\bflat\b/i,
];

const EXCLUDE_PATTERNS: RegExp[] = [
  /\bcar[s]?\b/i,
  /\bvehicle[s]?\b/i,
  /\bmotor(?:bike|cycle)?\b/i,
  /\bscooter\b/i,
  /\btruck\b/i,
  /\bjob[s]?\b/i,
  /\bcareer[s]?\b/i,
  /\bhiring\b/i,
  /\brecruit(?:ment|ing)?\b/i,
  /\bphone\b/i,
  /\bmobile\b/i,
  /\biphone\b/i,
  /\bsamsung\b/i,
  /\blaptop\b/i,
  /\belectronics?\b/i,
  /\bfurniture only\b/i,
  /\bsofa only\b/i,
  /\btutor(?:ing)?\b/i,
  /\bvisa service\b/i,
  /\btranslation service\b/i,
  /\bរថយន្ត\b/u,
  /\bការងារ\b/u,
  /\bទូរស័ព្ទ\b/u,
];

const URL_EXCLUDE_PATTERNS: RegExp[] = [
  /\/(?:jobs?|careers?|employment|hiring)(?:\/|$|\?)/i,
  /\/(?:cars?|vehicles?|motors?|motorbikes?|motorcycles?)(?:\/|$|\?)/i,
  /\/(?:phones?|mobiles?|electronics?|computers?)(?:\/|$|\?)/i,
  /\/(?:services?|business-services)(?:\/|$|\?)/i,
  /khmer24\.com\/en\/c-(?!property)[a-z0-9-]+\.html/i,
  /bongthom\.com\/en\/classifieds\/(?!property)/i,
];

const URL_INCLUDE_PATTERNS: RegExp[] = [
  /property/i,
  /real[\s-]?estate/i,
  /realestate/i,
  /for-?(?:sale|rent)/i,
  /\/(?:buy|rent|sale|land|house|condo|apartment|villa|townhouse)/i,
  /classifieds\/property/i,
  /dotproperty/i,
  /propertyguru/i,
  /propertyhub/i,
  /propertyarea/i,
  /cambodia-property/i,
  /khmerproperty/i,
  /phnompenhrealestate/i,
  /zillaproperty/i,
  /pointerasia\.com\/property/i,
];

export type RealEstateRelevanceResult =
  | { keep: true; reason: string }
  | { keep: false; reason: string };

function haystack(listing: AggregatedListing): string {
  return [listing.title, listing.description, listing.location ?? "", listing.sourceUrl ?? "", listing.sourceName]
    .join(" ")
    .toLowerCase();
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/**
 * Conservative classifier: remove only when non-RE signals are clear and no RE signal overrides.
 */
export function classifyRealEstateRelevance(
  listing: AggregatedListing,
): RealEstateRelevanceResult {
  if (isDemoAggregatedListing(listing)) {
    return { keep: true, reason: "demo_seed" };
  }

  if (listing.propertyType && RE_PROPERTY_TYPES.has(listing.propertyType)) {
    return { keep: true, reason: "property_type_set" };
  }

  const url = listing.sourceUrl ?? "";
  const text = haystack(listing);
  const urlExclude = url ? matchesAny(url, URL_EXCLUDE_PATTERNS) : false;
  const urlInclude = url ? matchesAny(url, URL_INCLUDE_PATTERNS) : false;
  const textInclude = matchesAny(text, INCLUDE_PATTERNS);
  const textExclude = matchesAny(text, EXCLUDE_PATTERNS);

  if (urlInclude || textInclude) {
    return { keep: true, reason: urlInclude ? "url_re_signal" : "text_re_signal" };
  }

  if (urlExclude && !textInclude) {
    return { keep: false, reason: "url_non_re_category" };
  }

  if (textExclude && !textInclude && !urlInclude) {
    return { keep: false, reason: "text_non_re_keywords" };
  }

  return { keep: true, reason: "unclear_default_keep" };
}

export function isRealEstateAggregatedListing(listing: AggregatedListing): boolean {
  return classifyRealEstateRelevance(listing).keep;
}
