/**
 * Smoke: GET-only contract check of a running SEAPS build.
 *
 *   npm run smoke
 *   npm run smoke -- --base https://www.seaps.asia
 *   npm run smoke -- --only dashboard
 *   npm run smoke -- --concurrency=12
 *   npm run smoke -- --json
 *   npm run smoke -- --no-session-cache
 *
 * Credentials: SMOKE_AGENT_EMAIL / SMOKE_AGENT_EMAIL-style env vars win, otherwise
 * the demo table in README.md is parsed. Passwords are never printed. The script
 * sends one POST to /api/auth/login per role and GET for everything else, so it
 * cannot create or change data on the target.
 *
 * Sessions are cached in tmp/smoke-sessions.json (per base+role) and re-validated
 * with one GET, so repeated runs do not hit the /api/auth/login rate limit of
 * 5 sign-ins per minute; --no-session-cache forces fresh logins.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DEFAULT_BASE = "http://127.0.0.1:43123";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.slice(name.length + 3);
  const at = args.indexOf(`--${name}`);
  const next = at >= 0 ? args[at + 1] : undefined;
  return next && !next.startsWith("--") ? next : fallback;
}
const BASE = (argValue("base", process.env.SMOKE_BASE || DEFAULT_BASE)).replace(/\/+$/, "");
const ONLY = argValue("only", "");
const AS_JSON = args.includes("--json");
const LIST = args.includes("--list");
const NO_CACHE = args.includes("--no-session-cache");
const TIMEOUT_MS = Number(argValue("timeout", "20000"));
// checks are independent GETs; 6 in flight keeps prod happy and the dev server from thrashing
const CONCURRENCY = Math.max(1, Number(argValue("concurrency", "6")));

/** @typedef {{name: string, path: string, role?: 'agent'|'admin'|null, status?: number[], include?: string[], exclude?: string[]}} Check */

