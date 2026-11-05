/**
 * Layout clearance check (AGENTS.md §19 made machine-readable).
 *
 *   node scripts/check-header-clearance.mjs --base=http://127.0.0.1:43123 [--cookie-file=tmp/prod-admin-cookie.txt] [--path=/dashboard/admin]
 *
 * The sticky header must contain its own navigation at every width we support. When the row
 * height was asserted instead of derived, a wrapping nav spilled past the header's bottom
 * border and painted over the page content — 49px over the desk header at 820px.
 * Exits 1 with the measured numbers if anything sticks out.
 */
import { spawn } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const BASE = arg("base", process.env.SMOKE_BASE || "http://127.0.0.1:43123");
const PAGE_PATH = arg("path", "/");
const COOKIE_FILE = arg("cookie-file", "");
const WIDTHS = (arg("widths", "390,820,1440") || "").split(",").map(Number);
const PORT = Number(arg("cdp-port", "9291"));
const USER_BY_ROLE = { agent: "user-agent", owner: "user-owner", admin: "user-admin", buyer: "user-buyer" };
const AUTH = arg("auth", "");

function envValue(key) {
  for (const file of [".env.local", ".env", ".env.test"]) {
    try {
      const line = readFileSync(path.join(ROOT, file), "utf8")
        .split(/\r?\n/)
        .find((l) => l.startsWith(`${key}=`));
      if (line) return line.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  return process.env[key];
}
const b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
function mintSession(userId) {
  const secret = envValue("AUTH_SECRET");
  if (!secret) throw new Error("AUTH_SECRET missing — cannot mint a session");
  const iat = Math.floor(Date.now() / 1000);
  const payload = b64u(JSON.stringify({ userId, iat, exp: iat + 3600 }));
  const signature = b64u(createHmac("sha256", secret).update(payload).digest());
  return `${payload}.${signature}`;
}

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync);
if (!CHROME) {
  console.error("header clearance: no chromium browser found — refusing to claim the layout is fine");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function measure(width) {
  const chrome = spawn(
    CHROME,
    [
      "--headless=new",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${path.join(ROOT, `tmp/clearance-profile-${PORT}`)}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      `--window-size=${width},900`,
      "--lang=en-US",
    ],
    { stdio: "ignore" },
  );
  try {
    let wsUrl;
    const t0 = Date.now();
    while (!wsUrl && Date.now() - t0 < 30000) {
      try {
        const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
        if (r.ok) wsUrl = (await r.json()).webSocketDebuggerUrl;
      } catch {}
      if (!wsUrl) await sleep(400);
    }
    if (!wsUrl) throw new Error(`chromium did not come up on port ${PORT}`);

    const ws = new WebSocket(wsUrl);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = () => rej(new Error("ws open failed"));
    });
    let msgId = 0;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        const settle = pending.get(msg.id);
        pending.delete(msg.id);
        settle(msg.error ? { err: new Error(msg.error.message) } : { val: msg.result });
      }
    };
    const call = (method, params = {}, sessionId) =>
      new Promise((resolve, reject) => {
        const id = ++msgId;
        pending.set(id, (r) => (r.err ? reject(r.err) : resolve(r.val)));
        ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
        setTimeout(() => pending.has(id) && (pending.delete(id), reject(new Error(`timeout on ${method}`))), 40000);
      });
    const { sessionId } = await call("Target.attachToTarget", {
      targetId: (await call("Target.createTarget", { url: "about:blank" })).targetId,
      flatten: true,
    });
    const S = (m, p) => call(m, p, sessionId);
    await S("Page.enable");
    await S("Runtime.enable");
    await S("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 500,
    });

    const pairs = [];
    if (COOKIE_FILE) {
      pairs.push(...readFileSync(path.resolve(ROOT, COOKIE_FILE), "utf8").trim().split("; ").filter(Boolean));
    }
    if (AUTH && USER_BY_ROLE[AUTH]) pairs.push(`en_session=${mintSession(USER_BY_ROLE[AUTH])}`);
    for (const pair of pairs) {
      const i = pair.indexOf("=");
      if (i < 0) continue;
      await S("Network.setCookie", {
        name: pair.slice(0, i),
        value: pair.slice(i + 1),
        domain: new URL(BASE).hostname,
        path: "/",
        httpOnly: true,
        secure: BASE.startsWith("https:"),
        sameSite: "Lax",
      });
    }

    const nav = await S("Page.navigate", { url: `${BASE}${PAGE_PATH}` });
    if (nav.errorText) throw new Error(`navigation failed: ${nav.errorText}`);
    await sleep(3000);

    const expression = `(() => {
      const box = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), height: Math.round(b.height) }; };
      const header = document.querySelector('header');
      const nav = header && header.querySelector('nav');
      const rows = (navLinks) => {
        const tops = navLinks.map(a => Math.round(a.getBoundingClientRect().top)).filter(t => t > 0);
        return new Set(tops).size;
      };
      const links = [...(nav?.querySelectorAll('a,button') ?? [])]
        .filter(a => a.offsetWidth > 0 && a.offsetHeight > 0);
      return { header: box(header), nav: box(nav), navRows: rows(links), linkCount: links.length };
    })()`;
    const measured = await S("Runtime.evaluate", { expression, returnByValue: true });
    ws.close();
    const value = measured.result?.value;
    if (!value?.header) throw new Error(`no header found at ${width}px on ${BASE}${PAGE_PATH}`);
    return value;
  } finally {
    try {
      chrome.kill("SIGKILL");
    } catch {}
  }
}

const failures = [];
console.log(`header clearance against ${BASE}${PAGE_PATH}`);
for (const width of WIDTHS) {
  const m = await measure(width);
  const spill = m.nav && m.nav.height > 0 ? m.nav.bottom - m.header.bottom : 0;
  const line = `  ${String(width).padStart(4)}px — header ${m.header.height}px, nav ${m.nav?.height ?? 0}px in ${m.navRows} row(s), ${m.linkCount} items, sticks out ${spill}px`;
  console.log(line);
  if (spill > 1) failures.push({ width, spill, ...m });
}

if (failures.length) {
  console.error(
    `HEADER CLEARANCE FAIL — the navigation leaves its own header box at ${failures.map((f) => `${f.width}px (+${f.spill}px)`).join(", ")}`,
  );
  process.exit(1);
}
console.log("header clearance ok — the navigation stays inside the header at every width");
