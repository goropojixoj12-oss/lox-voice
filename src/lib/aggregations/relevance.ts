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

/** Strong RE signals — weak words like "sale" alone are not enough at ingest. */
const STRONG_INCLUDE_PATTERNS: RegExp[] = [
  /\breal[\s-]?estate\b/i,
  /\bproperty\b/i,
  /\bproperties\b/i,
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

/**
 * Always junk (spam / non-listing), except demo seeds.
 * `domain` is a substring match (*domain) so hugedomain / mydomain match too.
 */
const DEFAULT_JUNK_KEYWORD_PATTERNS: RegExp[] = [
  /\bwife\b/i,
  /domain/i,
  /\bforum\b/i,
  /\borganized\b/i,
  /\bnews\b/i,
  /\bcasino\b/i,
  /\bkasino\b/i,
  /\bkhmerhomes\b/i,
  /\bbroker\b/i,
  /\bdreams\b/i,
  /\bsitus\b/i,
  /\bhugedomain\b/i,
  /\bips\b/i,
  /\baps\b/i,
];

const MIN_TITLE_WORDS = 5;

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
  /\/(?:forum|forums|news|casino|kasino)(?:\/|$|\?)/i,
  /domain/i,
  /khmerhomes/i,
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

/** Minimal fields used by ingest + prune classifiers. */
export type ListingRelevanceInput = {
  title: string;
  description: string;
  location?: string | null;
  sourceUrl?: string | null;
  sourceName: string;
  propertyType?: PropertyType | null;
  externalId?: string;
};

function haystackFromInput(input: ListingRelevanceInput): string {
  return [
    input.title,
    input.description,
    input.location ?? "",
    input.sourceUrl ?? "",
    input.sourceName,
  ]
    .join(" ")
    .toLowerCase();
}

function isDemoRelevanceInput(input: ListingRelevanceInput): boolean {
  return (
    (input.externalId?.startsWith("demo:") ?? false) ||
    (input.sourceUrl?.includes("example.local/demo") ?? false)
  );
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** wife / domain / title shorter than five words — default junk for ingest and prune. */
function classifyDefaultJunk(
  input: ListingRelevanceInput,
): RealEstateRelevanceResult | null {
  if (isDemoRelevanceInput(input)) {
    return null;
  }

  const text = haystackFromInput(input);
  if (matchesAny(text, DEFAULT_JUNK_KEYWORD_PATTERNS)) {
    return { keep: false, reason: "default_junk_keyword" };
  }

  const titleWords = countWords(input.title);
  if (titleWords > 0 && titleWords < MIN_TITLE_WORDS) {
    return { keep: false, reason: "title_under_five_words" };
  }

  return null;
}

/**
 * Conservative classifier: remove only when non-RE signals are clear and no RE signal overrides.
 */
export function classifyListingRelevance(
  input: ListingRelevanceInput,
): RealEstateRelevanceResult {
  if (isDemoRelevanceInput(input)) {
    return { keep: true, reason: "demo_seed" };
  }

  const defaultJunk = classifyDefaultJunk(input);
  if (defaultJunk) {
    return defaultJunk;
  }

  if (input.propertyType && RE_PROPERTY_TYPES.has(input.propertyType)) {
    return { keep: true, reason: "property_type_set" };
  }

  const url = input.sourceUrl ?? "";
  const text = haystackFromInput(input);
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

export function classifyRealEstateRelevance(
  listing: AggregatedListing,
): RealEstateRelevanceResult {
  if (isDemoAggregatedListing(listing)) {
    return { keep: true, reason: "demo_seed" };
  }
  return classifyListingRelevance({
    title: listing.title,
    description: listing.description,
    location: listing.location,
    sourceUrl: listing.sourceUrl,
    sourceName: listing.sourceName,
    propertyType: listing.propertyType,
    externalId: listing.externalId,
  });
}

export function isRealEstateListing(input: ListingRelevanceInput): boolean {
  return classifyListingRelevance(input).keep;
}

/**
 * Stricter than prune: non-RE keyword hits reject unless property type, demo, RE URL,
 * or strong RE keywords (not bare "for sale" / "rent" on a car/job/phone headline).
 */
export function classifyIngestRelevance(
  input: ListingRelevanceInput,
): RealEstateRelevanceResult {
  if (isDemoRelevanceInput(input)) {
    return { keep: true, reason: "demo_seed" };
  }

  const defaultJunk = classifyDefaultJunk(input);
  if (defaultJunk) {
    return defaultJunk;
  }

  if (input.propertyType && RE_PROPERTY_TYPES.has(input.propertyType)) {
    return { keep: true, reason: "property_type_set" };
  }

  const url = input.sourceUrl ?? "";
  const text = haystackFromInput(input);
  const urlInclude = url ? matchesAny(url, URL_INCLUDE_PATTERNS) : false;
  const urlExclude = url ? matchesAny(url, URL_EXCLUDE_PATTERNS) : false;
  const strongInclude = matchesAny(text, STRONG_INCLUDE_PATTERNS);
  const textExclude = matchesAny(text, EXCLUDE_PATTERNS);

  if (urlInclude || strongInclude) {
    return {
      keep: true,
      reason: urlInclude ? "url_re_signal" : "strong_text_re_signal",
    };
  }

  if (urlExclude) {
    return { keep: false, reason: "url_non_re_category" };
  }

  if (textExclude) {
    return { keep: false, reason: "text_non_re_keywords" };
  }

  return classifyListingRelevance(input);
}

export function shouldRejectListingAtIngest(input: ListingRelevanceInput): boolean {
  return !classifyIngestRelevance(input).keep;
}

/** Conservative reject check (same as prune). */
export function shouldRejectListing(input: ListingRelevanceInput): boolean {
  return !classifyListingRelevance(input).keep;
}

/** Registry list URLs that point at jobs/cars/etc. — skip fetch entirely. */
export function isBlockedNonRealEstateListUrl(url: string): boolean {
  if (!url.trim()) return false;
  if (matchesAny(url, URL_INCLUDE_PATTERNS)) return false;
  return matchesAny(url, URL_EXCLUDE_PATTERNS);
}

export function isRealEstateAggregatedListing(listing: AggregatedListing): boolean {
  return classifyRealEstateRelevance(listing).keep;
}
