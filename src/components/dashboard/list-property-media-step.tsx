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
import { cn } from "@/lib/utils";

async function uploadViaServer(file: File): Promise<ListingMediaItem> {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/dashboard/list-property/media", {
    method: "POST",
    body,
  });
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

async function uploadViaBlobClient(file: File, userId: string): Promise<ListingMediaItem> {
  const mime = inferMimeType(file);
  const kind = mediaKindFromMime(mime);
  if (!kind) {
    throw new Error("Use JPG, PNG, WebP, GIF, MP4, MOV, or WebM files.");
  }
  const safeName = sanitizeListingFileName(file.name || "upload");
  const storageKey = `${userId}/${nanoid(10)}-${safeName}`;
  const pathname = `${BLOB_PREFIX}/${storageKey}`;

  await upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/dashboard/list-property/media/client-upload",
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

async function uploadOne(file: File, userId: string | null): Promise<ListingMediaItem> {
  if (userId) {
    try {
      return await uploadViaBlobClient(file, userId);
    } catch (clientError) {
      if (file.size <= 4.5 * 1024 * 1024) {
        try {
          return await uploadViaServer(file);
        } catch (serverError) {
          const msg =
            clientError instanceof Error ? clientError.message : "Upload failed";
          const serverMsg =
            serverError instanceof Error ? serverError.message : "Upload failed";
          throw new Error(`${msg} (${serverMsg})`);
        }
      }
      throw clientError;
    }
  }
  return uploadViaServer(file);
}

export function ListPropertyMediaStep({
  items,
  onChange,
  listingTitle,
}: {
  items: ListingMediaItem[];
  onChange: (next: ListingMediaItem[]) => void;
  listingTitle: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data: { user?: { id?: string } | null }) => {
        setUserId(data.user?.id ?? null);
      })
      .catch(() => setUserId(null))
      .finally(() => setSessionReady(true));
  }, []);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    if (!sessionReady) {
      setError("Still loading your session — try again in a moment.");
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
    let done = 0;

    for (const file of files) {
      setProgress(`Uploading ${done + 1} / ${files.length}: ${file.name}`);
      try {
        const item = await uploadOne(file, userId);
        if (item.kind === "image" && !next.some((m) => m.kind === "image" && m.isCover)) {
          item.isCover = true;
        }
        next.push(item);
        onChange([...next]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        break;
      }
      done += 1;
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
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-muted)]">
        Upload many photos and videos for this listing. Cards across the site autoplay a{" "}
        <strong className="text-[var(--color-text)]">looping preview</strong>: your chosen preview
        video, or — if you only upload photos — a fast flipbook (like YouTube hover previews, but
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
        <p className="text-sm text-[var(--color-muted)]">Add at least one photo to continue.</p>
      ) : null}
    </div>
  );
}
