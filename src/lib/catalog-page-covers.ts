/** Whitelisted site-request attachments exposed as public catalog cover ads. */
export const catalogCoverBySlug: Record<
  string,
  { storageKey: string; alt: string; publicAssetPath?: string }
> = {
  "buy-residential-vue-aston": {
    storageKey: "7PV51gUb5HOt/Vue Aston Web Page Cover.png",
    alt: "Vue Aston — residential property for sale",
    publicAssetPath: "/media/catalog/vue-aston-web-page-cover.png",
  },
};

export function resolveCatalogCoverSrc(slug: string): string | null {
  const entry = catalogCoverBySlug[slug];
  if (!entry) return null;
  return `/api/public/catalog-cover/${slug}`;
}
