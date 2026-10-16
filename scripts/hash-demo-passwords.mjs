/**
 * One-off: print bcrypt hashes for demo account passwords.
 * Pass plains via env (do not commit secrets):
 *
 *   DEMO_BUYER_PASS=... DEMO_OWNER_PASS=... DEMO_AGENT_PASS=... DEMO_ADMIN_PASS=... \
 *     npx tsx scripts/hash-demo-passwords.mjs
 */
import { hash } from "bcryptjs";

const rounds = 12;
const entries = [
  ["buyer", process.env.DEMO_BUYER_PASS],
  ["owner", process.env.DEMO_OWNER_PASS],
  ["agent", process.env.DEMO_AGENT_PASS],
  ["admin", process.env.DEMO_ADMIN_PASS],
];

const missing = entries.filter(([, p]) => !p);
if (missing.length) {
  console.error(
    "Set DEMO_BUYER_PASS, DEMO_OWNER_PASS, DEMO_AGENT_PASS, DEMO_ADMIN_PASS",
  );
  process.exit(1);
}

for (const [name, plain] of entries) {
  const h = await hash(plain, rounds);
  console.log(`${name}=${h}`);
}