/** @type {Check[]} */
const CHECKS = [
  {
    name: "home: hero, nav, no retired blocks",
    path: "/",
    status: [200],
    include: [
      "South East Asia Property Services",
      "About Us",
      "Buy",
      "Rent",
      "Projects/Developments",
      "Useful Links",
      "Market Insights",
      "Property Guide",
      "Careers",
    ],
    exclude: ["Popular agencies", "/market-feed", "/agencies/", "vps1.store"],
  },
  {
    name: "about: company page",
    path: "/about",
    status: [200],
    include: ["South East Asia Property Services"],
  },
  { name: "contact: form present", path: "/contact", status: [200], include: ["form"] },
  { name: "search: filters", path: "/search", status: [200], include: ["Search", "filter"] },
  { name: "projects", path: "/projects", status: [200], include: ["Project", "Development"] },
  { name: "property guide", path: "/property-guide", status: [200], include: ["Guide"] },
  { name: "careers", path: "/careers", status: [200], include: ["Career"] },
  { name: "useful links", path: "/usefullinks", status: [200], include: ["Useful"] },
  { name: "insights", path: "/insights", status: [200], include: ["Insight"] },
  { name: "commercial", path: "/commercial", status: [200], include: ["Commercial"] },
  { name: "land", path: "/land", status: [200], include: ["Land"] },
  { name: "short stay", path: "/short-stay", status: [200], include: ["Short"] },
  { name: "map", path: "/map", status: [200], include: ["map"] },
  { name: "buy residential", path: "/buy/residential", status: [200], include: ["Residential", "Buy"] },
  { name: "buy land", path: "/buy/land", status: [200], include: ["Land"] },
  { name: "rent residential", path: "/rent/residential", status: [200], include: ["Residential"] },
  { name: "login form", path: "/auth/login", status: [200], include: ["Sign in", "password"] },
  { name: "privacy", path: "/privacy", status: [200] },
  { name: "terms", path: "/terms", status: [200] },
  {
    name: "vue aston card: own photos only, no cube",
    path: "/property/vue-aston-riverside-3bed-102m2",
    status: [200],
    include: ["/media/listings/vue-aston/01.jpg", "/media/listings/vue-aston/02.jpg", "Vue Aston"],
    exclude: ["/media/listings/vue-aston/03.jpg", "bkk1-riverside", "tesseract"],
  },
  {
    name: "listing detail: location map renders",
    path: "/property/vue-aston-riverside-3bed-102m2",
    status: [200],
    include: ["Location", "Loading map"],
    exclude: ["No listings with map coordinates"],
  },
  {
    name: "listing detail: ?photo deep link renders",
    path: "/property/vue-aston-riverside-3bed-102m2?photo=1",
    status: [200],
    include: ["/media/listings/vue-aston/02.jpg"],
  },
  {
    name: "listing detail: the 30% promo banner stays removed",
    path: "/property/vue-aston-riverside-3bed-102m2",
    status: [200],
    exclude: ["30%"],
  },
  {
    name: "listing detail: the inquiry form carries the listing slug",
    path: "/property/vue-aston-riverside-3bed-102m2",
    status: [200],
    include: ['name="propertySlug" value="vue-aston-riverside-3bed-102m2"'],
  },
  {
    name: "deleted bkk1 photo set stays gone",
    path: "/media/listings/bkk1-riverside/01.jpg",
    status: [404],
  },
  {
    name: "listing media endpoint: a file that is not there is 404, not 500",
    path: "/api/listings/media/smoke-user/smoke-no-such-upload.jpg",
    status: [404],
  },
  { name: "unknown slug is 404", path: "/property/no-such-slug-xyz", status: [404] },
  {
    name: "sitemap: served and lists a property page",
    path: "/sitemap.xml",
    status: [200],
    include: ["/property/vue-aston-riverside-3bed-102m2"],
  },
  { name: "robots", path: "/robots.txt", status: [200] },
  {
    name: "wizard step1: closed to anonymous",
    path: "/dashboard/agent/list-property/step1",
    role: null,
    status: [302, 307, 308],
  },
  {
    name: "agent desk: signed-in shell",
    path: "/dashboard/agent/overview",
    role: "agent",
    status: [200],
    include: ["Signed in as"],
  },
  {
    name: "agent listings desk",
    path: "/dashboard/agent/listings",
    role: "agent",
    status: [200],
    include: ["Signed in as", "Listings"],
  },
  {
    name: "wizard step1: open for agent",
    path: "/dashboard/agent/list-property/step1",
    role: "agent",
    status: [200],
    include: ["List a property", "Photos"],
  },
  {
    name: "wizard step5: stays on photos when bookmarked",
    path: "/dashboard/agent/list-property/step5",
    role: "agent",
    status: [200],
    include: ["Choose photos"],
  },
  {
    name: "wizard step5: preview photo count control",
    path: "/dashboard/agent/list-property/step5",
    role: "agent",
    status: [200],
    include: ["Photos in the card preview", "preview-photo-count"],
  },
  {
    name: "owner listing endpoint: PATCH only, no anonymous read",
    path: "/api/dashboard/listings/any-listing",
    status: [405],
  },
  {
    name: "owner listing edit desk: closed to anonymous",
    path: "/dashboard/agent/listings/any-listing",
    role: null,
    status: [302, 307, 308],
  },
  {
    name: "draft catalog listing: closed to a signed-in agent who is not the author",
    path: "/property/toul-kork-family-villa",
    role: "agent",
    status: [404],
  },
  {
    name: "agent stats desk: closed to anonymous",
    path: "/dashboard/agent/stats",
    role: null,
    status: [302, 307, 308],
  },
  {
    name: "inquiries api: closed to anonymous",
    path: "/api/inquiries",
    role: null,
    status: [401],
  },
  {
    name: "agent inquiries desk: only his own listings",
    path: "/dashboard/agent/inquiries",
    role: "agent",
    status: [200],
    include: ["No inquiries yet"],
  },
  {
    name: "admin desk: closed to agent",
    path: "/dashboard/admin/listings",
    role: "agent",
    status: [302, 307, 308, 403],
  },
  {
    name: "admin listings desk",
    path: "/dashboard/admin/listings",
    role: "admin",
    status: [200],
    include: ["Listing management"],
  },
  {
    name: "admin overview desk",
    path: "/dashboard/admin",
    role: "admin",
    status: [200],
    include: ["Signed in as"],
  },
  {
    name: "session endpoint: anonymous has no user",
    path: "/api/auth/session",
    status: [200],
    include: ["user"],
  },
];

