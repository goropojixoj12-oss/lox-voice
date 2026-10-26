export const SITE_CHANGE_DRAFT_META_KEY = "seaps-site-change-draft";

/** @deprecated Migrated into {@link SITE_CHANGE_DRAFT_META_KEY} on load. */
const LEGACY_MESSAGE_DRAFT_KEY = "seaps-site-change-message-draft";

const IDB_NAME = "seaps-site-change-draft";
const IDB_STORE = "files";
const ATTACHMENT_IDB_KEY = "attachment";
const DRAFT_VERSION = 1;

export type SiteChangeDraftAttachmentMeta = {
  fileName: string;
  mimeType: string;
  lastModified: number;
};

type SiteChangeDraftMeta = {
  version: number;
  updatedAt: string;
  message: string;
  attachment: SiteChangeDraftAttachmentMeta | null;
};

export type SiteChangeDraftLoaded = {
  message: string;
  file: File | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(IDB_NAME, 1);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function idbGetBlob(key: string): Promise<Blob | null> {
  return openDraftDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readonly");
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(key);
        req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
        req.onsuccess = () => {
          const value = req.result;
          resolve(value instanceof Blob ? value : null);
        };
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

function idbPutBlob(key: string, blob: Blob): Promise<void> {
  return openDraftDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.put(blob, key);
        req.onerror = () => reject(req.error ?? new Error("IndexedDB put failed"));
        req.onsuccess = () => resolve();
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

function idbDelete(key: string): Promise<void> {
  return openDraftDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, "readwrite");
        const store = tx.objectStore(IDB_STORE);
        const req = store.delete(key);
        req.onerror = () => reject(req.error ?? new Error("IndexedDB delete failed"));
        req.onsuccess = () => resolve();
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

function readMeta(): SiteChangeDraftMeta | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SITE_CHANGE_DRAFT_META_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== DRAFT_VERSION) return null;
    const message = parsed.message;
    if (typeof message !== "string") return null;
    let attachment: SiteChangeDraftAttachmentMeta | null = null;
    if (parsed.attachment !== null && parsed.attachment !== undefined) {
      if (!isRecord(parsed.attachment)) return null;
      const fileName = parsed.attachment.fileName;
      const mimeType = parsed.attachment.mimeType;
      const lastModified = parsed.attachment.lastModified;
      if (
        typeof fileName !== "string" ||
        typeof mimeType !== "string" ||
        typeof lastModified !== "number"
      ) {
        return null;
      }
      attachment = { fileName, mimeType, lastModified };
    }
    return {
      version: DRAFT_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      message,
      attachment,
    };
  } catch {
    return null;
  }
}

function writeMeta(meta: SiteChangeDraftMeta): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SITE_CHANGE_DRAFT_META_KEY, JSON.stringify(meta));
  } catch {
    /* quota / private mode */
  }
}

function removeMeta(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SITE_CHANGE_DRAFT_META_KEY);
  } catch {
    /* ignore */
  }
}

function readLegacyMessageDraft(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const legacy = window.localStorage.getItem(LEGACY_MESSAGE_DRAFT_KEY);
    if (legacy === null || legacy.length === 0) return null;
    window.localStorage.removeItem(LEGACY_MESSAGE_DRAFT_KEY);
    return legacy;
  } catch {
    return null;
  }
}

export async function loadSiteChangeDraft(): Promise<SiteChangeDraftLoaded | null> {
  let meta = readMeta();
  if (!meta) {
    const legacyMessage = readLegacyMessageDraft();
    if (legacyMessage) {
      await saveSiteChangeDraft(legacyMessage, null);
      return { message: legacyMessage, file: null };
    }
    return null;
  }

  let file: File | null = null;
  if (meta.attachment) {
    try {
      const blob = await idbGetBlob(ATTACHMENT_IDB_KEY);
      if (blob) {
        file = new File([blob], meta.attachment.fileName, {
          type: meta.attachment.mimeType || blob.type,
          lastModified: meta.attachment.lastModified,
        });
      }
    } catch {
      /* attachment blob missing — still restore text */
    }
  }

  if (meta.message.length === 0 && !file) {
    await clearSiteChangeDraft();
    return null;
  }

  return { message: meta.message, file };
}

export async function saveSiteChangeDraft(message: string, file: File | null): Promise<void> {
  if (typeof window === "undefined") return;

  const trimmedEmpty = message.length === 0;
  if (trimmedEmpty && !file) {
    await clearSiteChangeDraft();
    return;
  }

  const attachmentMeta: SiteChangeDraftAttachmentMeta | null = file
    ? {
        fileName: file.name,
        mimeType: file.type,
        lastModified: file.lastModified,
      }
    : null;

  writeMeta({
    version: DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    message,
    attachment: attachmentMeta,
  });

  try {
    if (file) {
      await idbPutBlob(ATTACHMENT_IDB_KEY, file);
    } else {
      await idbDelete(ATTACHMENT_IDB_KEY);
    }
  } catch {
    /* text still persisted in localStorage */
  }
}

export async function clearSiteChangeDraft(): Promise<void> {
  removeMeta();
  try {
    await idbDelete(ATTACHMENT_IDB_KEY);
  } catch {
    /* ignore */
  }
}
