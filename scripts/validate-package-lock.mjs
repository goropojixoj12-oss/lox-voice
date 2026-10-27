#!/usr/bin/env node
/**
 * CI / pre-push guard: fail if package-lock.json is missing, a path stub, or too small.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const lockPath = path.join(__dirname, "..", "package-lock.json");

const MIN_BYTES = 10_000;
const MIN_PACKAGE_KEYS = 20;

function fail(message) {
  console.error(`validate-package-lock: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(lockPath)) {
  fail("package-lock.json is missing");
}

const content = fs.readFileSync(lockPath, "utf8");

if (content.includes("file://") || /^\/workspace\//m.test(content)) {
  fail("package-lock.json looks like a filesystem path stub, not a lockfile");
}

if (content.length < MIN_BYTES) {
  fail(
    `package-lock.json is only ${content.length} bytes (need >= ${MIN_BYTES}). Regenerate with npm install and commit via git push.`,
  );
}

let parsed;
try {
  parsed = JSON.parse(content);
} catch {
  fail("package-lock.json is not valid JSON");
}

if (typeof parsed.lockfileVersion !== "number" || parsed.lockfileVersion < 1) {
  fail("package-lock.json has invalid or missing lockfileVersion");
}

const packageCount =
  parsed.packages && typeof parsed.packages === "object"
    ? Object.keys(parsed.packages).length
    : 0;

if (packageCount < MIN_PACKAGE_KEYS) {
  fail(
    `package-lock.json has only ${packageCount} package entries (need >= ${MIN_PACKAGE_KEYS}). Stub lockfiles are rejected.`,
  );
}

console.log(
  `validate-package-lock: OK (${content.length} bytes, ${packageCount} package entries)`,
);
