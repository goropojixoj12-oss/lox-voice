#!/usr/bin/env node
// Локальный стенд для визуального контроля (правило 19) и смока по локальной
// прод-сборке: убивает висящий на порту прошлый next start, собирает, поднимает
// сервер с BLOB_DISABLED=1 и печатает URL. Без этого каждый раз приходилось
// руками искать PID по netstat, и сервер из прошлого чата отдавал старый билд.
//
//   npm run local                 # стоп старого → build → start → URL
//   npm run local -- --smoke      # то же + npm run smoke против этого порта
//   npm run local -- --no-build   # перезапустить текущий билд
//   npm run local -- --stop       # только убить сервер на порту
import { spawn, execFileSync } from "node:child_process";
import { openSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const PORT = value("port", "43131");
const BASE = `http://127.0.0.1:${PORT}`;
const LOG = new URL("../tmp/local-check.log", import.meta.url);

function listeners(port) {
  let out = "";
  try {
    out = execFileSync("netstat", ["-ano", "-p", "TCP"], { encoding: "utf8" });
  } catch (err) {
    console.log(`netstat failed: ${err.message}`);
    return [];
  }
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const cols = line.trim().split(/\s+/);
    if (cols.length < 5 || cols[0] !== "TCP") continue;
    if (!cols[1].endsWith(`:${port}`) || cols[3] !== "LISTENING") continue;
    pids.add(cols[4]);
  }
  return [...pids];
}

// убиваем только node-процессы: чужое приложение на этом порту — не наша цель
function killListeners(port) {
  const killed = [];
  for (const pid of listeners(port)) {
    let listing = "";
    try {
      listing = execFileSync("tasklist", ["/FI", `PID eq ${pid}`, "/NH"], { encoding: "utf8" });
    } catch {
      listing = "";
    }
    if (!/node\.exe/i.test(listing)) {
      console.log(`left pid ${pid} alone — it is not a node process (${listing.trim().split(/\r?\n/)[0] || "?"})`);
      continue;
    }
    try {
      execFileSync("taskkill", ["/PID", pid, "/F"], { encoding: "utf8" });
      killed.push(pid);
    } catch (err) {
      console.log(`could not kill pid ${pid}: ${err.message}`);
    }
  }
  if (killed.length) console.log(`stopped stale local server pid(s): ${killed.join(", ")}`);
  return killed;
}

if (flag("stop")) {
  const killed = killListeners(PORT);
  console.log(killed.length ? `done — ${BASE} is free` : `nothing was listening on ${PORT}`);
  process.exit(0);
}

function run(cmd, cmdArgs, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} ${cmdArgs.join(" ")} exited ${code}`)),
    );
    child.on("error", reject);
  });
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
if (!existsSync(nextBin)) {
  console.log("node_modules/next is missing — npm ci first");
  process.exit(1);
}
if (!existsSync(new URL("../tmp", import.meta.url))) mkdirSync(new URL("../tmp", import.meta.url));

killListeners(PORT);

const buildEnv = { BLOB_DISABLED: "1", NEXT_TELEMETRY_DISABLED: "1" };
if (!flag("no-build")) {
  console.log(`building (BLOB_DISABLED=1) — ${new Date().toISOString()}`);
  await run(process.execPath, [nextBin, "build"], buildEnv);
}

console.log(`starting ${BASE}, log → ${fileURLToPath(LOG)}`);
const server = spawn(process.execPath, [nextBin, "start", "--hostname", "127.0.0.1", "--port", PORT], {
  detached: true,
  stdio: ["ignore", openSync(LOG, "a"), openSync(LOG, "a")],
  env: { ...process.env, ...buildEnv },
});
server.unref();

let up = false;
for (let attempt = 0; attempt < 60 && !up; attempt += 1) {
  await sleep(1000);
  try {
    const res = await fetch(`${BASE}/`, { signal: AbortSignal.timeout(3000) });
    up = res.status === 200;
  } catch {
    up = false;
  }
}
if (!up) {
  console.log(`server did not answer 200 on ${BASE} within 60s — see the log above`);
  process.exit(1);
}
console.log(`ready: ${BASE} (pid ${server.pid})`);
console.log(`stop it later with: npm run local -- --stop`);

if (flag("smoke")) {
  const smoke = fileURLToPath(new URL("../scripts/smoke-site.mjs", import.meta.url));
  await run(process.execPath, [smoke, `--base=${BASE}`], {});
}
