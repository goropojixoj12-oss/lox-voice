import { VUE_ASTON_STUDIO_ZERO_PHOTO_SLUG } from "@/lib/live-news-show";

/** Zero-photo executive home — first $330,000 card on /buy/residential. */
export const STUNNING_ARCHITECTURAL_ZERO_PHOTO_SLUG =
  "stunning-architectural-masterpiece-large-executive-3-bedroom-all-ensuites-modern-colonial-style-house-beautiful-pool-western-award-winning-architect-a-personal-project-designed-built-and-proudly-displayed-by-one-of-cambodia-s-most-respected-and-trusted-architect-builders-dA5Dl";

/** Whitelisted site-request attachments exposed as public catalog cover ads. */
export const catalogCoverBySlug: Record<
  string,
  { storageKey: string; fallbackStorageKeys?: string[]; alt: string; publicAssetPath?: string }
> = {
  "search-vue-aston-studio": {
    storageKey: "C9pb-Jyw9jfg/cover.JPG",
    fallbackStorageKeys: [
      "ilqR2sn71XuD-2/IMG_1279.jpeg",
      "ilqR2sn71XuD-2/IMG_1280.jpeg",
      "ilqR2sn71XuD-2/Vue Aston Web Page Cover.png",
      "ilqR2sn71XuD-2/IMG_1278.jpeg",
      "ilqR2sn71XuD/IMG_1278.jpeg",
    ],
    alt: "Vue Aston studio — SEAPS listing cover",
  },
  "buy-residential-stunning-title": {
    storageKey: "YSrQfu0BBqyc/Title.jpg",
    alt: "Stunning architectural masterpiece — SEAPS listing cover",
  },
};

const listingCardCoverCatalogSlug: Readonly<Record<string, string>> = {
  [VUE_ASTON_STUDIO_ZERO_PHOTO_SLUG]: "search-vue-aston-studio",
  [STUNNING_ARCHITECTURAL_ZERO_PHOTO_SLUG]: "buy-residential-stunning-title",
};

/** Catalog pages where a whitelisted marketing cover may appear on zero-photo cards. */
export const LISTING_CARD_COVER_PATHS = new Set(["/search", "/buy/residential"]);

export function resolveCatalogCoverSrc(slug: string): string | null {
  const entry = catalogCoverBySlug[slug];
  if (!entry) return null;
  return `/api/public/catalog-cover/${slug}`;
}

/** Portrait marketing cover for catalog cards when a listing has no photos. */
export function resolveListingCardCoverSrc(
  listingSlug: string,
  pathname?: string | null,
): string | null {
  if (pathname && !LISTING_CARD_COVER_PATHS.has(pathname)) return null;
  const catalogSlug = listingCardCoverCatalogSlug[listingSlug];
  if (!catalogSlug) return null;
  const entry = catalogCoverBySlug[catalogSlug];
  if (!entry) return null;
  if (entry.publicAssetPath) return entry.publicAssetPath;
  return resolveCatalogCoverSrc(catalogSlug);
}
