export const BLOB_PREFIX = "seaps-listings";

export const LISTING_MEDIA_MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const LISTING_MEDIA_MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export function listingMediaPublicUrl(storageKey: string): string {
  return `/api/listings/media/${storageKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export function sanitizeListingFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}
