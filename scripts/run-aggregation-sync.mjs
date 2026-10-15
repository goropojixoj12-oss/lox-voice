/**
 * Local smoke test: run one aggregation sync (filesystem storage).
 * Usage: npx tsx scripts/run-aggregation-sync.mjs [--demo-only]
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoOnly = process.argv.includes("--demo-only");

process.chdir(path.join(__dirname, ".."));

const { runAggregationSync } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/aggregations/sync.ts")).href
);

const summary = await runAggregationSync(
  demoOnly
    ? { adapterIds: ["demo"], includeRegistry: false }
    : { batchSize: 8, includeRegistry: true },
);

console.log(JSON.stringify(summary, null, 2));
if (summary.total < 1 && summary.created < 1) {
  console.error("Expected at least 1 listing after sync");
  process.exit(1);
}
