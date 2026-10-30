"use client";

import { upload } from "@vercel/blob/client";
import { nanoid } from "nanoid";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { BLOB_PREFIX } from "@/lib/listing-media-constants";
import { inferMimeType, mediaKindFromMime } from "@/lib/listing-media-mime";
import { listingMediaPublicUrl, sanitizeListingFileName } from "@/lib/listing-media-constants";
import type { ListingMediaItem } from "@/lib/list-property-media";
import { withActingAgentUser } from "@/lib/agent-desk-api-client";
import { cn } from "@/lib/utils";

async function uploadViaServer(file: File, actingUserId?: string): Promise<ListingMediaItem> {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch(
    "/api/dashboard/list-property/media",
    withActingAgentUser(actingUserId, {
      method: "POST",
      body,
    }),
  );
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    item?: ListingMediaItem;
  };
  if (!res.ok) {
    throw new Error(data.error ?? "Upload failed");
  }
  if (!data.item) throw new Error("Upload failed");
  return data.item;
}

async function uploadViaBlobClient(
  file: File,
  userId: string,
  actingUserId?: string,
): Promise<ListingMediaItem> {
  const mime = inferMimeType(file);
  const kind = mediaKindFromMime(mime);
  if (!kind) {
    throw new Error("Use JPG, PNG, WebP, GIF, MP4, MOV, or WebM files.");
  }
  const safeName = sanitizeListingFileName(file.name || "upload");
  const storageKey = `${userId}/${nanoid(10)}-${safeName}`;
  const pathname = `${BLOB_PREFIX}/${storageKey}`;

  const uploadQuery = actingUserId
    ? `?userId=${encodeURIComponent(actingUserId)}`
    : "";
  await upload(pathname, file, {
    access: "private",
    handleUploadUrl: `/api/dashboard/list-property/media/client-upload${uploadQuery}`,
    multipart: file.size > 4.5 * 1024 * 1024,
    contentType: mime,
  });

  return {
    id: nanoid(8),
    kind,
    url: listingMediaPublicUrl(storageKey),
    storageKey,
    name: file.name,
    size: file.size,
  };
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number,
  delayMs: number,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

async function uploadOne(
  file: File,
  userId: string | null,
  actingUserId?: string,
): Promise<ListingMediaItem> {
  if (file.size <= 4.5 * 1024 * 1024) {
    try {
      return await withRetry(() => uploadViaServer(file, actingUserId), 2, 1000);
    } catch {
      if (userId) {
        return withRetry(() => uploadViaBlobClient(file, userId, actingUserId), 2, 1000);
      }
      throw new Error("Upload failed");
    }
  }
  if (!userId) {
    throw new Error("Sign in required for large uploads.");
  }
  return withRetry(() => uploadViaBlobClient(file, userId, actingUserId), 2, 1500);
}

const UPLOAD_CONCURRENCY = 6;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const i = nextIndex;
      nextIndex += 1;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!, i);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export function ListPropertyMediaStep({
  items,
  onChange,
  listingTitle,
  uploadUserId: uploadUserIdOverride,
  actingUserId,
}: {
  items: ListingMediaItem[];
  onChange: (next: ListingMediaItem[]) => void;
  listingTitle: string;
  /** Storage namespace for uploads (agent account when admin is editing). */
  uploadUserId?: string | null;
  actingUserId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (uploadUserIdOverride) {
      setUserId(uploadUserIdOverride);
      setSessionReady(true);
      return;
    }
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { user?: { id?: string } | null }) => {
        setUserId(data.user?.id ?? null);
      })
      .catch(() => setUserId(null))
      .finally(() => setSessionReady(true));
  }, [uploadUserIdOverride]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (!sessionReady) {
      setError("Still loading your session \u2014 try again in a moment.");
      return;
    }
    if (!userId) {
      setError("Sign in again to upload photos and videos.");
      return;
    }
    setError("");
    setBusy(true);
    const files = Array.from(fileList);
    const next = [...items];

    const failures: string[] = [];
    let completed = 0;
    const uploaded = await mapWithConcurrency(files, UPLOAD_CONCURRENCY, async (file) => {
      try {
        const item = await uploadOne(file, userId, actingUserId);
        completed += 1;
        setProgress(`Uploaded ${completed} / ${files.length}\u2026`);
        return { ok: true as const, item, file };
      } catch (e) {
        completed += 1;
        setProgress(`Uploaded ${completed} / ${files.length}\u2026`);
        return {
          ok: false as const,
          error: `${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`,
        };
      }
    });

    for (const result of uploaded) {
      if (!result.ok) {
        failures.push(result.error);
        continue;
      }
      const item = result.item;
      if (item.kind === "image" && !next.some((m) => m.kind === "image" && m.isCover)) {
        item.isCover = true;
      }
      next.push(item);
    }
    onChange([...next]);
    if (failures.length) {
      setError(
        failures.length === files.length
          ? failures[0]!
          : `Some files failed (${failures.length}/${files.length}): ${failures[0]}`,
      );
    }

    setProgress("");
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function patch(id: string, patch: Partial<ListingMediaItem>) {
    onChange(
      items.map((item) => {
        if (item.id !== id) {
          if (patch.isCover && item.kind === "image") return { ...item, isCover: false };
          if (patch.isCardPreview && item.kind === "video") return { ...item, isCardPreview: false };
          return item;
        }
        return { ...item, ...patch };
      }),
    );
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  const imageCount = items.filter((i) => i.kind === "image").length;
  const videoCount = items.filter((i) => i.kind === "video").length;

  return (
    <div className="notranslate space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        Upload many photos and videos for this listing. Cards across the site autoplay a{" "}
        <strong className="text-[var(--color-text)]">looping preview</strong>: your chosen preview
        video, or \u2014 if you only upload photos \u2014 a fast flipbook (like YouTube hover previews, but
        always on). For {listingTitle ? `"${listingTitle}"` : "this listing"} you can add all{" "}
        <strong className="text-[var(--color-text)]">50 photos</strong> and{" "}
        <strong className="text-[var(--color-text)]">2 videos</strong> here. Large files upload
        directly to storage (up to 12MB per photo, 80MB per video).
      </p>

      <div
        className={cn(
          "rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-mist)]/40 p-6 text-center",
          busy && "opacity-80",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov"
          multiple
          className="sr-only"
          id="listing-media-files"
          disabled={busy || !sessionReady}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <Label htmlFor="listing-media-files" className="cursor-pointer">
          <span className="text-sm font-semibold text-[var(--color-accent-soft)]">
            Choose photos & videos
          </span>
          <span className="mt-1 block text-xs text-[var(--color-muted)]">
            Select many files at once (Ctrl/Cmd+click or Shift+range)
          </span>
        </Label>
        {progress ? <p className="mt-3 text-xs text-[var(--color-muted)]">{progress}</p> : null}
      </div>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <p className="text-xs text-[var(--color-muted)]">
        {imageCount} photo{imageCount === 1 ? "" : "s"}, {videoCount} video
        {videoCount === 1 ? "" : "s"} uploaded
      </p>

      <ul className="max-h-80 space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
          >
            <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
            <span className="rounded-full bg-[var(--color-secondary)] px-2 py-0.5 text-[10px] uppercase tracking-wide">
              {item.kind}
            </span>
            {item.kind === "image" ? (
              <Button
                type="button"
                size="sm"
                variant={item.isCover ? "primary" : "outline"}
                onClick={() => patch(item.id, { isCover: true })}
              >
                Cover
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant={item.isCardPreview ? "primary" : "outline"}
                onClick={() => patch(item.id, { isCardPreview: true })}
              >
                Card preview
              </Button>
            )}
            <Button type="button" size="sm" variant="ghost" onClick={() => remove(item.id)}>
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">
          Photos and videos are optional \u2014 skip this step or add media later.
        </p>
      ) : null}
    </div>
  );
}
