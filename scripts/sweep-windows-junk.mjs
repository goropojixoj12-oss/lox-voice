// Google Drive stamps a desktop.ini into every folder it syncs, and this repo lives inside a
// synced folder. Two of those stamps are fatal: .git/refs/** makes git read them as broken
// refs (fetch dies), .next/cache/turbopack/** makes the persistence dir unparseable (build
// dies). They regenerate within minutes, so the pipeline sweeps them before it needs them.
// Nothing is deleted — every file is moved to tmp/windows-junk/sweep-<stamp>/ for a look-back.
import { mkdirSync, readdirSync, renameSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const JUNK = /^(desktop\.ini|thumbs\.db)$/i;
const TREES = [".git", ".next"];

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(ROOT, "tmp", "windows-junk", `sweep-${stamp}`);
let moved = 0;

function sweep(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of names) {
    const full = path.join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) sweep(full);
    else if (JUNK.test(name)) {
      mkdirSync(dest, { recursive: true });
      const flat = path.relative(ROOT, full).replace(/[\\/]/g, "_");
      renameSync(full, path.join(dest, flat));
      moved += 1;
    }
  }
}

for (const tree of TREES) {
  const top = path.join(ROOT, tree);
  try {
    if (statSync(top).isDirectory()) sweep(top);
  } catch {}
}

console.log(moved ? `swept ${moved} Windows junk file(s) into tmp/windows-junk/sweep-${stamp}` : "no Windows junk in .git/.next");
