const IDB_NAME = "seaps-site-change-screenshot-dir";
const IDB_STORE = "handles";
const HANDLE_KEY = "screenshots";
const PICKER_ID = "seaps-screenshot-folder";

import {
  type SeapsDirectoryHandle,
  getDirectoryPickerWindow,
} from "@/lib/file-system-access-types";

const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

type DirHandle = SeapsDirectoryHandle;

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onerror = () => reject(req.error ?? new Error("idb open failed"));
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
  });
}

async function readStoredDirectoryHandle(): Promise<DirHandle | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openIdb();
    return await new Promise<DirHandle | null>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(HANDLE_KEY);
      req.onerror = () => reject(req.error ?? new Error("idb get failed"));
      req.onsuccess = () => {
        const value = req.result as DirHandle | undefined;
        resolve(value ?? null);
      };
    });
  } catch {
    return null;
  }
}

async function writeStoredDirectoryHandle(handle: DirHandle): Promise<void> {
  const db = await openIdb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb write failed"));
    tx.objectStore(IDB_STORE).put(handle, HANDLE_KEY);
  });
}

async function ensureReadPermission(handle: DirHandle): Promise<boolean> {
  try {
    const current = await handle.queryPermission({ mode: "read" });
    if (current === "granted") return true;
    const requested = await handle.requestPermission({ mode: "read" });
    return requested === "granted";
  } catch {
    return false;
  }
}

async function collectFilesFromDirectory(
  dir: DirHandle,
  depth: number,
): Promise<File[]> {
  const files: File[] = [];
  try {
    for await (const entry of dir.values()) {
      if (entry.kind === "file") {
        try {
          const fileHandle = entry as FileSystemFileHandle;
          files.push(await fileHandle.getFile());
        } catch {
          /* skip unreadable entries */
        }
      } else if (entry.kind === "directory" && depth > 0) {
        files.push(
          ...(await collectFilesFromDirectory(entry as unknown as SeapsDirectoryHandle, depth - 1)),
        );
      }
    }
  } catch {
    return files;
  }
  return files;
}

function isAcceptedImageFile(file: File): boolean {
  if (IMAGE_EXT.test(file.name)) return true;
  return file.type.startsWith("image/");
}

export function pickLatestImageFile(files: File[]): File | null {
  let best: File | null = null;
  let bestTime = -1;
  for (const file of files) {
    if (!isAcceptedImageFile(file)) continue;
    const time = file.lastModified;
    if (time > bestTime) {
      bestTime = time;
      best = file;
    }
  }
  return best;
}

export type LatestScreenshotResult =
  | { ok: true; file: File; source: "directory" }
  | { ok: false; reason: "unsupported" | "denied" | "empty" | "picker_cancelled" };

export async function resolveLatestScreenshotFile(): Promise<LatestScreenshotResult> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "unsupported" };
  }

  const pickerWindow = getDirectoryPickerWindow(window);
  const hasPicker = pickerWindow !== null;
  let dir = await readStoredDirectoryHandle();

  if (dir && !(await ensureReadPermission(dir))) {
    dir = null;
  }

  if (dir) {
    const files = await collectFilesFromDirectory(dir, 1);
    const latest = pickLatestImageFile(files);
    if (latest) {
      return { ok: true, file: latest, source: "directory" };
    }
  }

  if (!hasPicker) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const picked = await pickerWindow!.showDirectoryPicker({
      mode: "read",
      id: PICKER_ID,
    });
    if (!(await ensureReadPermission(picked))) {
      return { ok: false, reason: "denied" };
    }
    await writeStoredDirectoryHandle(picked);
    const files = await collectFilesFromDirectory(picked, 1);
    const latest = pickLatestImageFile(files);
    if (!latest) {
      return { ok: false, reason: "empty" };
    }
    return { ok: true, file: latest, source: "directory" };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, reason: "picker_cancelled" };
    }
    return { ok: false, reason: "denied" };
  }
}
