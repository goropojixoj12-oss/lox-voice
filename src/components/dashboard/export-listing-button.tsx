"use client";

import { useState } from "react";

/**
 * Copies this listing into content/listings (git) so the card comes from the
 * single source of truth instead of the runtime store.
 */
export function ExportListingButton({ listingId }: { listingId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  async function run() {
    setState("busy");
    setMessage(null);
    try {
      const res = await fetch("/api/listings/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listingId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        commitUrl?: string;
        slug?: string;
        photoCount?: number;
        skippedPhotos?: number;
      };
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Не удалось опубликовать карточку");
        return;
      }
      setState("done");
      setCommitUrl(data.commitUrl ?? null);
      setMessage(
        `Записано в репозиторий: ${data.slug} · фото ${data.photoCount ?? 0}` +
          (data.skippedPhotos ? ` · пропущено ${data.skippedPhotos}` : ""),
      );
    } catch {
      setState("error");
      setMessage("Сеть недоступна");
    }
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <p className="text-sm font-semibold text-[var(--color-text)]">Репозиторий</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">
        Карточка хранится в <code>content/listings</code> и публикуется коммитом. Нажмите, чтобы
        записать текущую версию из кабинета в репозиторий (фото переедут файлами).
      </p>
      <button
        type="button"
        onClick={() => void run()}
        disabled={state === "busy"}
        className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {state === "busy" ? "Публикую…" : state === "done" ? "Опубликовано" : "Записать в репозиторий"}
      </button>
      {message ? (
        <p className={`mt-2 text-xs ${state === "error" ? "text-red-500" : "text-[var(--color-muted)]"}`}>
          {message}
          {commitUrl ? (
            <>
              {" · "}
              <a className="underline" href={commitUrl} target="_blank" rel="noreferrer">
                коммит
              </a>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}