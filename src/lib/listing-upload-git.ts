import { createHash } from "node:crypto";
import { commitFiles, gitRepoConfigured } from "@/lib/github-repo";

/**
 * Listing uploads go straight into the repository - no Blob, no object store.
 *
 * Files land under content/uploads/<userId>/ (not public/), so a batch of
 * photos does not trigger a site build for every file. They are served through
 * /api/uploads/... while the listing is a draft, and copied into
 * public/media/listings/<slug>/ by the export step that publishes the card.
 */
export const UPLOAD_ROOT = "content/uploads";

export function uploadsConfigured(): boolean {
  return gitRepoConfigured();
}

function extFrom(contentType: string, fileName: string): string {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(fileName)?.[1]?.toLowerCase();
  if (fromName) return `.${fromName}`;
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  if (contentType.includes("mp4")) return ".mp4";
  if (contentType.includes("webm")) return ".webm";
  if (contentType.includes("quicktime")) return ".mov";
  return ".jpg";
}

export function uploadPathFromUrl(url: string): string | null {
  // /api/uploads/<userId>/<file> -> content/uploads/<userId>/<file>
  const prefix = "/api/uploads/";
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length).split("?")[0];
  if (!rest) return null;
  return `${UPLOAD_ROOT}/${rest}`;
}

export function uploadUrlFromPath(path: string): string {
  return `/api/uploads/${path.slice(UPLOAD_ROOT.length + 1)}`;
}

export async function saveListingUpload(input: {
  userId: string;
  fileName: string;
  bytes: Buffer;
  contentType: string;
}): Promise<{ url: string; path: string }> {
  if (!gitRepoConfigured()) {
    throw new Error(
      "Загрузка файлов не настроена: нужен GITHUB_CONTENT_TOKEN с правом Contents: read & write",
    );
  }
  const digest = createHash("sha1").update(input.bytes).digest("hex").slice(0, 12);
  const ext = extFrom(input.contentType, input.fileName);
  const path = `${UPLOAD_ROOT}/${input.userId}/${digest}${ext}`;

  await commitFiles(`chore(uploads): ${input.fileName} for ${input.userId}`, [
    { path, base64: input.bytes.toString("base64") },
  ]);

  return { url: uploadUrlFromPath(path), path };
}