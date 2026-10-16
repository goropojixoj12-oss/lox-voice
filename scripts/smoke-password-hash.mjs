/**
 * Smoke: bcrypt verify against demo user hashes; no plaintext in users.ts.
 * Usage: npx tsx scripts/smoke-password-hash.mjs
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(__dirname, ".."));

const { verifyPassword } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/password.ts")).href
);
const { demoUsers } = await import(
  pathToFileURL(path.join(__dirname, "../src/data/users.ts")).href
);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  }
}

const usersSrc = readFileSync(
  path.join(__dirname, "../src/data/users.ts"),
  "utf8",
);
assert(!/seaps-(buyer|owner|agent|admin)-123/.test(usersSrc), "no plaintext demo passwords in users.ts");
assert(!/\bpassword:\s*"/.test(usersSrc), "users.ts uses passwordHash, not password:");

const expected = [
  ["buyer@seaps.com.kh", "seaps-buyer-123"],
  ["owner@seaps.com.kh", "seaps-owner-123"],
  ["agent@seaps.com.kh", "seaps-agent-123"],
  ["admin@seaps.com.kh", "seaps-admin-123"],
];

for (const [email, plain] of expected) {
  const user = demoUsers.find((u) => u.email === email);
  assert(Boolean(user), `user exists: ${email}`);
  assert(user.passwordHash.startsWith("$2"), `hash looks like bcrypt: ${email}`);
  const ok = await verifyPassword(plain, user.passwordHash);
  assert(ok, `verify ok: ${email}`);
  const bad = await verifyPassword("wrong-password-!!!!", user.passwordHash);
  assert(!bad, `reject wrong password: ${email}`);
}

if (failed > 0) {
  console.error(`${failed} assertion(s) failed`);
  process.exit(1);
}

console.log(
  JSON.stringify({ ok: true, users: demoUsers.length, checks: "hash+verify" }, null, 2),
);
