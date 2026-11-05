/** Whitelisted site-request attachments exposed as public catalog cover ads. */
export const catalogCoverBySlug: Record<
  string,
  { storageKey: string; alt: string; publicAssetPath?: string }
> = {
  "buy-residential-vue-aston": {
    storageKey: "ilqR2sn71XuD/IMG_1278.jpeg",
    alt: "Vue Aston — residential property for sale",
  },
};

export function resolveCatalogCoverSrc(slug: string): string | null {
  const entry = catalogCoverBySlug[slug];
  if (!entry) return null;
  return `/api/public/catalog-cover/${slug}`;
}
