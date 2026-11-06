/**
 * Writes files straight into the production repository (GitHub Contents/Git API).
 *
 * This is the only persistence path for admin commands and listing exports:
 * no Blob, no KV, no external store. Every change is a normal commit on main,
 * so it shows up in git history and Vercel rebuilds the site from it.
 *
 * Required env: GITHUB_CONTENT_TOKEN (fine-grained PAT, Contents: Read and write
 * on this repo). Optional: GITHUB_CONTENT_REPO, GITHUB_CONTENT_BRANCH.
 */

const API = "https://api.github.com";

export function gitRepoConfigured(): boolean {
  return Boolean(process.env.GITHUB_CONTENT_TOKEN?.trim());
}

function repo(): string {
  return process.env.GITHUB_CONTENT_REPO?.trim() || "goropojixoj12-oss/lox-voice";
}

function branch(): string {
  return process.env.GITHUB_CONTENT_BRANCH?.trim() || "main";
}

function token(): string {
  const value = process.env.GITHUB_CONTENT_TOKEN?.trim();
  if (!value) throw new Error("GITHUB_CONTENT_TOKEN is not configured");
  return value;
}

async function gh(pathname: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API}${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  return res;
}

export type GitFile = {
  path: string;
  /** UTF-8 text */
  text?: string;
  /** Raw bytes as base64 (mutually exclusive with text) */
  base64?: string;
};

export async function readGitFile(
  path: string,
): Promise<{ text: string; base64: string } | null> {
  const res = await gh(`/repos/${repo()}/contents/${encodeURI(path)}?ref=${branch()}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`github read ${path}: ${res.status}`);
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content) return null;
  const base64 = data.content.replace(/\n/g, "");
  return { base64, text: Buffer.from(base64, "base64").toString("utf8") };
}

export type GitDirEntry = { name: string; path: string; type: "file" | "dir" };

/** Minimal directory listing (one level). Returns [] when the path does not exist. */
export async function listGitDir(path: string): Promise<GitDirEntry[]> {
  const res = await gh(`/repos/${repo()}/contents/${encodeURI(path)}?ref=${branch()}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`github list ${path}: ${res.status}`);
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return (data as Array<{ name: string; path: string; type: "file" | "dir" }>).map((entry) => ({
    name: entry.name,
    path: entry.path,
    type: entry.type,
  }));
}

/** One atomic commit with any number of files. Returns the commit html_url. */
export async function commitFiles(message: string, files: GitFile[]): Promise<string> {
  if (files.length === 0) throw new Error("commitFiles: nothing to commit");

  const refRes = await gh(`/repos/${repo()}/git/ref/heads/${branch()}`);
  if (!refRes.ok) throw new Error(`github ref: ${refRes.status}`);
  const ref = (await refRes.json()) as { object: { sha: string } };
  const headSha = ref.object.sha;

  const commitRes = await gh(`/repos/${repo()}/git/commits/${headSha}`);
  if (!commitRes.ok) throw new Error(`github head commit: ${commitRes.status}`);
  const headCommit = (await commitRes.json()) as { tree: { sha: string } };

  const entries = [];
  for (const file of files) {
    const blobRes = await gh(`/repos/${repo()}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: file.base64 ?? Buffer.from(file.text ?? "", "utf8").toString("base64"),
        encoding: "base64",
      }),
    });
    if (!blobRes.ok) throw new Error(`github blob ${file.path}: ${blobRes.status}`);
    const blob = (await blobRes.json()) as { sha: string };
    entries.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
  }

  const treeRes = await gh(`/repos/${repo()}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }),
  });
  if (!treeRes.ok) throw new Error(`github tree: ${treeRes.status}`);
  const tree = (await treeRes.json()) as { sha: string };

  const newCommitRes = await gh(`/repos/${repo()}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: tree.sha,
      parents: [headSha],
    }),
  });
  if (!newCommitRes.ok) throw new Error(`github commit: ${newCommitRes.status}`);
  const newCommit = (await newCommitRes.json()) as { sha: string; html_url: string };

  const updateRes = await gh(`/repos/${repo()}/git/refs/heads/${branch()}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });
  if (!updateRes.ok) {
    throw new Error(`github ref update: ${updateRes.status} (branch moved - retry)`);
  }

  return newCommit.html_url;
}