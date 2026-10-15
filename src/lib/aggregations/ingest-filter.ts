import type { AggregatedDraft } from "./adapters/types";
import {
  classifyListingRelevance,
  isBlockedNonRealEstateListUrl,
  shouldRejectListingAtIngest,
  type ListingRelevanceInput,
} from "./relevance";

export function draftToRelevanceInput(draft: AggregatedDraft): ListingRelevanceInput {
  return {
    title: draft.title,
    description: draft.description,
    location: draft.location,
    sourceUrl: draft.sourceUrl,
    sourceName: draft.sourceName,
    propertyType: draft.propertyType,
    externalId: draft.externalId,
  };
}

export function filterIngestDrafts(drafts: AggregatedDraft[]): {
  kept: AggregatedDraft[];
  skippedNonRe: number;
} {
  const kept: AggregatedDraft[] = [];
  let skippedNonRe = 0;
  for (const draft of drafts) {
    if (shouldRejectListingAtIngest(draftToRelevanceInput(draft))) {
      skippedNonRe += 1;
    } else {
      kept.push(draft);
    }
  }
  return { kept, skippedNonRe };
}

/** Skip polling registry rows whose list URL is a known non-RE category path. */
export function shouldSkipRegistrySourceUrl(url: string): boolean {
  return isBlockedNonRealEstateListUrl(url);
}

export { classifyListingRelevance, shouldRejectListingAtIngest };
