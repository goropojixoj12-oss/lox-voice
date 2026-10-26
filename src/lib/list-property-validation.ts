import type { DealSelection } from "@/components/dashboard/list-property-deal-step";
import { isWorldCountryCode } from "@/data/countries";
import type { ListPropertyDraftForm } from "@/lib/list-property-draft";
import type { ListingMediaItem } from "@/lib/list-property-media";
import { LIST_PROPERTY_STEP_COUNT } from "@/lib/list-property-steps";

export function listPropertyStepErrorMessage(stepIndex: number): string {
  switch (stepIndex) {
    case 0:
      return "Choose a deal type and category to continue.";
    case 1:
      return "Location: fill country, city, district, commune (at least 2 characters), and address (at least 3 characters).";
    case 2:
      return "Enter a price greater than zero.";
    case 3:
      return "Title (8+ characters), summary (12+), and description (40+ characters) are required.";
    case 4:
      return "Photos step is optional — you can continue without uploading.";
    case 5:
      return "Enter contact name and a valid email.";
    default:
      return "Please complete the required fields for this step.";
  }
}

export function validateListPropertyStep(
  stepIndex: number,
  form: ListPropertyDraftForm,
  dealSelection: DealSelection | null,
  mediaItems: ListingMediaItem[],
): boolean {
  switch (stepIndex) {
    case 0:
      return dealSelection != null;
    case 1:
      return Boolean(
        isWorldCountryCode(form.countryCode) &&
          form.city.trim().length >= 2 &&
          form.district.trim().length >= 2 &&
          form.commune.trim().length >= 2 &&
          form.address.trim().length >= 3,
      );
    case 2:
      return Number(form.price) > 0;
    case 3:
      return (
        form.title.trim().length >= 8 &&
        form.summary.trim().length >= 12 &&
        form.description.trim().length >= 40
      );
    case 4:
      return true;
    case 5:
      return form.contactName.trim().length >= 2 && form.contactEmail.includes("@");
    default:
      return true;
  }
}

/** First step index (0-based) that fails validation, or null if all pass. */
export function firstInvalidListPropertyStep(
  form: ListPropertyDraftForm,
  dealSelection: DealSelection | null,
  mediaItems: ListingMediaItem[],
): number | null {
  for (let i = 0; i < LIST_PROPERTY_STEP_COUNT - 1; i++) {
    if (!validateListPropertyStep(i, form, dealSelection, mediaItems)) return i;
  }
  return null;
}

/** Fill minimal location fields when an older draft skipped commune/address. */
export function normalizeListPropertyFormForSubmit(form: ListPropertyDraftForm): ListPropertyDraftForm {
  const commune = form.commune.trim();
  const address = form.address.trim();
  const communeSlug = form.communeSlug.trim();
  const fallbackCommune = form.district.trim() || "Area";
  const fallbackAddress =
    address.length >= 3
      ? address
      : [form.district, form.city].filter(Boolean).join(", ").trim() || "See listing details";

  return {
    ...form,
    commune: commune.length >= 2 ? commune : fallbackCommune,
    communeSlug: communeSlug.length >= 2 ? communeSlug : form.districtSlug || "area",
    address: fallbackAddress.length >= 3 ? fallbackAddress : "See listing details",
  };
}

export function formatListingApiIssues(issues: unknown): string | null {
  if (!Array.isArray(issues) || issues.length === 0) return null;
  const first = issues[0] as { path?: (string | number)[]; message?: string };
  const path = first.path?.length ? first.path.join(".") : "listing";
  const message = first.message ?? "Invalid value";
  return `${path}: ${message}`;
}
