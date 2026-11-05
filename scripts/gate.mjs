/**
 * Gate: the one command an agent runs before pushing anything (AGENTS.md §9 steps 3–4).
 *
 *   npm run gate                 # build → prod-server smoke → header clearance → tmp/gate-pass.json
 *   npm run gate -- --fast       # skip build, smoke against the already running dev server
 *   npm run gate -- --lint       # also run eslint
 *   npm run gate -- --json       # machine-readable summary on the last line
 *
 * Read-only by design: it never tags, commits or pushes. It only proves the tree is
 * green and leaves a marker that `npm run ship -- <name>` refuses to act without, so a
 * push cannot be built on an unverified HEAD.
 *
 * The prod-server smoke runs on its own port with BLOB_DISABLED=1 (file store) unless
 * the environment already says otherwise, so a local gate never writes to Vercel Blob.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const has = (name) => args.includes(`--${name}`);
const argValue = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  const at = args.indexOf(`--${name}`);
  const next = at >= 0 ? args[at + 1] : undefined;
  return next && !next.startsWith("--") ? next : fallback;
};

const FAST = has("fast");
const LINT = has("lint");
const AS_JSON = has("json");
const DEV_PORT = Number(argValue("dev-port", "43123"));
const GATE_PORT = Number(argValue("port", "43198"));
const MARKER = path.join(ROOT, "tmp", "gate-pass.json");
const started = Date.now();

function say(line) {
  // in --json mode stdout stays one clean object; progress goes to stderr
  if (AS_JSON) console.error(line);
  else console.log(line);
}

// bins run through node directly: spawning npm.cmd/eslint.cmd without a shell fails on
// Windows (EINVAL), and skipping the npm layer is faster
const NEXT_BIN = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const ESLINT_BIN = path.join(ROOT, "node_modules", "eslint", "bin", "eslint.js");

function run(command, argv, { env = {}, echo = false } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, argv, {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: echo ? "inherit" : ["ignore", "pipe", "pipe"],
    });
    let tail = "";
    if (!echo) {
      child.stdout.on("data", (b) => (tail += b));
      child.stderr.on("data", (b) => (tail += b));
    }
    child.on("error", (err) => resolve({ code: 127, tail: `spawn ${command} failed: ${err.message}` }));
    child.on("close", (code) =>
      resolve({
        code: code ?? 1,
        tail: tail
          .split("\n")
          .map((l) => l.trimEnd())
          .filter(Boolean)
          .slice(-14)
          .join("\n"),
      }),
    );
  });
}

function git(...argv) {
  const r = spawnSync("git", argv, { cwd: ROOT, encoding: "utf8" });
  return (r.stdout || "").trim();
}

async function answers(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(4000), redirect: "manual" });
    return res.status < 500;
  } catch {
    return false;
  }
}

const stageFailures = [];
async function stage(name, fn) {
  const t0 = Date.now();
  say(`▸ ${name}`);
  const result = await fn();
  const ms = Date.now() - t0;
  if (result.code !== 0) {
    say(`✗ ${name} failed (exit ${result.code}) after ${ms}ms`);
    if (result.tail) say(result.tail);
    stageFailures.push({ stage: name, code: result.code, tail: result.tail });
    return false;
  }
  say(`✓ ${name} — ${ms}ms`);
  return true;
}

const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const head = git("rev-parse", "--short", "HEAD");
const dirty = git("status", "--porcelain", "--untracked-files=no");
say(`gate on ${branch}@${head}${dirty ? ` — working tree has ${dirty.split("\n").length} uncommitted file(s)` : " — tree clean"}`);

if (!FAST && LINT) {
  if (!(await stage("eslint", () => run(process.execPath, [ESLINT_BIN], { echo: true })))) process.exit(1);
}

if (!FAST) {
  if (
    !(await stage("analytics filters", () =>
      run(
        process.execPath,
        ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON", "--test", path.join(ROOT, "tests", "analytics-filters.test.mjs")],
        { echo: true },
      ),
    ))
  )
    process.exit(1);
  if (!(await stage("next build", () => run(process.execPath, [NEXT_BIN, "build"], { echo: true })))) process.exit(1);
}

// smoke base: explicit → already-running dev server → our own throwaway prod server
let base = argValue("base", process.env.SMOKE_BASE || "");
let server = null;
if (!base) {
  if (await answers(DEV_PORT)) {
    base = `http://127.0.0.1:${DEV_PORT}`;
    say(`smoke against the dev server already listening on ${base}`);
  } else {
    say(`no server on ${DEV_PORT}, booting the built app on ${GATE_PORT} (BLOB_DISABLED=1 unless set)`);
    server = spawn(
      process.execPath,
      [NEXT_BIN, "start", "--hostname", "127.0.0.1", "--port", String(GATE_PORT)],
      {
        cwd: ROOT,
        env: { ...process.env, BLOB_DISABLED: process.env.BLOB_DISABLED ?? "1" },
        stdio: "ignore",
      },
    );
    process.on("exit", () => {
      try {
        server?.kill();
      } catch {
        // already gone
      }
    });
    const deadline = Date.now() + 90_000;
    for (;;) {
      if (await answers(GATE_PORT)) break;
      if (Date.now() > deadline) {
        say("✗ the built app did not answer within 90s");
        server.kill("SIGTERM");
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    base = `http://127.0.0.1:${GATE_PORT}`;
  }
}

const smokeOk = await stage("smoke", () =>
  run(process.execPath, [path.join(ROOT, "scripts", "smoke-site.mjs"), `--base=${base}`], { echo: true }),
);

// §19 as a machine check: the sticky header must contain its own navigation at 390/820/1440.
const clearanceOk = await stage("header clearance", () =>
  run(process.execPath, [path.join(ROOT, "scripts", "check-header-clearance.mjs"), `--base=${base}`], {
    echo: true,
  }),
);

if (server) server.kill("SIGTERM");

const marker = {
  head: git("rev-parse", "HEAD"),
  tree: git("rev-parse", "HEAD^{tree}"),
  branch,
  at: new Date().toISOString(),
  base,
  build: FAST ? "skipped (flag)" : "ok",
  smoke: smokeOk ? "ok" : "failed",
  clearance: clearanceOk ? "ok" : "failed",
  ms: Date.now() - started,
};

if (smokeOk && clearanceOk) {
  mkdirSync(path.dirname(MARKER), { recursive: true });
  writeFileSync(MARKER, JSON.stringify(marker, null, 2));
  say(`GATE PASS in ${((Date.now() - started) / 1000).toFixed(1)}s — marker written for ${marker.head.slice(0, 7)}`);
  say("order that ship accepts: visual check of the changed route (§19) → commit → npm run gate → npm run ship -- <short-name>");
  if (dirty) say("note: the tree still has uncommitted files; once you commit, rerun gate so the marker covers the new HEAD");
  if (AS_JSON) console.log(JSON.stringify({ ...marker, ok: true }));
  process.exit(0);
}

say("GATE FAIL — fix before pushing, nothing was tagged or pushed");
if (AS_JSON) console.log(JSON.stringify({ ...marker, ok: false, failures: stageFailures }));
process.exit(1);
