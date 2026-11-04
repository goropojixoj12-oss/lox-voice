export const BLOB_PREFIX = "seaps-listings";

export const LISTING_MEDIA_MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const LISTING_MEDIA_MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export const LISTING_MEDIA_URL_PREFIX = "/api/listings/media/";

export function listingMediaPublicUrl(storageKey: string): string {
  return `${LISTING_MEDIA_URL_PREFIX}${storageKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

/**
 * Inverse of `listingMediaPublicUrl`, so listings saved before keys were stored
 * can still have the right file removed. Anything that is not an uploaded
 * listing asset (a `public/` photo, a foreign host) returns null and is never deleted.
 */
export function storageKeyFromListingMediaUrl(url: string): string | null {
  if (!url.startsWith(LISTING_MEDIA_URL_PREFIX)) return null;
  const parts = url.slice(LISTING_MEDIA_URL_PREFIX.length).split("?")[0].split("/");
  let decoded: string[];
  try {
    decoded = parts.map((part) => decodeURIComponent(part));
  } catch {
    return null;
  }
  if (decoded.some((part) => part === "" || part === "." || part === "..")) return null;
  return decoded.join("/");
}

export function sanitizeListingFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}
