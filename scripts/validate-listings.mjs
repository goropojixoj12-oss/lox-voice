#!/usr/bin/env node
/**
 * Fails the build when a listing card would break on the site:
 *  - missing or malformed fields
 *  - duplicate slug / id
 *  - a photo path that points outside the repo or at a file that does not exist
 *  - zero photos (unless the listing is explicitly marked visibility "hidden")
 *
 *   npm run listings:check
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const CONTENT = path.join(ROOT, "content", "listings");
const PUBLIC = path.join(ROOT, "public");

const REQUIRED = [
  "id",
  "slug",
  "title",
  "summary",
  "description",
  "transactionType",
  "propertyType",
  "status",
  "price",
  "currency",
  "location",
];
const DEALS = new Set(["sale", "rent", "short_stay"]);
const TYPES = new Set([
  "apartment",
  "condo",
  "house",
  "villa",
  "townhouse",
  "commercial",
  "office",
  "retail",
  "warehouse",
  "land",
  "project_unit",
]);

const errors = [];
const warnings = [];
const seenSlug = new Map();
const seenId = new Map();
const referenced = new Set();

const files = fs.readdirSync(CONTENT).filter((f) => f.endsWith(".json"));
if (files.length === 0) errors.push("content/listings is empty");

for (const file of files) {
  const full = path.join(CONTENT, file);
  let listing;
  try {
    listing = JSON.parse(fs.readFileSync(full, "utf8"));
  } catch (err) {
    errors.push(`${file}: invalid JSON (${err.message})`);
    continue;
  }

  const where = `content/listings/${file}`;
  for (const key of REQUIRED) {
    if (listing[key] === undefined || listing[key] === null || listing[key] === "") {
      errors.push(`${where}: missing "${key}"`);
    }
  }

  if (!DEALS.has(listing.transactionType)) errors.push(`${where}: bad transactionType "${listing.transactionType}"`);
  if (!TYPES.has(listing.propertyType)) errors.push(`${where}: bad propertyType "${listing.propertyType}"`);

  if (typeof listing.price !== "number" || !(listing.price > 0)) errors.push(`${where}: price must be a positive number`);

  if (!listing.location || !listing.location.citySlug) errors.push(`${where}: location.citySlug is required`);
  if (
    !listing.location ||
    !Number.isFinite(listing.location.lat) ||
    !Number.isFinite(listing.location.lng) ||
    (listing.location.lat === 0 && listing.location.lng === 0)
  ) {
    warnings.push(`${where}: no map coordinates (detail page shows "no map" instead of a pin)`);
  }

  if (listing.visibility && !["public", "hidden"].includes(listing.visibility)) {
    errors.push(`${where}: visibility must be "public" or "hidden"`);
  }
  if (listing.design && !["standard", "slides"].includes(listing.design)) {
    errors.push(`${where}: design must be "standard" or "slides"`);
  }

  if (seenSlug.has(listing.slug)) errors.push(`${where}: duplicate slug (also in ${seenSlug.get(listing.slug)})`);
  seenSlug.set(listing.slug, where);
  if (seenId.has(listing.id)) errors.push(`${where}: duplicate id (also in ${seenId.get(listing.id)})`);
  seenId.set(listing.id, where);

  const images = Array.isArray(listing.images) ? listing.images : [];
  if (images.length === 0) {
    const note = `${where}: no photos`;
    if (listing.visibility === "hidden" || listing.mediaPending === true) warnings.push(note);
    else errors.push(`${note} (hide the listing, add photos, or mark mediaPending)`);
  }

  for (const [i, image] of images.entries()) {
    const url = image?.url;
    if (typeof url !== "string" || !url.startsWith("/media/")) {
      errors.push(`${where}: image[${i}] must be a local /media/... path, got "${url}"`);
      continue;
    }
    const filePath = path.join(PUBLIC, url.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      errors.push(`${where}: image[${i}] file is missing: public${url}`);
      continue;
    }
    referenced.add(path.relative(PUBLIC, filePath).replace(/\\/g, "/"));
    if (fs.statSync(filePath).size > 400 * 1024) {
      warnings.push(`${where}: image[${i}] is ${Math.round(fs.statSync(filePath).size / 1024)}KB - compress to webp`);
    }
  }
}

const orphanPhotos = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else {
      const rel = path.relative(PUBLIC, p).replace(/\\/g, "/");
      if (rel.startsWith("media/listings/") && !referenced.has(rel)) orphanPhotos.push(rel);
    }
  }
};
const listingsMedia = path.join(PUBLIC, "media", "listings");
if (fs.existsSync(listingsMedia)) walk(listingsMedia);

for (const orphan of orphanPhotos) warnings.push(`unused photo: public/${orphan}`);

for (const warning of warnings) console.warn(`warn  ${warning}`);
if (errors.length > 0) {
  for (const error of errors) console.error(`error ${error}`);
  console.error(`\nlistings:check FAILED - ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}

console.log(`listings:check ok - ${files.length} listing(s), ${referenced.size} photo(s), ${warnings.length} warning(s)`);