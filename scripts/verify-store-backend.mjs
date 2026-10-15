/**
 * Smoke test store backend resolution (no network).
 * Usage:
 *   node scripts/verify-store-backend.mjs
 *   BLOB_STORE_ID=store_abc VERCEL=1 node scripts/verify-store-backend.mjs
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(root, "..");

const snippet = `
import {
  resolveStorePersistenceBackend,
  getStorePersistenceEnvFlags,
} from "./src/lib/store-persistence.ts";

console.log(
  JSON.stringify({
    backend: resolveStorePersistenceBackend(),
    env: getStorePersistenceEnvFlags(),
  }),
);
`;

const run = (extraEnv = {}) => {
  const res = spawnSync(
    "npx",
    ["--yes", "tsx", "-e", snippet],
    {
      cwd: projectRoot,
      env: { ...process.env, ...extraEnv },
      encoding: "utf8",
    },
  );
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout);
    process.exit(res.status ?? 1);
  }
  return JSON.parse(res.stdout.trim());
};

const cases = [
  [{}, "filesystem"],
  [{ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_test_store123" }, "blob"],
  [{ BLOB_STORE_ID: "store_abc", VERCEL: "1" }, "blob"],
  [{ BLOB_STORE_ID: "store_abc", VERCEL_OIDC_TOKEN: "oidc-test" }, "blob"],
  [
    {
      KV_REST_API_URL: "https://example.upstash.io",
      KV_REST_API_TOKEN: "token",
    },
    "kv",
  ],
];

let failed = 0;
for (const [env, expected] of cases) {
  const out = run(env);
  if (out.backend !== expected) {
    console.error("FAIL", env, "expected", expected, "got", out.backend);
    failed++;
  } else {
    console.log("OK", expected, out.env);
  }
}

process.exit(failed > 0 ? 1 : 0);
