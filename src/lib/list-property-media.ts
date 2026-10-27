export type ListingMediaKind = "image" | "video";

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

export function listingMediaToPropertyPayload(items: ListingMediaItem[], title: string) {
  const images = items
    .filter((i) => i.kind === "image")
    .map((i, index) => ({
      id: i.id,
      url: i.url,
      alt: title,
      isCover: i.isCover || index === 0,
    }));

  const videos = items
    .filter((i) => i.kind === "video")
    .map((i) => ({
      id: i.id,
      url: i.url,
      label: i.name,
      role: i.isCardPreview ? ("card_preview" as const) : ("tour" as const),
    }));

  const cardPreview = items.find((i) => i.kind === "video" && i.isCardPreview);

  return {
    images,
    videos: videos.length ? videos : undefined,
    cardPreviewVideoUrl: cardPreview?.url ?? null,
    hasVideoTour: videos.some((v) => v.role === "tour"),
  };
}
