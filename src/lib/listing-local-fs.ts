import { promises as fs } from "fs";
import path from "path";
import { applyListingsBlock } from "@/lib/listings-codegen";
import type { Property } from "@/lib/types";

/**
 * Local development fallback: when no GITHUB_CONTENT_TOKEN is present the site
 * reads and writes content/listings straight on disk, so `npm run dev` and the
 * smoke suite work without production credentials.
 */
const CONTENT_DIR = path.join(process.cwd(), "content", "listings");
const PROPERTIES_FILE = path.join(process.cwd(), "src", "data", "properties.ts");

export async function readListingsFromDisk(): Promise<{ path: string; listing: Property }[]> {
  try {
    const names = (await fs.readdir(CONTENT_DIR)).filter((n) => n.endsWith(".json"));
    const out: { path: string; listing: Property }[] = [];
    for (const name of names) {
      const full = path.join(CONTENT_DIR, name);
      try {
        out.push({ path: full, listing: JSON.parse(await fs.readFile(full, "utf8")) as Property });
      } catch {
        // broken file is reported by listings:check
      }
    }
    return out;
  } catch {
    return [];
  }
}

async function rewriteCatalog(listings: Property[]): Promise<void> {
  const source = await fs.readFile(PROPERTIES_FILE, "utf8");
  await fs.writeFile(PROPERTIES_FILE, applyListingsBlock(source, listings), "utf8");
}

export async function writeListingToDisk(listing: Property, filePath?: string): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  const target = filePath ?? path.join(CONTENT_DIR, `${listing.slug.slice(0, 60)}.json`);
  await fs.writeFile(target, `${JSON.stringify(listing, null, 2)}\n`, "utf8");
  const all = (await readListingsFromDisk()).map((row) => row.listing);
  await rewriteCatalog(all);
}

export async function deleteListingFromDisk(listingId: string): Promise<boolean> {
  const all = await readListingsFromDisk();
  const target = all.find((row) => row.listing.id === listingId);
  if (!target) return false;
  await fs.unlink(target.path).catch(() => undefined);
  await rewriteCatalog(all.filter((row) => row.listing.id !== listingId).map((row) => row.listing));
  return true;
}