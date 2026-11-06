import { brand } from "@/config/brand";
import { commitFiles, gitRepoConfigured, listGitDir, readGitFile } from "@/lib/github-repo";
import type { Property, PropertyImage } from "@/lib/types";

/**
 * Copies one listing from the cabinet into the repository:
 *   content/listings/<file>.json
 *   public/media/listings/<slug>/NN.jpg
 *
 * The export is idempotent and identity-aware: it looks the listing up by `id`
 * in content/listings first, keeps that file and slug (case included), and
 * merges photos instead of dropping the ones already stored in the repo.
 */
export function listingExportConfigured(): boolean {
  return gitRepoConfigured();
}

const CONTENT_DIR = "content/listings";

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function extFor(contentType: string): string {
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  if (contentType.includes("gif")) return ".gif";
  return ".jpg";
}

async function fetchAsBase64(url: string): Promise<{ base64: string; contentType: string } | null> {
  try {
    const absolute = url.startsWith("http") ? url : `${brand.url.replace(/\/$/, "")}${url}`;
    const res = await fetch(absolute, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      base64: buf.toString("base64"),
      contentType: res.headers.get("content-type") ?? "image/jpeg",
    };
  } catch {
    return null;
  }
}

async function findExisting(
  listingId: string,
): Promise<{ path: string; listing: Property } | null> {
  const files = (await listGitDir(CONTENT_DIR)).filter((f) => f.type === "file" && f.name.endsWith(".json"));
  for (const entry of files) {
    const file = await readGitFile(entry.path);
    if (!file) continue;
    try {
      const parsed = JSON.parse(file.text) as Property;
      if (parsed?.id === listingId) return { path: entry.path, listing: parsed };
    } catch {
      // A broken file is reported by listings:check; skip it here.
    }
  }
  return null;
}

export async function exportListingToRepo(
  listing: Property,
  options: { extraPhotos?: { contentType: string; base64: string }[] } = {},
): Promise<{ commitUrl: string; slug: string; photoCount: number; skippedPhotos: number }> {
  if (!gitRepoConfigured()) {
    throw new Error(
      "Экспорт в репозиторий не настроен: добавьте GITHUB_CONTENT_TOKEN (Contents: read & write) в переменные Vercel.",
    );
  }

  const existing = await findExisting(listing.id);
  const slug = existing?.listing.slug ?? normalizeSlug(listing.slug || listing.id);
  const targetPath = existing?.path ?? `${CONTENT_DIR}/${slug}.json`;

  const files: { path: string; base64?: string; text?: string }[] = [];
  const images: PropertyImage[] = [];
  const seen = new Set<string>();

  const pushImage = (image: PropertyImage | undefined) => {
    if (!image?.url || seen.has(image.url)) return;
    seen.add(image.url);
    images.push({ ...image, id: `img-${images.length + 1}` });
  };

  // 1. Keep whatever the repo already has for this listing.
  for (const image of existing?.listing.images ?? []) pushImage(image);

  // 2. Add photos from the cabinet: local /media paths stay as-is, anything
  //    behind the old media route is pulled once and stored as a real file.
  let index = images.length;
  let skipped = 0;
  for (const image of listing.images ?? []) {
    if (!image?.url) continue;
    if (image.url.startsWith("/media/") || seen.has(image.url)) {
      pushImage(image);
      continue;
    }
    const fetched = await fetchAsBase64(image.url);
    if (!fetched) {
      skipped += 1;
      continue;
    }
    index += 1;
    const name = String(index).padStart(2, "0") + extFor(fetched.contentType);
    const path = `public/media/listings/${slug}/${name}`;
    files.push({ path, base64: fetched.base64 });
    pushImage({
      id: "tmp",
      url: `/media/listings/${slug}/${name}`,
      alt: image.alt || listing.title,
      isCover: image.isCover,
    });
  }

  // 3. Extra uploads from the export dialog.
  for (const photo of options.extraPhotos ?? []) {
    index += 1;
    const name = String(index).padStart(2, "0") + extFor(photo.contentType);
    const path = `public/media/listings/${slug}/${name}`;
    files.push({ path, base64: photo.base64 });
    pushImage({
      id: "tmp",
      url: `/media/listings/${slug}/${name}`,
      alt: listing.title,
      isCover: images.length === 0,
    });
  }

  const merged: Property = {
    ...existing?.listing,
    ...listing,
    slug,
    images,
    visibility: listing.visibility ?? existing?.listing.visibility ?? "public",
    design: listing.design ?? existing?.listing.design,
    mediaNote: listing.mediaNote ?? existing?.listing.mediaNote,
  };

  files.push({ path: targetPath, text: `${JSON.stringify(merged, null, 2)}\n` });

  const commitUrl = await commitFiles(
    `feat(listings): publish ${slug} from the cabinet`,
    files,
  );

  return { commitUrl, slug, photoCount: images.length, skippedPhotos: skipped };
}