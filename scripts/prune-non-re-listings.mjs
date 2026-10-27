/**
 * Remove aggregated market-feed listings that fail real-estate relevance heuristics.
 * Usage: npx tsx scripts/prune-non-re-listings.mjs [--dry-run]
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dryRun = process.argv.includes("--dry-run");

process.chdir(path.join(__dirname, ".."));

const { classifyRealEstateRelevance } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/aggregations/relevance.ts")).href
);
const { getAggregatedListings, saveAggregatedListings } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/store.ts")).href
);

const all = await getAggregatedListings();
const kept = [];
const removed = [];

for (const listing of all) {
  const verdict = classifyRealEstateRelevance(listing);
  if (verdict.keep) kept.push(listing);
  else
    removed.push({
      id: listing.id,
      title: listing.title,
      reason: verdict.reason,
      sourceUrl: listing.sourceUrl,
    });
}

console.log(
  JSON.stringify(
    {
      dryRun,
      before: all.length,
      wouldRemove: removed.length,
      wouldKeep: kept.length,
      removedSample: removed.slice(0, 30),
    },
    null,
    2,
  ),
);

if (!dryRun && removed.length > 0) {
  const { pruneNonRealEstateListings } = await import(
    pathToFileURL(path.join(__dirname, "../src/lib/aggregations/prune-non-re.ts")).href
  );
  const result = await pruneNonRealEstateListings();
  console.log("Applied prune:", result.removed, "removed →", result.after, "remaining");
}
