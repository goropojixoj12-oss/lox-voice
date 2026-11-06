import { nanoid } from "nanoid";
import {
  deleteStoreBlob,
  readStoreBlob,
  readStoreRaw,
  writeStoreBlob,
  writeStoreRaw,
} from "@/lib/store-persistence";

/**
 * Chunked upload staging.
 *
 * A serverless function can only receive ~4.5 MB per request, while listings
 * accept 12 MB photos and 80 MB videos. The browser therefore sends the file
 * in slices; every slice is staged as a blob, the last request concatenates
 * them and hands the finished buffer to saveListingUpload (which commits it to
 * the repository). Staged slices are deleted immediately after assembly.
 *
 * Staging lives wherever the store lives: Postgres in production, files on a
 * dev machine — the same place the rest of the service data already is.
 */
export const CHUNK_SIZE = 3 * 1024 * 1024;
const PREFIX = "listing-upload-staging";
const META_TTL_MS = 2 * 60 * 60 * 1000;

export type UploadSession = {
  uploadId: string;
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
  chunkSize: number;
  totalChunks: number;
  createdAt: number;
};

function metaKey(uploadId: string): string {
  return `${PREFIX}/${uploadId}/meta.json`;
}

function chunkKey(uploadId: string, index: number): string {
  return `${PREFIX}/${uploadId}/${String(index).padStart(4, "0")}.bin`;
}

export async function createUploadSession(input: {
  userId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<UploadSession> {
  const totalChunks = Math.max(1, Math.ceil(input.size / CHUNK_SIZE));
  const session: UploadSession = {
    uploadId: nanoid(16),
    userId: input.userId,
    fileName: input.fileName,
    contentType: input.contentType,
    size: input.size,
    chunkSize: CHUNK_SIZE,
    totalChunks,
    createdAt: Date.now(),
  };
  await writeStoreRaw(metaKey(session.uploadId), JSON.stringify(session));
  return session;
}

export async function readUploadSession(uploadId: string): Promise<UploadSession | null> {
  if (!/^[\w-]{6,40}$/.test(uploadId)) return null;
  const raw = await readStoreRaw(metaKey(uploadId));
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as UploadSession;
    if (Date.now() - session.createdAt > META_TTL_MS) {
      await discardUploadSession(uploadId, session.totalChunks);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function writeUploadChunk(
  uploadId: string,
  index: number,
  bytes: Buffer,
): Promise<void> {
  await writeStoreBlob(chunkKey(uploadId, index), bytes, "application/octet-stream");
}

export async function assembleUpload(session: UploadSession): Promise<Buffer> {
  const parts: Buffer[] = [];
  for (let index = 0; index < session.totalChunks; index += 1) {
    const chunk = await readStoreBlob(chunkKey(session.uploadId, index));
    if (!chunk) {
      throw new Error(`Missing upload slice ${index + 1} of ${session.totalChunks}`);
    }
    parts.push(chunk.bytes);
  }
  return Buffer.concat(parts);
}

export async function discardUploadSession(
  uploadId: string,
  totalChunks: number,
): Promise<void> {
  for (let index = 0; index < totalChunks; index += 1) {
    await deleteStoreBlob(chunkKey(uploadId, index)).catch(() => undefined);
  }
  // Meta is plain text; the store abstraction has no delete for text keys, so
  // it is overwritten with an expired marker that readUploadSession rejects.
  await writeStoreRaw(metaKey(uploadId), "{\"expired\":true,\"createdAt\":0}").catch(
    () => undefined,
  );
}