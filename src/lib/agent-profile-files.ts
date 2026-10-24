import { del, get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { isBlobStorageAvailable } from "@/lib/store-persistence";

function useBlobForAgentDocs(): boolean {
  return isBlobStorageAvailable();
}

const BLOB_PREFIX = "seaps-agent-docs";

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

async function agentDocsDir(): Promise<string> {
  const local = path.join(process.cwd(), ".data", "agent-docs");
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmp = path.join(os.tmpdir(), "seaps-agent-docs");
    await fs.mkdir(tmp, { recursive: true }).catch(() => undefined);
    return tmp;
  }
  await fs.mkdir(local, { recursive: true });
  return local;
}

function blobPathname(storageKey: string): string {
  return `${BLOB_PREFIX}/${storageKey}`;
}

function localPath(storageKey: string): Promise<string> {
  return agentDocsDir().then((dir) => path.join(dir, storageKey.replace(/\//g, "__")));
}

export async function writeAgentDocumentBytes(
  storageKey: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  if (useBlobForAgentDocs()) {
    await put(blobPathname(storageKey), bytes, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
      ...blobAuth(),
    });
    return;
  }
  const filePath = await localPath(storageKey);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, bytes);
  await fs.writeFile(`${filePath}.meta.json`, JSON.stringify({ contentType }), "utf8");
}

export async function readAgentDocumentBytes(storageKey: string): Promise<Buffer | null> {
  if (useBlobForAgentDocs()) {
    try {
      const result = await get(blobPathname(storageKey), {
        access: "private",
        useCache: false,
        ...blobAuth(),
      });
      if (!result?.stream || result.statusCode !== 200) return null;
      const ab = await new Response(result.stream).arrayBuffer();
      return Buffer.from(ab);
    } catch {
      return null;
    }
  }
  try {
    const filePath = await localPath(storageKey);
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function deleteAgentDocumentBytes(storageKey: string): Promise<void> {
  if (useBlobForAgentDocs()) {
    try {
      await del(blobPathname(storageKey), blobAuth());
    } catch {
      /* missing blob */
    }
    return;
  }
  const filePath = await localPath(storageKey);
  await fs.unlink(filePath).catch(() => undefined);
  await fs.unlink(`${filePath}.meta.json`).catch(() => undefined);
}

export async function readAgentDocumentContentType(storageKey: string): Promise<string> {
  if (!useBlobForAgentDocs()) {
    try {
      const filePath = await localPath(storageKey);
      const raw = await fs.readFile(`${filePath}.meta.json`, "utf8");
      const meta = JSON.parse(raw) as { contentType?: string };
      if (meta.contentType) return meta.contentType;
    } catch {
      /* fall through */
    }
  }
  return "application/octet-stream";
}
