import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { Pool } from "pg";

/**
 * Persistence for everything that is NOT a listing (inquiries, favourites,
 * saved searches, analytics, admin tasks, audit log, platform users, profiles).
 *
 * Listings are files in the repository; the command queue is content/requests.json.
 * There is no object storage and no KV: Postgres when DATABASE_URL is present,
 * plain files on a dev machine.
 */
export type StorePersistenceBackend = "postgres" | "filesystem";

const PG_TABLE = "seaps_store";
const PG_BLOB_TABLE = "seaps_blobs";

function envTrim(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed === "" ? undefined : trimmed;
}

function databaseUrl(): string | undefined {
  const raw =
    envTrim("DATABASE_URL") ??
    envTrim("POSTGRES_URL") ??
    envTrim("PRISMA_DATABASE_URL");
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    if (!parsed.hostname || !parsed.protocol.startsWith("postgres")) return undefined;
    return raw;
  } catch {
    return undefined;
  }
}

export function postgresConfigured(): boolean {
  return Boolean(databaseUrl());
}

export type StorePersistenceEnvFlags = {
  hasDatabaseUrl: boolean;
  isVercelRuntime: boolean;
};

export function getStorePersistenceEnvFlags(): StorePersistenceEnvFlags {
  return {
    hasDatabaseUrl: postgresConfigured(),
    isVercelRuntime: Boolean(process.env.VERCEL),
  };
}

let pool: Pool | null = null;
let ready: Promise<void> | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL is not configured");
  pool = new Pool({
    connectionString: url,
    ssl: url.includes("sslmode=require")
      ? { rejectUnauthorized: process.env.PG_SSL_STRICT !== "1" }
      : undefined,
    max: 5,
  });
  return pool;
}

async function ensureTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const p = getPool();
      await p.query(`
        CREATE TABLE IF NOT EXISTS ${PG_TABLE} (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
      await p.query(`
        CREATE TABLE IF NOT EXISTS ${PG_BLOB_TABLE} (
          key TEXT PRIMARY KEY,
          bytes BYTEA NOT NULL,
          content_type TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    })().catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
}

export function resolveStorePersistenceBackend(): StorePersistenceBackend {
  if (postgresConfigured()) return "postgres";
  return "filesystem";
}

function preferredDataDirs(): string[] {
  const local = path.join(process.cwd(), ".data");
  const tmp = path.join(os.tmpdir(), "seaps-data");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return [tmp, local];
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

export async function readStoreRaw(file: string): Promise<string | null> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    const res = await getPool().query<{ value: string }>(
      `SELECT value FROM ${PG_TABLE} WHERE key = $1`,
      [file],
    );
    return res.rows[0]?.value ?? null;
  }
  try {
    const dir = await getDataDir();
    return await fs.readFile(path.join(dir, file), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") return null;
    console.warn(`[store] fs read failed for ${file}:`, err);
    return null;
  }
}

export async function writeStoreRaw(file: string, raw: string): Promise<void> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    await getPool().query(
      `INSERT INTO ${PG_TABLE} (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [file, raw],
    );
    return;
  }
  const dir = await getDataDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, file), raw, "utf8");
}

export async function readStoreJson<T>(file: string, fallback: T): Promise<T> {
  const raw = await readStoreRaw(file);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[store] corrupt JSON in ${file}:`, err);
    throw err;
  }
}

export async function writeStoreJson<T>(file: string, data: T): Promise<void> {
  await writeStoreRaw(file, JSON.stringify(data));
}

/* ---------- binary files (documents, avatars) ---------- */

export async function writeStoreBlob(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    await getPool().query(
      `INSERT INTO ${PG_BLOB_TABLE} (key, bytes, content_type, updated_at) VALUES ($1, $2, $3, NOW())
       ON CONFLICT (key) DO UPDATE SET bytes = EXCLUDED.bytes, content_type = EXCLUDED.content_type, updated_at = NOW()`,
      [key, bytes, contentType],
    );
    return;
  }
  const dir = await getDataDir();
  const target = path.join(dir, "blobs", key.replace(/[^\w./-]/g, "_"));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, bytes);
  await fs.writeFile(`${target}.meta`, contentType, "utf8");
}

export async function readStoreBlob(
  key: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    const res = await getPool().query<{ bytes: Buffer; content_type: string }>(
      `SELECT bytes, content_type FROM ${PG_BLOB_TABLE} WHERE key = $1`,
      [key],
    );
    const row = res.rows[0];
    return row ? { bytes: row.bytes, contentType: row.content_type } : null;
  }
  try {
    const dir = await getDataDir();
    const target = path.join(dir, "blobs", key.replace(/[^\w./-]/g, "_"));
    const bytes = await fs.readFile(target);
    const contentType = await fs.readFile(`${target}.meta`, "utf8").catch(() => "application/octet-stream");
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function deleteStoreBlob(key: string): Promise<void> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    await getPool().query(`DELETE FROM ${PG_BLOB_TABLE} WHERE key = $1`, [key]);
    return;
  }
  const dir = await getDataDir();
  const target = path.join(dir, "blobs", key.replace(/[^\w./-]/g, "_"));
  await fs.unlink(target).catch(() => undefined);
  await fs.unlink(`${target}.meta`).catch(() => undefined);
}

/** Every key stored as JSON text — used by the full inventory backup. */
export async function listStoreTextKeys(): Promise<string[]> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    const res = await getPool().query<{ key: string }>(
      `SELECT key FROM ${PG_TABLE} ORDER BY key`,
    );
    return res.rows.map((row) => row.key);
  }
  const dir = await getDataDir();
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  return names.filter((name) => name.endsWith(".json")).sort();
}

/** Every binary key — used by the full inventory backup. */
export async function listStoreBlobKeys(): Promise<string[]> {
  if (resolveStorePersistenceBackend() === "postgres") {
    await ensureTables();
    const res = await getPool().query<{ key: string }>(
      `SELECT key FROM ${PG_BLOB_TABLE} ORDER BY key`,
    );
    return res.rows.map((row) => row.key);
  }
  const dir = await getDataDir();
  const out: string[] = [];
  async function walk(rel: string): Promise<void> {
    const entries = await fs.readdir(path.join(dir, "blobs", rel), { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.name.endsWith(".meta")) continue;
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(next);
      else out.push(next);
    }
  }
  await walk("");
  return out.sort();
}

/** Health probe used by /api/health/storage. */
export async function pingStore(): Promise<{
  backend: StorePersistenceBackend;
  ok: boolean;
  detail: string;
  keys?: number;
  blobs?: number;
}> {
  const backend = resolveStorePersistenceBackend();
  if (backend !== "postgres") return { backend, ok: true, detail: "filesystem" };
  try {
    await ensureTables();
    const p = getPool();
    const keys = await p.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${PG_TABLE}`);
    const blobs = await p.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM ${PG_BLOB_TABLE}`);
    return {
      backend,
      ok: true,
      detail: "postgres reachable",
      keys: Number(keys.rows[0]?.count ?? 0),
      blobs: Number(blobs.rows[0]?.count ?? 0),
    };
  } catch (error) {
    return {
      backend,
      ok: false,
      detail: error instanceof Error ? error.message : "postgres error",
    };
  }
}