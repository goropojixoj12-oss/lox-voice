/** Local media helpers — no remote CDNs. */

export function photoUrl(id: string, _width?: number): string {
  const clean = id.replace(/^\/+/, "").replace(/\.(jpe?g|png|webp)$/i, "");
  return `/media/photos/${clean}.jpg`;
}

export function photoImage(id: string, alt: string) {
  return {
    id,
    url: photoUrl(id),
    alt,
  };
}
