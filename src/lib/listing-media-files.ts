import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { isBlobStorageAvailable } from "@/lib/store-persistence";

const BLOB_PREFIX = "seaps-listings";
const LOCAL_DIR_NAME = "listing-media";

function blobAuth(): { token?: string; storeId?: string; oidcToken?: string } {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim();
  if (token) return { token };
  const storeId =
    process.env.BLOB_STORE_ID?.trim() || process.env.VERCEL_BLOB_STORE_ID?.trim();
  const oidcToken = process.env.VERCEL_OIDC_TOKEN?.trim();
  if (storeId && oidcToken) return { storeId, oidcToken };
  if (storeId && process.env.VERCEL === "1") return { storeId };
  return {};
}

function useBlob(): boolean {
  return isBlobStorageAvailable();
}

async function localMediaRoot(): Promise<string> {
  const local = path.join(process.cwd(), ".data", LOCAL_DIR_NAME);
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmp = path.join(os.tmpdir(), LOCAL_DIR_NAME);
    await fs.mkdir(tmp, { recursive: true }).catch(() => undefined);
    return tmp;
  }
  await fs.mkdir(local, { recursive: true });
  return local;
}

function blobPathname(storageKey: string): string {
  return `${BLOB_PREFIX}/${storageKey}`;
}

function localFilePath(storageKey: string): Promise<string> {
  return localMediaRoot().then((dir) => path.join(dir, storageKey.replace(/\//g, "__")));
}

export function listingMediaPublicUrl(storageKey: string): string {
  return `/api/listings/media/${storageKey
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

export function sanitizeListingFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120);
}

export async function writeListingMediaFile(
  storageKey: string,
  bytes: Buffer,
  contentType: string,
): Promise<{ url: string; storageKey: string }> {
  if (useBlob()) {
    const result = await put(blobPathname(storageKey), bytes, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      ...blobAuth(),
    });
    return { url: result.url, storageKey };
  }
  const filePath = await localFilePath(storageKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, bytes);
  await fs.writeFile(`${filePath}.meta.json`, JSON.stringify({ contentType }), "utf8");
  return { url: listingMediaPublicUrl(storageKey), storageKey };
}

export async function readListingMediaFile(
  storageKey: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  if (useBlob()) {
    try {
      const result = await get(blobPathname(storageKey), {
        access: "public",
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
  const filePath = await localFilePath(storageKey);
  try {
    const bytes = await fs.readFile(filePath);
    let contentType = "application/octet-stream";
    try {
      const meta = JSON.parse(await fs.readFile(`${filePath}.meta.json`, "utf8")) as {
        contentType?: string;
      };
      if (meta.contentType) contentType = meta.contentType;
    } catch {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".mp4") contentType = "video/mp4";
      else if (ext === ".webm") contentType = "video/webm";
    }
    return { bytes, contentType };
  } catch {
    return null;
  }
}

export async function deleteListingMediaFile(storageKey: string): Promise<void> {
  if (useBlob()) {
    try {
      await del(blobPathname(storageKey), blobAuth());
    } catch {
      /* ignore */
    }
    return;
  }
  const filePath = await localFilePath(storageKey);
  await fs.unlink(filePath).catch(() => undefined);
  await fs.unlink(`${filePath}.meta.json`).catch(() => undefined);
}
