#!/usr/bin/env node
/**
 * Builds src/data/properties.ts from content/listings/*.json.
 *
 * content/listings is the single source of truth for listings: one JSON file
 * per listing, photos next to the code in public/media. Nothing else may write
 * to properties.ts.
 *
 *   npm run listings:build
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(ROOT, "content", "listings");
const TARGET = path.join(ROOT, "src", "data", "properties.ts");
const BEGIN = "// <listings:begin>";
const END = "// <listings:end>";

const files = fs
  .readdirSync(CONTENT)
  .filter((f) => f.endsWith(".json"))
  .sort();

const listings = files.map((file) => {
  const raw = fs.readFileSync(path.join(CONTENT, file), "utf8");
  const data = JSON.parse(raw);
  data.__file = file;
  return data;
});

const seenSlug = new Map();
const seenId = new Map();
for (const l of listings) {
  if (seenSlug.has(l.slug)) throw new Error(`duplicate slug "${l.slug}" in ${l.__file} and ${seenSlug.get(l.slug)}`);
  if (seenId.has(l.id)) throw new Error(`duplicate id "${l.id}" in ${l.__file} and ${seenId.get(l.id)}`);
  seenSlug.set(l.slug, l.__file);
  seenId.set(l.id, l.__file);
}

listings.sort((a, b) => {
  const feat = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
  if (feat !== 0) return feat;
  return Date.parse(b.publishedAt ?? 0) - Date.parse(a.publishedAt ?? 0);
});

const body = listings
  .map(({ __file, ...listing }) =>
    JSON.stringify(listing, null, 2)
      .split("\n")
      .map((line, i) => (i === 0 ? `  ${line}` : `  ${line}`))
      .join("\n"),
  )
  .join(",\n");

const block = `${BEGIN} (generated from content/listings - do not edit by hand)
export const properties: Property[] = [
  ${body},
];
${END}`;

const current = fs.readFileSync(TARGET, "utf8");
const start = current.indexOf(BEGIN);
const stop = current.indexOf(END);
if (start < 0 || stop < 0) {
  throw new Error(`markers not found in ${path.relative(ROOT, TARGET)} (expected ${BEGIN} ... ${END})`);
}

const next = current.slice(0, start) + block + current.slice(stop + END.length);
fs.writeFileSync(TARGET, next, "utf8");
console.log(`listings:build - ${listings.length} listing(s) -> ${path.relative(ROOT, TARGET)}`);