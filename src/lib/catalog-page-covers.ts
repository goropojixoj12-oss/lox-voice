/** Whitelisted site-request attachments exposed as public catalog cover ads. */
export const catalogCoverBySlug: Record<
  string,
  { storageKey: string; fallbackStorageKeys?: string[]; alt: string; publicAssetPath?: string }
> = {};

const listingCardCoverCatalogSlug: Readonly<Record<string, string>> = {};

export function resolveCatalogCoverSrc(slug: string): string | null {
  const entry = catalogCoverBySlug[slug];
  if (!entry) return null;
  return `/api/public/catalog-cover/${slug}`;
}

/** Portrait marketing cover for catalog cards when a listing has no photos. */
export function resolveListingCardCoverSrc(listingSlug: string): string | null {
  const catalogSlug = listingCardCoverCatalogSlug[listingSlug];
  if (!catalogSlug) return null;
  const entry = catalogCoverBySlug[catalogSlug];
  if (entry?.publicAssetPath) return entry.publicAssetPath;
  return resolveCatalogCoverSrc(catalogSlug);
}