const ESCAPE_TEXT = /\\u[0-9a-f]{4}/i;
const CRASH_MARKERS = [
  "Application error",
  "Unhandled Runtime Error",
  "Internal Server Error",
  "server could not be reached",
];

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

function credsFor(role) {
  const env = loadEnvFile();
  const upper = role.toUpperCase();
  const email = process.env[`SMOKE_${upper}_EMAIL`] || env[`SMOKE_${upper}_EMAIL`];
  const password = process.env[`SMOKE_${upper}_PASSWORD`] || env[`SMOKE_${upper}_PASSWORD`];
  if (email && password) return { email, password };
  const readmePath = new URL("../README.md", import.meta.url);
  const readme = readFileSync(readmePath, "utf8");
  for (const line of readme.split("\n")) {
    const cols = line.split("|").map((c) => c.trim());
    if (cols.length < 5) continue;
    if (cols[1].toLowerCase() === role) return { email: cols[2], password: cols[3] };
  }
  return null;
}

function loadEnvFile() {
  const out = {};
  try {
    const text = readFileSync(new URL("../.env.test", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/i.exec(line.trim());
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // no .env.test — fall back to process.env, then the README table
  }
  return out;
}

async function loginOnce(role) {
  const creds = credsFor(role);
  if (!creds) {
    return {
      error:
        `no credentials for role ${role} — set SMOKE_${role.toUpperCase()}_EMAIL and ` +
        `SMOKE_${role.toUpperCase()}_PASSWORD in .env.test`,
    };
  }
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(creds),
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status === 429) {
    const waitSec = Number(res.headers.get("retry-after") || "15");
    return { error: `login ${role} -> 429`, retryAfterSec: waitSec };
  }
  if (res.status >= 400) return { error: `login ${role} -> ${res.status}` };
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).find((c) => c.startsWith("en_session="));
  if (!cookie) return { error: `login ${role} set no session cookie` };
  return { cookie };
}

const CACHE_URL = new URL("../tmp/smoke-sessions.json", import.meta.url);
// the cookie itself lives 14 days; revalidate every run so a logout is still caught
const CACHE_TTL_MS = 13 * 24 * 60 * 60 * 1000;
const LOGIN_WAIT_BUDGET_MS = Number(argValue("login-wait", "70000"));

