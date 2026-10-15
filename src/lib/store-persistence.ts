import { head, put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export type StorePersistenceBackend = "kv" | "blob" | "filesystem";

const BLOB_PREFIX = "seaps-data";
const KV_PREFIX = "seaps:store:";

function kvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function resolveStorePersistenceBackend(): StorePersistenceBackend {
  if (kvConfigured()) return "kv";
  if (blobConfigured()) return "blob";
  return "filesystem";
}

function preferredDataDirs(): string[] {
  const local = path.join(process.cwd(), ".data");
  const tmp = path.join(os.tmpdir(), "seaps-data");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return [tmp, local];
  }
  return [local, tmp];
}

let resolvedDataDir: string | null = null;

async function getDataDir(): Promise<string> {
  if (resolvedDataDir) return resolvedDataDir;

  for (const dir of preferredDataDirs()) {
    try {
      await fs.mkdir(dir, { recursive: true });
      const probe = path.join(dir, `.write-probe-${process.pid}`);
      await fs.writeFile(probe, "ok", "utf8");
      await fs.unlink(probe).catch(() => undefined);
      resolvedDataDir = dir;
      return dir;
    } catch {
      // try next candidate
    }
  }

  resolvedDataDir = path.join(os.tmpdir(), "seaps-data");
  return resolvedDataDir;
}

function blobPathname(file: string): string {
  return `${BLOB_PREFIX}/${file}`;
}

function kvKey(file: string): string {
  return `${KV_PREFIX}${file}`;
}

async function readFromKv(file: string): Promise<string | null> {
  const value = await kv.get<string>(kvKey(file));
  return value ?? null;
}

async function writeToKv(file: string, raw: string): Promise<void> {
  await kv.set(kvKey(file), raw);
}

async function readFromBlob(file: string): Promise<string | null> {
  try {
    const meta = await head(blobPathname(file));
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function writeToBlob(file: string, raw: string): Promise<void> {
  await put(blobPathname(file), raw, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function readFromFilesystem(file: string): Promise<string | null> {
  try {
    const dir = await getDataDir();
    return await fs.readFile(path.join(dir, file), "utf8");
  } catch {
    return null;
  }
}

async function writeToFilesystem(file: string, raw: string): Promise<void> {
  const dir = await getDataDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file), raw, "utf8");
}

/** Read raw JSON text for a store file. Returns null when missing. */
export async function readStoreRaw(file: string): Promise<string | null> {
  const backend = resolveStorePersistenceBackend();
  if (backend === "kv") return readFromKv(file);
  if (backend === "blob") return readFromBlob(file);
  return readFromFilesystem(file);
}

/** Persist raw JSON text for a store file. */
export async function writeStoreRaw(file: string, raw: string): Promise<void> {
  const backend = resolveStorePersistenceBackend();
  if (backend === "kv") {
    await writeToKv(file, raw);
    return;
  }
  if (backend === "blob") {
    await writeToBlob(file, raw);
    return;
  }
  await writeToFilesystem(file, raw);
}

export async function readStoreJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await readStoreRaw(file);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeStoreJson<T>(file: string, data: T): Promise<void> {
  const raw = JSON.stringify(data, null, 2);
  await writeStoreRaw(file, raw);
}
