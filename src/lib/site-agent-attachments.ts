import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { isBlobStorageAvailable } from "@/lib/store-persistence";

const BLOB_PREFIX = "seaps-admin-site-requests";
const LOCAL_DIR = "admin-site-requests";
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function blobAuth(): { token?: string; storeId?: string; oidcToken?: string } {
  const storeId =
    process.env.BLOB_STORE_ID?.trim() || process.env.VERCEL_BLOB_STORE_ID?.trim();
  const token =
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim();
  if (token) return storeId ? { token, storeId } : { token };
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (storeId && oidcToken) return { storeId, oidcToken };
  if (storeId && process.env.VERCEL === "1") return { storeId };
  return {};
}

function blobPathname(storageKey: string): string {
  return `${BLOB_PREFIX}/${storageKey}`;
}

async function localRoot(): Promise<string> {
  const local = path.join(process.cwd(), ".data", LOCAL_DIR);
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmp = path.join(os.tmpdir(), LOCAL_DIR);
    await fs.mkdir(tmp, { recursive: true }).catch(() => undefined);
    return tmp;
  }
  await fs.mkdir(local, { recursive: true });
  return local;
}

function sanitizeFileName(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-()+ ]+/g, "_").slice(0, 120);
  return base || "attachment.bin";
}

export function validateSiteRequestAttachment(file: File): string | null {
  if (file.size > MAX_BYTES) return "Image must be 4 MB or smaller.";
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_TYPES.has(type)) return "Only JPEG, PNG, WebP, or GIF screenshots are allowed.";
  return null;
}

export async function writeSiteRequestAttachment(
  requestId: string,
  file: File,
): Promise<{ storageKey: string; fileName: string; contentType: string; sizeBytes: number }> {
  const validation = validateSiteRequestAttachment(file);
  if (validation) throw new Error(validation);

  const fileName = sanitizeFileName(file.name);
  const storageKey = `${requestId}/${fileName}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  if (isBlobStorageAvailable()) {
    await put(blobPathname(storageKey), bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      ...blobAuth(),
    });
  } else {
    const root = await localRoot();
    const filePath = path.join(root, storageKey.replace(/\//g, "__"));
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, bytes);
    await fs.writeFile(`${filePath}.meta.json`, JSON.stringify({ contentType }), "utf8");
  }

  return { storageKey, fileName, contentType, sizeBytes: bytes.length };
}

export async function readSiteRequestAttachment(
  storageKey: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (isBlobStorageAvailable()) {
    try {
      const result = await get(blobPathname(storageKey), {
        access: "private",
        useCache: false,
        ...blobAuth(),
      });
      if (!result?.stream || result.statusCode !== 200) return null;
      const ab = await new Response(result.stream).arrayBuffer();
      return {
        bytes: Buffer.from(ab),
        contentType: result.blob.contentType ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }
  const root = await localRoot();
  const filePath = path.join(root, storageKey.replace(/\//g, "__"));
  try {
    const bytes = await fs.readFile(filePath);
    let contentType = "application/octet-stream";
    try {
      const meta = JSON.parse(await fs.readFile(`${filePath}.meta.json`, "utf8")) as {
        contentType?: string;
      };
      if (meta.contentType) contentType = meta.contentType;
    } catch {
      /* ignore */
    }
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function deleteSiteRequestAttachment(storageKey: string): Promise<void> {
  if (isBlobStorageAvailable()) {
    try {
      await del(blobPathname(storageKey), blobAuth());
    } catch {
      /* ignore */
    }
    return;
  }
  const root = await localRoot();
  const filePath = path.join(root, storageKey.replace(/\//g, "__"));
  await fs.unlink(filePath).catch(() => undefined);
  await fs.unlink(`${filePath}.meta.json`).catch(() => undefined);
}
