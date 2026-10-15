/**
 * Smoke test: ingest RE filter rejects obvious junk titles.
 * Usage: npx tsx scripts/smoke-ingest-filters.mjs
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(__dirname, ".."));

const { shouldRejectListingAtIngest, classifyIngestRelevance } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/aggregations/relevance.ts")).href
);

const junk = [
  { title: "Used Toyota car for sale", sourceName: "test", description: "Low mileage vehicle" },
  { title: "Hiring sales manager — Phnom Penh", sourceName: "test", description: "Full time job" },
  { title: "iPhone 15 Pro Max unlocked", sourceName: "test", description: "Phone mobile" },
  { title: "English tutor available", sourceName: "test", description: "Private tutoring" },
];

const keep = [
  {
    title: "2BR condo for rent BKK1",
    sourceName: "test",
    description: "Apartment near cafes",
    propertyType: "condo",
  },
  {
    title: "Land plot Otres hillside",
    sourceName: "test",
    description: "Titled land for sale",
    propertyType: "land",
  },
  {
    title: "Demo listing",
    sourceName: "demo",
    description: "seed",
    externalId: "demo:smoke-001",
  },
];

let failed = 0;

for (const row of junk) {
  if (!shouldRejectListingAtIngest(row)) {
    console.error("FAIL: expected reject:", row.title);
    failed += 1;
  }
}

for (const row of keep) {
  if (!classifyIngestRelevance(row).keep) {
    console.error("FAIL: expected keep:", row.title);
    failed += 1;
  }
}

if (failed > 0) {
  console.error(`${failed} assertion(s) failed`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    { ok: true, junkRejected: junk.length, kept: keep.length },
    null,
    2,
  ),
);
