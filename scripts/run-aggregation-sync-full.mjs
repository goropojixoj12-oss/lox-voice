/**
 * Local full registry rotation (filesystem storage).
 * Usage:
 *   npx tsx scripts/run-aggregation-sync-full.mjs
 *   npx tsx scripts/run-aggregation-sync-full.mjs --max-batches=2   # smoke
 *   npx tsx scripts/run-aggregation-sync-full.mjs --demo-only
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoOnly = process.argv.includes("--demo-only");
const maxBatchesArg = process.argv.find((a) => a.startsWith("--max-batches="));
const maxBatches = maxBatchesArg
  ? Math.max(1, Number(maxBatchesArg.split("=")[1]) || 1)
  : 80;

process.chdir(path.join(__dirname, ".."));

const { runAggregationSync } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/aggregations/sync.ts")).href
);

if (demoOnly) {
  const summary = await runAggregationSync({
    adapterIds: ["demo"],
    includeRegistry: false,
  });
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.total >= 1 ? 0 : 1);
}

let batches = 0;
let sourcesPolled = 0;
let totalEnabled = 0;
let lastSummary = null;

while (batches < maxBatches) {
  const summary = await runAggregationSync({ batchSize: 50, includeRegistry: true });
  lastSummary = summary;
  batches += 1;
  sourcesPolled += summary.sourcesAttempted ?? 0;
  totalEnabled = summary.syncCursor?.totalEnabled ?? totalEnabled;
  console.log(
    `[batch ${batches}] sources +${summary.sourcesAttempted} (${sourcesPolled}/${totalEnabled}) listings=${summary.total} fetched=${summary.fetched} +${summary.created}`,
  );
  if (totalEnabled > 0 && sourcesPolled >= totalEnabled) break;
  if ((summary.sourcesAttempted ?? 0) === 0) break;
}

console.log("\nFinal summary:");
console.log(JSON.stringify(lastSummary, null, 2));

const done = totalEnabled > 0 && sourcesPolled >= totalEnabled;
if (!done && maxBatches < 80) {
  console.log(`(Stopped early: --max-batches=${maxBatches})`);
  process.exit(0);
}
process.exit(lastSummary && lastSummary.total >= 1 ? 0 : 1);
