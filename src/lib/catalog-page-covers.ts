/** Whitelisted site-request attachments exposed as public catalog cover ads. */
export const catalogCoverBySlug: Record<
  string,
  { storageKey: string; fallbackStorageKeys?: string[]; alt: string; publicAssetPath?: string }
> = {
  "buy-residential-vue-aston": {
    storageKey: "ilqR2sn71XuD-2/IMG_1279.jpeg",
    fallbackStorageKeys: [
      "ilqR2sn71XuD-2/IMG_1280.jpeg",
      "ilqR2sn71XuD-2/Vue Aston Web Page Cover.png",
      "ilqR2sn71XuD-2/IMG_1278.jpeg",
      "ilqR2sn71XuD/IMG_1278.jpeg",
    ],
    alt: "Vue Aston — residential property for sale",
    publicAssetPath: "/media/catalog/vue-aston-web-page-cover.png",
  },
};

export function resolveCatalogCoverSrc(slug: string): string | null {
  const entry = catalogCoverBySlug[slug];
  if (!entry) return null;
  return `/api/public/catalog-cover/${slug}`;
}
