import path from "path";
import {
  deleteStoreBlob,
  readStoreBlob,
  writeStoreBlob,
} from "@/lib/store-persistence";

/**
 * Agent documents and profile photos live in Postgres (seaps_blobs).
 * No object storage, no signed URLs: bytes in, bytes out.
 */
const MAX_BYTES = 4 * 1024 * 1024;
const PREFIX = "agent-docs";

function key(storageKey: string): string {
  return `${PREFIX}/${storageKey.replace(/[^\w./-]+/g, "_")}`;
}

export function validateAgentDocumentFile(file: {
  size: number;
  type?: string;
  name?: string;
}): string | null {
  if (file.size > MAX_BYTES) return "Файл больше 4 МБ";
  const type = (file.type || "").toLowerCase();
  if (type && !/^(application\/pdf|image\/(jpeg|png|webp))$/.test(type)) {
    return "Поддерживаются PDF, JPG, PNG, WebP";
  }
  const ext = path.extname(file.name ?? "").toLowerCase();
  if (!type && ![".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return "Поддерживаются PDF, JPG, PNG, WebP";
  }
  return null;
}

export async function writeAgentDocumentBytes(
  storageKey: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  await writeStoreBlob(key(storageKey), bytes, contentType);
}

export async function readAgentDocumentBytes(
  storageKey: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  return readStoreBlob(key(storageKey));
}

export async function deleteAgentDocumentBytes(storageKey: string): Promise<void> {
  await deleteStoreBlob(key(storageKey));
}