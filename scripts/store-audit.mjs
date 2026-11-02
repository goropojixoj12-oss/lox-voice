#!/usr/bin/env node
// Read-only audit of the Vercel Blob listing store against the code-owned catalog.
// Exit 1 on anything that would publish a duplicate or a broken card.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { get } from "@vercel/blob";

const ROOT = path.resolve(import.meta.dirname, "..");
const LISTINGS_KEY = "seaps-data/listings.json";

function loadEnvFile(name) {
  const file = path.join(ROOT, name);
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)="([^"\r\n]*)"$/) || line.match(/^([A-Z0-9_]+)=([^"\r\n]*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

/** Static catalog is a plain data module; scan the fields the audit needs. */
function readCodeCatalog() {
  const src = readFileSync(path.join(ROOT, "src/data/properties.ts"), "utf8");
  const listings = [];
  let current = null;
  for (const line of src.split(/\r?\n/)) {
    if (/^\s*id: "/.test(line) && !current) {
      current = { imageFiles: [] };
    }
    if (!current) continue;
    const field = line.match(/^\s{4}([A-Za-z]+): "([^"]*)",$/);
    if (field) current[field[1]] = field[2];
    for (const m of line.matchAll(/\/media\/listings\/([^\s"']+?\.jpg)/g)) {
      current.imageFiles.push(m[1]);
    }
    if (line === "  }," || line === "  }") {
      listings.push(current);
      current = null;
    }
  }
  return listings.filter((l) => l.id && l.slug);
}

async function readStoreListings() {
  const result = await get(LISTINGS_KEY, {
    access: "private",
    useCache: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error(`store read failed (statusCode ${result?.statusCode})`);
  }
  return JSON.parse(await new Response(result.stream).text());
}

const problems = [];
const notes = [];

loadEnvFile(".env.local");
if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.VERCEL_OIDC_TOKEN) {
  console.error("store:audit needs BLOB_READ_WRITE_TOKEN or VERCEL_OIDC_TOKEN in .env.local");
  process.exit(2);
}

const code = readCodeCatalog();
const store = await readStoreListings();
const storePublished = store.filter((l) => l.status === "published");

console.log(`code listings: ${code.length} · store listings: ${store.length} (published ${storePublished.length})`);

// An empty parse would make every check below vacuously pass.
if (code.length === 0) {
  console.error("properties.ts parsed to zero listings — the scanner is out of date, not the catalog");
  process.exit(1);
}

const promotedTargets = new Set(code.map((c) => c.promotedFrom).filter(Boolean));
for (const target of promotedTargets) {
  if (!store.some((l) => l.id === target)) {
    problems.push(`promotedFrom "${target}" points at a store record that no longer exists`);
  }
}

const ids = [...code.map((c) => c.id), ...store.map((s) => s.id)];
const slugs = [...code.map((c) => c.slug), ...store.map((s) => s.slug)];
for (const [label, list] of [
  ["id", ids],
  ["slug", slugs],
]) {
  const dupes = list.filter((v, i) => v && list.indexOf(v) !== i);
  for (const d of new Set(dupes)) problems.push(`duplicate ${label} "${d}" between code and store`);
}

for (const l of code) {
  if (l.status !== "published") continue;
  if (l.promotedFrom) continue;
  const shadow = storePublished.find((s) => s.slug === l.slug);
  if (shadow) {
    problems.push(
      `code "${l.id}" and store "${shadow.id}" share slug "${l.slug}" and both are public`,
    );
  }
}

for (const l of code) {
  for (const file of l.imageFiles) {
    if (!existsSync(path.join(ROOT, "public/media/listings", file))) {
      problems.push(`${l.id} references missing public/media/listings/${file}`);
    }
  }
}

const hidden = storePublished.filter((s) => promotedTargets.has(s.id));
const visibleStore = storePublished.filter((s) => !promotedTargets.has(s.id));
notes.push(`store records hidden from the catalog because code owns them: ${hidden.map((h) => h.id).join(", ") || "none"}`);
notes.push(`store records still published on their own: ${visibleStore.map((v) => v.slug).join(", ") || "none"}`);

for (const n of notes) console.log(`· ${n}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`! ${p}`);
  process.exit(1);
}
console.log("\nstore and code catalog are consistent");
