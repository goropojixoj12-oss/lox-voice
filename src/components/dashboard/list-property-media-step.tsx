"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { PREVIEW_PHOTO_CHOICES, type ListingMediaItem } from "@/lib/list-property-media";
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

async function uploadOne(file: File, actingUserId?: string): Promise<ListingMediaItem> {
  // The server commits the file straight into the repository (content/uploads
  // then public/media on publish). No client token, no object storage.
  return withRetry(() => uploadViaServer(file, actingUserId), 3, 1500);
}

const MAX_TOTAL_UPLOAD_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

export function ListPropertyMediaStep({
  items,
  onChange,
  listingTitle,
  uploadUserId: uploadUserIdOverride,
  actingUserId,
  previewCount,
  onPreviewCountChange,
}: {
  items: ListingMediaItem[];
  onChange: (next: ListingMediaItem[]) => void;
  listingTitle: string;
  /** Storage namespace for uploads (agent account when admin is editing). */
  uploadUserId?: string | null;
  actingUserId?: string;
  previewCount: number;
  onPreviewCountChange: (next: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [pendingFiles, setPendingFiles] = useState<
    { file: File; preview?: string }[]
  >([]);
  const [uploadStatus, setUploadStatus] = useState<
    Record<string, "waiting" | "uploading" | "done" | "error">
  >({});

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
    const files = Array.from(fileList);
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
      const totalMB = Math.round(totalBytes / 1024 / 1024);
      setError(`Общий размер файлов ${totalMB} МБ превышает лимит 1 ГБ. Выберите меньше файлов.`);
      return;
    }
    // Show local previews first so the user sees exactly what they picked
    // before anything is uploaded.
    setPendingFiles((prev) => [
      ...prev,
      ...files.map((file) => {
        const isImage = file.type.startsWith("image/");
        return {
          file,
          preview: isImage ? URL.createObjectURL(file) : undefined,
        };
      }),
    ]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadPending() {
    if (!pendingFiles.length) return;
    if (!sessionReady) {
      setError("Still loading your session \u2014 try again in a moment.");
      return;
    }
    if (!userId) {
      setError("Sign in again to upload photos and videos.");
      return;
    }
    setError("");
    const files = pendingFiles.map((p) => p.file);
    setBusy(true);
    const keyOf = (file: File) => `${file.name}:${file.size}`;
    setUploadStatus(Object.fromEntries(files.map((f) => [keyOf(f), "uploading" as const])));

    const failures: string[] = [];
    let completed = 0;

    // Add every finished file to the list immediately and keep only a few
    // requests in flight: a batch of 42 photos used to fire all at once, show
    // "0 uploaded" until the very end, and lose everything on a refresh.
    const CONCURRENCY = 3;
    const queue = [...files];
    const added: ListingMediaItem[] = [];

    async function worker() {
      for (;;) {
        const file = queue.shift();
        if (!file) return;
        try {
          const item = await uploadOne(file, actingUserId);
          if (item.kind === "image" && !items.some((m) => m.kind === "image" && m.isCover) && !added.some((m) => m.isCover)) {
            item.isCover = true;
          }
          added.push(item);
          onChange([...items, ...added]);
          setUploadStatus((prev) => ({ ...prev, [keyOf(file)]: "done" }));
        } catch (e) {
          setUploadStatus((prev) => ({ ...prev, [keyOf(file)]: "error" }));
          failures.push(`${file.name}: ${e instanceof Error ? e.message : "Upload failed"}`);
        } finally {
          completed += 1;
          setProgress(`Uploaded ${completed} / ${files.length}\u2026`);
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()),
    );

    if (failures.length) {
      setError(
        failures.length === files.length
          ? failures[0]!
          : `Some files failed (${failures.length}/${files.length}): ${failures[0]}`,
      );
    }

    setProgress("");
    setBusy(false);
    // Keep only the files that actually failed - successful ones are already in
    // the uploaded list and must not look "pending" any more.
    setPendingFiles((prev) =>
      prev.filter((entry) =>
        failures.some((f) => f.startsWith(`${entry.file.name}:`)),
      ),
    );
    setTimeout(() => setUploadStatus({}), 4000);
  }

  function patch(id: string, patch: Partial<ListingMediaItem>) {
    onChange(
      items.map((item) => {
        if (item.id !== id) {
          if (patch.isCover && item.kind === "image") return { ...item, isCover: false };
          // Only clear isCardPreview for videos (single-select); images are multi-select.
          if (patch.isCardPreview && item.kind === "video") return { ...item, isCardPreview: false };
          return item;
        }
        return { ...item, ...patch };
      }),
    );
  }

  /** Multi-select up to `previewCount` photos for the looping card preview. */
  function toggleCardPreviewImage(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target || target.kind !== "image") return;
    const alreadySelected = items.filter((i) => i.kind === "image" && i.isCardPreview).length;
    const turningOn = !target.isCardPreview;
    if (turningOn && alreadySelected >= previewCount) {
      setError(`The card preview is limited to ${previewCount} photos.`);
      return;
    }
    setError("");
    patch(id, { isCardPreview: turningOn });
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function move(id: string, delta: number) {
    const from = items.findIndex((i) => i.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    next[to] = items[from];
    next[from] = items[to];
    onChange(next);
  }

  const imageCount = items.filter((i) => i.kind === "image").length;
  const videoCount = items.filter((i) => i.kind === "video").length;

  return (
    <div className="notranslate space-y-4">
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

      {pendingFiles.length > 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-accent)]/50 bg-[var(--color-mist)]/30 p-3">
          <p className="text-sm font-semibold text-[var(--color-accent-soft)]">
            Selected for upload ({pendingFiles.length})
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {pendingFiles.map((entry) => (
              <li
                key={entry.file.name + entry.file.size}
                className="relative flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm"
              >
                {entry.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="h-12 w-16 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-secondary)] text-[10px] uppercase text-[var(--color-muted)]">
                    video
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{entry.file.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {Math.round(entry.file.size / 1024)} KB
                  </p>
                  {(() => {
                    const status = uploadStatus[`${entry.file.name}:${entry.file.size}`];
                    if (!status) return null;
                    const label =
                      status === "done"
                        ? "uploaded"
                        : status === "error"
                          ? "failed"
                          : "uploading…";
                    const tone =
                      status === "done"
                        ? "text-green-600"
                        : status === "error"
                          ? "text-[var(--color-danger)]"
                          : "text-[var(--color-accent-soft)]";
                    return <p className={`text-xs font-semibold ${tone}`}>{label}</p>;
                  })()}
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${entry.file.name} from selection`}
                  className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                  onClick={() => {
                    setPendingFiles((prev) => prev.filter((p) => p !== entry));
                    if (entry.preview) URL.revokeObjectURL(entry.preview);
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="mt-3"
            disabled={busy || !sessionReady}
            onClick={() => void uploadPending()}
          >
            {busy ? "Uploading\u2026" : `Upload ${pendingFiles.length} file${pendingFiles.length === 1 ? "" : "s"}`}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 ml-2"
            disabled={busy}
            onClick={() => {
              for (const p of pendingFiles) if (p.preview) URL.revokeObjectURL(p.preview);
              setPendingFiles([]);
            }}
          >
            Cancel selection
          </Button>
          {busy ? <p className="mt-2 text-xs text-[var(--color-muted)]">{progress}</p> : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <p className="text-xs text-[var(--color-muted)]">
        {imageCount} photo{imageCount === 1 ? "" : "s"}, {videoCount} video
        {videoCount === 1 ? "" : "s"} uploaded
        {busy ? " · uploading now, keep this tab open" : ""}
      </p>

      <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <Label htmlFor="preview-photo-count" className="text-sm">
          Photos in the card preview
        </Label>
        <Select
          id="preview-photo-count"
          value={String(previewCount)}
          onChange={(e) => onPreviewCountChange(Number(e.target.value))}
          className="w-24"
          disabled={imageCount < 2}
        >
          {PREVIEW_PHOTO_CHOICES.map((n) => (
            <option key={n} value={String(n)}>
              {n}
            </option>
          ))}
        </Select>
        <span className="text-xs text-[var(--color-muted)]">
          {imageCount >= 2
            ? `выбрано ${items.filter((i) => i.kind === "image" && i.isCardPreview).length} из ${Math.min(previewCount, imageCount)} — нажмите «Card preview» на фото ниже, чтобы включить или выключить его в превью`
            : "add at least two photos and the card starts flipping through them"}
        </span>
      </div>

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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.name}
                loading="lazy"
                className="h-12 w-16 shrink-0 rounded-[var(--radius-md)] border border-[var(--color-border)] object-cover"
              />
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Move earlier"
              disabled={items.findIndex((i) => i.id === item.id) === 0}
              onClick={() => move(item.id, -1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Move later"
              disabled={items.findIndex((i) => i.id === item.id) === items.length - 1}
              onClick={() => move(item.id, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            {item.kind === "image" ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant={item.isCover ? "primary" : "outline"}
                  onClick={() => patch(item.id, { isCover: true })}
                >
                  Cover
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={item.isCardPreview ? "primary" : "outline"}
                  onClick={() => toggleCardPreviewImage(item.id)}
                >
                  Card preview
                </Button>
              </>
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
          Photos and videos are optional — skip this step or add media later.
        </p>
      ) : null}
    </div>
  );
}
