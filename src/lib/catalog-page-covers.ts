import { VUE_ASTON_STUDIO_ZERO_PHOTO_SLUG } from "@/lib/live-news-show";

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

const listingCardCoverCatalogSlug: Readonly<Record<string, string>> = {
  [VUE_ASTON_STUDIO_ZERO_PHOTO_SLUG]: "buy-residential-vue-aston",
};

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
