import { commitFiles, deleteGitFile, gitRepoConfigured, listGitDir, readGitFile } from "@/lib/github-repo";
import { applyListingsBlock } from "@/lib/listings-codegen";
import { deleteListingFromDisk, readListingsFromDisk, writeListingToDisk } from "@/lib/listing-local-fs";
import type { Property } from "@/lib/types";

const CONTENT_DIR = "content/listings";

type RepoListing = { path: string; listing: Property };

async function readAllFromRepo(): Promise<RepoListing[]> {
  // Without a token (local dev, smoke) the same files are read from disk.
  if (!gitRepoConfigured()) {
    return (await readListingsFromDisk()) as RepoListing[];
  }
  const files = (await listGitDir(CONTENT_DIR)).filter(
    (entry) => entry.type === "file" && entry.name.endsWith(".json"),
  );
  const out: RepoListing[] = [];
  for (const entry of files) {
    const file = await readGitFile(entry.path);
    if (!file) continue;
    try {
      out.push({ path: entry.path, listing: JSON.parse(file.text) as Property });
    } catch {
      // broken file is reported by listings:check
    }
  }
  return out;
}

/** Authoritative read: the repository, not the runtime store. */
export async function getListingFromRepo(id: string): Promise<Property | null> {
  const all = await readAllFromRepo();
  return all.find((row) => row.listing.id === id)?.listing ?? null;
}

export async function listListingsFromRepo(): Promise<Property[]> {
  return (await readAllFromRepo()).map((row) => row.listing);
}

/** Removes a card from the repository and rebuilds the generated catalog. */
export async function deleteListingFromRepo(id: string): Promise<boolean> {
  if (!gitRepoConfigured()) return deleteListingFromDisk(id);
  const all = await readAllFromRepo();
  const target = all.find((row) => row.listing.id === id);
  if (!target) return false;

  const remaining = all.filter((row) => row.listing.id !== id).map((row) => row.listing);
  const propertiesFile = await readGitFile("src/data/properties.ts");

  await deleteGitFile(target.path, `chore(listings): remove ${target.listing.slug}`);

  if (propertiesFile) {
    await commitFiles(`chore(listings): rebuild catalog after deleting ${target.listing.slug}`, [
      {
        path: "src/data/properties.ts",
        text: applyListingsBlock(propertiesFile.text, remaining),
      },
    ]);
  }

  return true;
}
