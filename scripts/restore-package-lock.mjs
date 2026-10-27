#!/usr/bin/env node
/**
 * Restores package-lock.json from scripts/lock-parts/* when the repo lockfile
 * is missing or corrupted (e.g. placeholder path text).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const lockPath = path.join(root, "package-lock.json");
const partsDir = path.join(__dirname, "lock-parts");

function isValidLock(content) {
  if (!content || content.length < 10_000) return false;
  if (content.includes("file://") || content.startsWith("/workspace/")) return false;
  try {
    const parsed = JSON.parse(content);
    return parsed.lockfileVersion >= 1 && typeof parsed.packages === "object";
  } catch {
    return false;
  }
}

const existing = fs.existsSync(lockPath) ? fs.readFileSync(lockPath, "utf8") : "";
if (isValidLock(existing)) {
  process.exit(0);
}

if (!fs.existsSync(partsDir)) {
  console.error("Missing scripts/lock-parts — run npm install from package.json instead.");
  process.exit(1);
}

const parts = fs
  .readdirSync(partsDir)
  .filter((f) => /^part-\d+\.txt$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

if (parts.length === 0) {
  console.error("No lock parts found.");
  process.exit(1);
}

const merged = parts.map((f) => fs.readFileSync(path.join(partsDir, f), "utf8")).join("");
if (!isValidLock(merged)) {
  console.error("Merged lock parts are invalid.");
  process.exit(1);
}

fs.writeFileSync(lockPath, merged);
console.log("Restored package-lock.json from", parts.length, "parts.");
