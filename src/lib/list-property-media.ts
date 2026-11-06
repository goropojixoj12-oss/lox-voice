export type ListingMediaKind = "image" | "video";

export const PREVIEW_PHOTO_DEFAULT = 3;
export const PREVIEW_PHOTO_MIN = 2;
export const PREVIEW_PHOTO_MAX = 8;
export const PREVIEW_PHOTO_CHOICES = [2, 3, 4, 5, 6, 7, 8];

/** Anything odd (empty field, old listings, junk from the store) falls back to the default. */
export function clampPreviewPhotoCount(value: unknown): number {
  if (value === null || value === undefined || value === "") return PREVIEW_PHOTO_DEFAULT;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return PREVIEW_PHOTO_DEFAULT;
  return Math.min(PREVIEW_PHOTO_MAX, Math.max(PREVIEW_PHOTO_MIN, Math.round(n)));
}

export type ListingMediaItem = {
  id: string;
  kind: ListingMediaKind;
  url: string;
  storageKey?: string;
  name: string;
  size?: number;
  isCover?: boolean;
  isCardPreview?: boolean;
};

export function sortListingMedia(items: ListingMediaItem[]): ListingMediaItem[] {
  return [...items].sort((a, b) => {
    if (a.isCover && !b.isCover) return -1;
    if (!a.isCover && b.isCover) return 1;
    if (a.isCardPreview && !b.isCardPreview) return -1;
    if (!a.isCardPreview && b.isCardPreview) return 1;
    return 0;
  });
}

/**
 * Cover first, then photos explicitly chosen for the card preview flipbook,
 * then the rest in the order the user left them. Exactly one `isCover` flag —
 * consumers read `images.find(i => i.isCover)` or `images[0]`, so two covers
 * silently lose the user's choice.
 */
export function orderImagesWithCover<T extends { isCover?: boolean; isCardPreview?: boolean }>(
  images: T[],
): T[] {
  if (images.length === 0) return [];
  const chosen = images.find((i) => i.isCover) ?? images[0];
  const chosenOnly = (i: T) => i !== chosen;
  const previewChosen = images.filter((i) => i !== chosen && i.isCardPreview);
  const rest = images.filter((i) => i !== chosen && !i.isCardPreview);
  return [chosen, ...previewChosen, ...rest].map((i) => ({
    ...i,
    isCover: i === chosen,
  }));
}

export function listingMediaToPropertyPayload(items: ListingMediaItem[], title: string) {
  const images = orderImagesWithCover(items.filter((i) => i.kind === "image")).map((i) => ({
    id: i.id,
    url: i.url,
    alt: title,
    isCover: i.isCover,
    isCardPreview: i.isCardPreview,
    storageKey: i.storageKey,
  }));

  const videos = items
    .filter((i) => i.kind === "video")
    .map((i) => ({
      id: i.id,
      url: i.url,
      label: i.name,
      role: i.isCardPreview ? ("card_preview" as const) : ("tour" as const),
      storageKey: i.storageKey,
    }));

  const cardPreview = items.find((i) => i.kind === "video" && i.isCardPreview);

  return {
    images,
    videos: videos.length ? videos : undefined,
    cardPreviewVideoUrl: cardPreview?.url ?? null,
    hasVideoTour: videos.some((v) => v.role === "tour"),
  };
}