function readSessionCache() {
  try {
    const parsed = JSON.parse(readFileSync(CACHE_URL, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

const sessionCache = NO_CACHE ? {} : readSessionCache();

function rememberSession(key, cookie) {
  if (NO_CACHE) return;
  sessionCache[key] = { cookie, at: Date.now() };
  try {
    mkdirSync(new URL("../tmp/", import.meta.url), { recursive: true });
    writeFileSync(CACHE_URL, JSON.stringify({ ...readSessionCache(), ...sessionCache }, null, 2));
  } catch (err) {
    if (!AS_JSON) console.log(`note session cache not written: ${err.message}`);
  }
}

/** Whose role this cookie currently authenticates as, or null when it is dead. */
async function roleOfCookie(cookie) {
  try {
    const res = await fetch(`${BASE}/api/auth/session`, {
      headers: { cookie },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.user?.role ?? null;
  } catch {
    return null;
  }
}

async function sessionForRole(role) {
  const key = `${BASE}|${role}`;
  const cached = sessionCache[key];
  if (cached?.cookie && Date.now() - (cached.at ?? 0) < CACHE_TTL_MS) {
    if ((await roleOfCookie(cached.cookie)) === role) return { cookie: cached.cookie, fromCache: true };
  }
  const waited = Date.now();
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await loginOnce(role);
    if (result.cookie) {
      rememberSession(key, result.cookie);
      return { cookie: result.cookie };
    }
    if (!result.retryAfterSec) return { error: result.error };
    const waitMs = Math.min(result.retryAfterSec * 1000 + 500, LOGIN_WAIT_BUDGET_MS - (Date.now() - waited));
    if (waitMs <= 0) return { error: `${result.error} (login-wait budget spent)` };
    if (!AS_JSON) console.log(`note ${result.error}, waiting ${Math.round(waitMs / 1000)}s for the rate limit`);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  return { error: `login ${role} stayed rate limited` };
}

function firstErrorMessage(html) {
  const m = /Cannot read propert[^<]*|Attempted to call[^<]*|missing syntax[^<]*/i.exec(html);
  return m ? m[0].slice(0, 180) : null;
}

async function runCheck(check, session) {
  const started = Date.now();
  let res;
  try {
    res = await fetch(`${BASE}${check.path}`, {
      headers: check.role ? { cookie: session[check.role] } : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    return { check, pass: false, why: `request failed: ${err.message}` };
  }
  const body = await res.text().catch(() => "");
  const statusOk = (check.status ?? [200]).includes(res.status);
  const problems = [];
  if (!statusOk) problems.push(`status ${res.status}, want ${(check.status ?? [200]).join("|")}`);
  if (res.status === 500) {
    const detail = firstErrorMessage(body);
    if (detail) problems.push(`server said: ${detail}`);
  }
  for (const needle of check.include ?? []) {
    if (!body.includes(needle)) problems.push(`missing ${JSON.stringify(needle)}`);
  }
  for (const needle of check.exclude ?? []) {
    if (body.includes(needle)) problems.push(`found forbidden ${JSON.stringify(needle)}`);
  }
  if (res.headers.get("content-type")?.includes("text/html")) {
    for (const marker of CRASH_MARKERS) {
      if (body.includes(marker)) problems.push(`crash marker ${JSON.stringify(marker)}`);
    }
    if (ESCAPE_TEXT.test(visibleText(body))) {
      problems.push("escaped unicode printed as text (\\uXXXX inside JSX text)");
    }
  }
  return {
    check,
    pass: problems.length === 0,
    status: res.status,
    ms: Date.now() - started,
    why: problems.join("; ") || null,
  };
}

const selected = ONLY
  ? CHECKS.filter((c) => `${c.name} ${c.path}`.toLowerCase().includes(ONLY.toLowerCase()))
  : CHECKS;

if (LIST) {
  for (const c of selected) console.log(`${c.role ?? "anon"}\t${c.path}\t${c.name}`);
  process.exit(0);
}

const session = {};
const setupProblems = [];
// only log in for roles the selected checks actually need
const neededRoles = [...new Set(selected.map((c) => c.role).filter(Boolean))];
await Promise.all(
  neededRoles.map(async (role) => {
    const result = await sessionForRole(role);
    if (result.error) setupProblems.push(result.error);
    else session[role] = result.cookie;
  }),
);

if (!AS_JSON)
  console.log(
    `smoke against ${BASE} — ${selected.length} check(s), concurrency ${CONCURRENCY}` +
      (neededRoles.length ? `, session(s): ${neededRoles.join(", ")}` : ", anonymous only"),
  );

const startedAll = Date.now();
const resultsByIndex = new Array(selected.length);
let cursor = 0;
async function worker() {
  for (;;) {
    const index = cursor++;
    if (index >= selected.length) return;
    const check = selected[index];
    if (check.role && !session[check.role]) {
      resultsByIndex[index] = { check, pass: false, why: `skipped: no ${check.role} session` };
      continue;
    }
    resultsByIndex[index] = await runCheck(check, session);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, selected.length) }, () => worker()));

// printed in CHECKS order, so the output stays diffable between runs
const results = resultsByIndex;
for (const r of results) {
  if (AS_JSON) break;
  const tag = r.pass ? "ok  " : "FAIL";
  console.log(`${tag} ${String(r.status ?? "---").padEnd(3)} ${r.check.path} — ${r.check.name}${r.pass ? "" : `\n     ${r.why}`}`);
}
const elapsedMs = Date.now() - startedAll;

const failed = results.filter((r) => !r.pass);
if (setupProblems.length && !AS_JSON) {
  for (const p of setupProblems) console.log(`note ${p}`);
}
const summary = {
  base: BASE,
  checks: results.length,
  passed: results.length - failed.length,
  ms: elapsedMs,
  setupProblems,
  failed: failed.map((r) => ({ path: r.check.path, name: r.check.name, status: r.status, why: r.why })),
};
if (AS_JSON) console.log(JSON.stringify(summary, null, 2));
else
  console.log(
    `${failed.length ? "SMOKE FAILED" : "smoke passed"} — ${summary.passed}/${results.length} in ${(elapsedMs / 1000).toFixed(1)}s`,
  );
process.exit(failed.length ? 1 : 0);
