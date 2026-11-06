import { brand } from "@/config/brand";
import { commitFiles, gitRepoConfigured, readGitFile } from "@/lib/github-repo";
import type { Property, PropertyImage } from "@/lib/types";

/**
 * Copies one listing from the cabinet into the repository:
 *   content/listings/<slug>.json
 *   public/media/listings/<slug>/NN.jpg
 *
 * Photos that still live behind the old media route are pulled once and stored
 * as normal files, so the card never depends on an external store again.
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

export async function exportListingToRepo(
  listing: Property,
  options: { extraPhotos?: { contentType: string; base64: string }[] } = {},
): Promise<{ commitUrl: string; slug: string; photoCount: number; skippedPhotos: number }> {
  if (!gitRepoConfigured()) {
    throw new Error(
      "Экспорт в репозиторий не настроен: добавьте GITHUB_CONTENT_TOKEN (Contents: read & write) в переменные Vercel.",
    );
  }

  const slug = normalizeSlug(listing.slug || listing.id);
  const existing = await readGitFile(`${CONTENT_DIR}/${slug}.json`);
  if (existing) {
    const parsed = JSON.parse(existing.text) as { id?: string };
    if (parsed.id && parsed.id !== listing.id) {
      throw new Error(`slug "${slug}" уже занят другой карточкой (${parsed.id})`);
    }
  }

  const files: { path: string; base64?: string; text?: string }[] = [];
  const images: PropertyImage[] = [];
  let index = 0;
  let skipped = 0;

  for (const image of listing.images ?? []) {
    if (!image?.url) continue;
    if (image.url.startsWith("/media/")) {
      images.push(image);
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
    images.push({
      id: `img-${index}`,
      url: `/media/listings/${slug}/${name}`,
      alt: image.alt || listing.title,
      isCover: image.isCover || index === 1,
    });
  }

  for (const photo of options.extraPhotos ?? []) {
    index += 1;
    const name = String(index).padStart(2, "0") + extFor(photo.contentType);
    const path = `public/media/listings/${slug}/${name}`;
    files.push({ path, base64: photo.base64 });
    images.push({
      id: `img-${index}`,
      url: `/media/listings/${slug}/${name}`,
      alt: listing.title,
      isCover: images.length === 0,
    });
  }

  const payload: Property = {
    ...listing,
    slug,
    images,
    visibility: listing.visibility ?? "public",
  };

  files.push({
    path: `${CONTENT_DIR}/${slug}.json`,
    text: `${JSON.stringify(payload, null, 2)}\n`,
  });

  const commitUrl = await commitFiles(
    `feat(listings): publish ${slug} from the cabinet`,
    files,
  );

  return { commitUrl, slug, photoCount: images.length, skippedPhotos: skipped };
}