/**
 * Wait until the Vercel production deployment for a given commit is READY.
 *
 *   node scripts/wait-vercel.mjs <sha> [--timeout=600] [--interval=10]
 *
 * Read-only: `vercel ls` only. Exit 0 = Ready, 1 = failed state or timeout, so a
 * calling script can branch on it instead of eyeballing the dashboard.
 */
import { spawn } from "node:child_process";

const sha = process.argv[2];
if (!sha || !/^[0-9a-f]{7,40}$/i.test(sha)) {
  console.error("usage: node scripts/wait-vercel.mjs <commit-sha>");
  process.exit(2);
}
const value = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const TIMEOUT_S = value("timeout", 600);
const INTERVAL_S = value("interval", 10);

function vercelLs() {
  return new Promise((resolve, reject) => {
    const child = spawn("vercel ls --json", { shell: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (b) => (stdout += b));
    child.stderr.on("data", (b) => (stderr += b));
    child.on("close", (code) =>
      code === 0 ? resolve(stdout) : reject(new Error(`vercel ls exit ${code}: ${stderr.slice(0, 200)}`)),
    );
  });
}

async function findDeployment() {
  const raw = await vercelLs();
  const parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
  const deployments = Array.isArray(parsed) ? parsed : (parsed.deployments ?? []);
  return deployments
    .filter((d) => d.target === "production" || d.production)
    .find((d) => (d.meta?.githubCommitSha ?? "").startsWith(sha.slice(0, 7))) ?? null;
}

const deadline = Date.now() + TIMEOUT_S * 1000;
let last = "none";
for (;;) {
  let found = null;
  try {
    found = await findDeployment();
  } catch (err) {
    console.log(`wait-vercel: ${err.message}`);
  }
  const state = found?.state ?? "QUEUED";
  if (state !== last) {
    console.log(`wait-vercel: ${sha.slice(0, 7)} → ${state}`);
    last = state;
  }
  if (found?.state === "READY") {
    console.log(`READY https://${found.url}`);
    process.exit(0);
  }
  if (found && ["ERROR", "FAILED", "CANCELED"].includes(found.state)) {
    console.log(`deployment ${found.state}: https://${found.url}`);
    process.exit(1);
  }
  if (Date.now() > deadline) {
    console.log(`timeout after ${TIMEOUT_S}s, last state ${last}`);
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, INTERVAL_S * 1000));
}
