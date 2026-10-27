/**
 * Smoke: HMAC session cookies reject forgery and bare JSON.
 * Usage: AUTH_SECRET=test-secret-at-least-32-chars-long npx tsx scripts/smoke-session-auth.mjs
 */
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(__dirname, ".."));

if (!process.env.AUTH_SECRET) {
  process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long!!";
}

const { signSession, verifySession } = await import(
  pathToFileURL(path.join(__dirname, "../src/lib/auth.ts")).href
);

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  }
}

const token = signSession("user-admin");
assert(token.includes("."), "signed token has payload.sig");
assert(!token.startsWith("{"), "signed token is not raw JSON");

const ok = verifySession(token);
assert(ok?.userId === "user-admin", "verify returns user-admin");

assert(verifySession('{"userId":"user-admin"}') === null, "bare JSON rejected");
assert(verifySession('{"userId":"user-buyer"}') === null, "forged JSON rejected");

const [payload, sig] = token.split(".");
const tampered = `${payload}.${sig.slice(0, -1)}${sig.endsWith("a") ? "b" : "a"}`;
assert(verifySession(tampered) === null, "tampered signature rejected");

const expired = signSession("user-admin", Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 20);
assert(verifySession(expired) === null, "expired session rejected");

if (failed > 0) {
  console.error(`${failed} assertion(s) failed`);
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checks: 6 }, null, 2));
