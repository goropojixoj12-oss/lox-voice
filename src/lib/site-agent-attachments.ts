import path from "path";
import { commitFiles, readGitFile } from "@/lib/github-repo";

/**
 * Screenshots for site-change requests live in the repository next to the
 * request itself (content/requests/<id>/<file>). No Blob, no temp disk.
 */
const MAX_BYTES = 3 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-()+ ]+/g, "_").slice(0, 80);
  return base || "screenshot";
}

export function validateSiteRequestAttachment(file: File): string | null {
  if (file.size > MAX_BYTES) return "Image must be 3 MB or smaller.";
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_TYPES.has(type)) return "Only JPEG, PNG, WebP, or GIF screenshots are allowed.";
  return null;
}

export async function writeSiteRequestAttachment(
  requestId: string,
  file: File,
): Promise<{ storageKey: string; fileName: string; contentType: string; sizeBytes: number }> {
  const validation = validateSiteRequestAttachment(file);
  if (validation) throw new Error(validation);

  const fileName = sanitizeFileName(file.name);
  const storageKey = `content/requests/${requestId}/${fileName}`;
  const contentType = file.type || "application/octet-stream";
  const bytes = Buffer.from(await file.arrayBuffer());

  await commitFiles(`chore(requests): screenshot for ${requestId}`, [
    { path: storageKey, base64: bytes.toString("base64") },
  ]);

  return { storageKey, fileName, contentType, sizeBytes: bytes.length };
}

export async function readSiteRequestAttachment(
  storageKey: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (!storageKey.startsWith("content/requests/")) return null;
  const file = await readGitFile(storageKey).catch(() => null);
  if (!file) return null;
  const ext = path.extname(storageKey).toLowerCase();
  const contentType =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : "image/jpeg";
  return { bytes: Buffer.from(file.base64, "base64"), contentType };
}

export { EXT_BY_TYPE };