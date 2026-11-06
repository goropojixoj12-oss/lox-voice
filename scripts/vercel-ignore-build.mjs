#!/usr/bin/env node
/**
 * Vercel "Ignored Build Step".
 *
 * Exit 0 = skip this deployment, exit 1 = build it.
 *
 * The admin command queue lives in content/requests.json and is read by the API
 * at runtime from git, so a commit that only touches the queue does not change
 * the built site. Without this guard every "queued -> in_progress -> done"
 * transition triggered a full rebuild.
 *
 * Anything unexpected (missing sha, shallow clone, git error) builds the site:
 * a wasted build is cheaper than a stale production.
 */
import { execFileSync } from "node:child_process";

const QUEUE_ONLY = /^content\/requests(\/|\.json$)/;

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function changedFiles() {
  const current = process.env.VERCEL_GIT_COMMIT_SHA || "HEAD";
  const previous = process.env.VERCEL_GIT_PREVIOUS_SHA;

  if (previous) {
    try {
      const out = git(["diff", "--name-only", `${previous}..${current}`]);
      return out ? out.split("\n") : [];
    } catch {
      // Shallow clone without the previous commit - fall through.
    }
  }

  try {
    const out = git(["show", "--name-only", "--format=", current]);
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return null;
  }
}

const files = changedFiles();
if (files === null || files.length === 0) {
  console.log("[ignore-build] cannot determine changes - building");
  process.exit(1);
}

const onlyQueue = files.every((file) => QUEUE_ONLY.test(file));
if (onlyQueue) {
  console.log(`[ignore-build] only the command queue changed (${files.length} file(s)) - skipping build`);
  process.exit(0);
}

console.log(`[ignore-build] ${files.length} changed file(s) outside the queue - building`);
process.exit(1);