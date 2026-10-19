const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
};

export function inferMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? file.type ?? "application/octet-stream";
}

export function mediaKindFromMime(mime: string): "image" | "video" | null {
  const lower = mime.toLowerCase();
  if (lower.startsWith("image/")) {
    if (["image/jpeg", "image/png", "image/webp", "image/gif"].includes(lower)) return "image";
    return null;
  }
  if (lower.startsWith("video/")) return "video";
  return null;
}
