import { createHash } from "node:crypto";
import { brand } from "@/config/brand";
import { commitFiles, gitRepoConfigured, listGitDir, readGitFile } from "@/lib/github-repo";
import { applyListingsBlock } from "@/lib/listings-codegen";
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

function photoName(base64: string, contentType: string): string {
  // Content-addressed name: exporting the same photo twice reuses the file
  // instead of piling 04.jpg, 05.jpg, 06.jpg next to it.
  const digest = createHash("sha1").update(Buffer.from(base64, "base64")).digest("hex").slice(0, 10);
  return `photo-${digest}${extFor(contentType)}`;
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
    // Local development: same file, written on disk, no commit.
    const slug = normalizeSlug(listing.slug || listing.id);
    const existingLocal = (await (await import("@/lib/listing-local-fs")).readListingsFromDisk()).find(
      (row) => row.listing.id === listing.id,
    );
    const finalSlug = existingLocal?.listing.slug ?? slug;
    const mergedLocal: Property = {
      ...existingLocal?.listing,
      ...listing,
      slug: finalSlug,
      images: existingLocal?.listing.images?.length
        ? existingLocal.listing.images
        : listing.images,
      visibility: listing.visibility ?? existingLocal?.listing.visibility ?? "public",
    };
    await (await import("@/lib/listing-local-fs")).writeListingToDisk(
      mergedLocal,
      existingLocal?.path,
    );
    return {
      commitUrl: "local://content/listings",
      slug: finalSlug,
      photoCount: mergedLocal.images?.length ?? 0,
      skippedPhotos: 0,
    };
  }
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
    const name = photoName(fetched.base64, fetched.contentType);
    const path = `public/media/listings/${slug}/${name}`;
    const publicUrl = `/media/listings/${slug}/${name}`;
    if (seen.has(publicUrl)) continue;
    files.push({ path, base64: fetched.base64 });
    pushImage({
      id: "tmp",
      url: publicUrl,
      alt: image.alt || listing.title,
      isCover: image.isCover,
    });
  }

  // 3. Extra uploads from the export dialog.
  for (const photo of options.extraPhotos ?? []) {
    const name = photoName(photo.base64, photo.contentType);
    const publicUrl = `/media/listings/${slug}/${name}`;
    if (seen.has(publicUrl)) continue;
    files.push({ path: `public/media/listings/${slug}/${name}`, base64: photo.base64 });
    pushImage({
      id: "tmp",
      url: publicUrl,
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

  // The cabinet record often has no map pin; never overwrite curated coordinates
  // from the repo with zeros.
  if (merged.location && existing?.listing.location) {
    const prev = existing.listing.location;
    if ((!merged.location.lat || merged.location.lat === 0) && prev.lat) merged.location.lat = prev.lat;
    if ((!merged.location.lng || merged.location.lng === 0) && prev.lng) merged.location.lng = prev.lng;
  }

  files.push({ path: targetPath, text: `${JSON.stringify(merged, null, 2)}\n` });

  // The site renders from src/data/properties.ts, so the export has to rebuild
  // it in the same commit - otherwise the card lands in git but not on the site.
  const allListings: Property[] = [];
  for (const entry of (await listGitDir(CONTENT_DIR)).filter(
    (f) => f.type === "file" && f.name.endsWith(".json"),
  )) {
    if (entry.path === targetPath) {
      allListings.push(merged);
      continue;
    }
    const file = await readGitFile(entry.path);
    if (!file) continue;
    try {
      allListings.push(JSON.parse(file.text) as Property);
    } catch {
      // broken file is reported by listings:check
    }
  }
  if (!allListings.some((item) => item.id === merged.id)) allListings.push(merged);

  const propertiesFile = await readGitFile("src/data/properties.ts");
  if (propertiesFile) {
    files.push({
      path: "src/data/properties.ts",
      text: applyListingsBlock(propertiesFile.text, allListings),
    });
  }

  const commitUrl = await commitFiles(
    `feat(listings): publish ${slug} from the cabinet`,
    files,
  );

  return { commitUrl, slug, photoCount: images.length, skippedPhotos: skipped };
}