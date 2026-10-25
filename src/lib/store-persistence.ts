import { get, put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import { promises as fs } from "fs";
import os from "os";
import path from "path";

export type StorePersistenceBackend = "kv" | "blob" | "filesystem";

const BLOB_PREFIX = "seaps-data";
const KV_PREFIX = "seaps:store:";

/** Private Blob stores require `access: 'private'` on put/get (Vercel quickstart). */
const BLOB_ACCESS = ((): "public" | "private" => {
  const raw = envTrim("BLOB_ACCESS") ?? envTrim("VERCEL_BLOB_ACCESS");
  if (raw === "public" || raw === "private") return raw;
  return "private";
})();

function envTrim(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** @vercel/kv reads KV_REST_*; Vercel Redis integration often exposes Upstash names only. */
function ensureKvEnvAliases(): void {
  if (!envTrim("KV_REST_API_URL") && envTrim("UPSTASH_REDIS_REST_URL")) {
    process.env.KV_REST_API_URL = envTrim("UPSTASH_REDIS_REST_URL")!;
  }
  if (!envTrim("KV_REST_API_TOKEN") && envTrim("UPSTASH_REDIS_REST_TOKEN")) {
    process.env.KV_REST_API_TOKEN = envTrim("UPSTASH_REDIS_REST_TOKEN")!;
  }
}
ensureKvEnvAliases();

function kvUrl(): string | undefined {
  return (
    envTrim("KV_REST_API_URL") ??
    envTrim("UPSTASH_REDIS_REST_URL") ??
    envTrim("VERCEL_KV_REST_API_URL")
  );
}

function kvToken(): string | undefined {
  return (
    envTrim("KV_REST_API_TOKEN") ??
    envTrim("UPSTASH_REDIS_REST_TOKEN") ??
    envTrim("VERCEL_KV_REST_API_TOKEN")
  );
}

function kvConfigured(): boolean {
  return Boolean(kvUrl() && kvToken());
}

function blobToken(): string | null {
  const candidates = [
    "BLOB_READ_WRITE_TOKEN",
    "VERCEL_BLOB_READ_WRITE_TOKEN",
  ] as const;
  for (const name of candidates) {
    const value = envTrim(name);
    if (value) return value;
  }
  return null;
}

function blobStoreId(): string | null {
  const value = envTrim("BLOB_STORE_ID") ?? envTrim("VERCEL_BLOB_STORE_ID");
  return value ?? null;
}

/** Vercel Blob OIDC: store id + runtime OIDC (no read-write token required). */
function blobOidcConfigured(): boolean {
  if (!blobStoreId()) return false;
  if (envTrim("VERCEL_OIDC_TOKEN")) return true;
  return process.env.VERCEL === "1";
}

function blobConfigured(): boolean {
  if (blobToken() != null) return true;
  return blobOidcConfigured();
}

export type StorePersistenceEnvFlags = {
  hasKvUrl: boolean;
  hasKvToken: boolean;
  hasBlobToken: boolean;
  hasBlobStoreId: boolean;
  hasBlobWebhookPublicKey: boolean;
  hasVercelOidcToken: boolean;
  isVercelRuntime: boolean;
  blobOidcEligible: boolean;
};

export function getStorePersistenceEnvFlags(): StorePersistenceEnvFlags {
  const hasBlobStoreId = blobStoreId() != null;
  const hasVercelOidcToken = Boolean(envTrim("VERCEL_OIDC_TOKEN"));
  const isVercelRuntime = process.env.VERCEL === "1";
  return {
    hasKvUrl: Boolean(kvUrl()),
    hasKvToken: Boolean(kvToken()),
    hasBlobToken: blobToken() != null,
    hasBlobStoreId,
    hasBlobWebhookPublicKey: Boolean(envTrim("BLOB_WEBHOOK_PUBLIC_KEY")),
    hasVercelOidcToken,
    isVercelRuntime,
    blobOidcEligible: hasBlobStoreId && (hasVercelOidcToken || isVercelRuntime),
  };
}

type BlobCommandAuth = {
  token?: string;
  storeId?: string;
  oidcToken?: string;
};

/** Options for @vercel/blob when token and/or OIDC + store id are configured. */
function blobCommandAuth(): BlobCommandAuth {
  const storeId = blobStoreId();
  const token = blobToken();
  if (token) {
    return storeId ? { token, storeId } : { token };
  }
  if (!storeId) return {};
  const oidcToken = envTrim("VERCEL_OIDC_TOKEN");
  if (oidcToken) return { storeId, oidcToken };
  if (process.env.VERCEL === "1") return { storeId };
  return {};
}

export function resolveStorePersistenceBackend(): StorePersistenceBackend {
  if (kvConfigured()) return "kv";
  if (blobConfigured()) return "blob";
  return "filesystem";
}

/** True when Vercel Blob (token or OIDC) can store binary agent uploads. */
export function isBlobStorageAvailable(): boolean {
  return blobConfigured();
}

function isServerlessRuntime(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** Static path under project `.data` (trace-friendly for Next.js bundler). */
function projectStorePath(file: string): string {
  return path.join(process.cwd(), ".data", file);
}

/** Ephemeral path on serverless; tmpdir is runtime-only (opt out of static tracing). */
function ephemeralStorePath(file: string): string {
  return path.join(/* turbopackIgnore: true */ os.tmpdir(), "seaps-data", file);
}

function filesystemStorePaths(file: string): string[] {
  return isServerlessRuntime()
    ? [ephemeralStorePath(file), projectStorePath(file)]
    : [projectStorePath(file), ephemeralStorePath(file)];
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
    const auth = blobCommandAuth();
    const result = await get(blobPathname(file), {
      access: BLOB_ACCESS,
      useCache: false,
      ...auth,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    return await new Response(result.stream).text();
  } catch {
    return null;
  }
}

async function writeToBlob(file: string, raw: string): Promise<void> {
  await put(blobPathname(file), raw, {
    access: BLOB_ACCESS,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    ...blobCommandAuth(),
  });
}

async function readFromFilesystem(file: string): Promise<string | null> {
  for (const filePath of filesystemStorePaths(file)) {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function writeToFilesystem(file: string, raw: string): Promise<void> {
  let lastError: unknown;
  for (const filePath of filesystemStorePaths(file)) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, raw, "utf8");
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Failed to write store file");
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
