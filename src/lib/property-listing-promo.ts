export const VUE_ASTON_PROPERTY_SLUG =
  "vue-aston-3-bedroom-2-bathroom-fully-furnished-102m2-fBb84";

export function isVueAstonListingSlug(slug: string): boolean {
  return slug === VUE_ASTON_PROPERTY_SLUG;
}

export function normalizeListingHeadline(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}
