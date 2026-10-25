"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type AttachmentMeta = {
  fileName: string;
  storageKey: string;
};

type SiteRequestItem = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  attachment: AttachmentMeta | null;
  agentNote?: string;
  commitUrl?: string;
};

const STATUS_LABEL: Record<string, string> = {
  queued: "Queued",
  in_progress: "In progress",
  done: "Done",
  failed: "Failed",
};

export function SiteChangeComposer() {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<SiteRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/site-requests");
    if (!res.ok) return;
    const data = (await res.json()) as { items: SiteRequestItem[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSent(false);

    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError("Describe the change in at least a few words.");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.set("message", trimmed);
      if (file) form.set("file", file);
      const res = await fetch("/api/admin/site-requests", {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });

      let data: { error?: string } = {};
      try {
        data = (await res.json()) as { error?: string };
      } catch {
        setError(
          res.ok
            ? "Unexpected response from the server."
            : `Could not send (server error ${res.status}).`,
        );
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Could not send.");
        return;
      }

      setMessage("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSent(true);
      await refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={onSubmit}
        className="seaps-card space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5"
      >
        <label className="block">
          <span className="sr-only">Change request</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Describe the UI or signed-in experience change you want…"
            className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? file.name : "Attach screenshot (optional)"}
          </label>
          {file ? (
            <button
              type="button"
              className="text-sm text-[var(--color-muted)] underline"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Remove file
            </button>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {sent ? (
          <p className="text-sm text-[var(--color-accent-soft)]">Sent — your request is in the queue.</p>
        ) : null}

        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Sending…" : "Send"}
        </Button>

        <p className="text-xs text-[var(--color-muted)]">
          Scope: public site interface and logged-in user flows only (not servers, billing, or staff HR).
        </p>
      </form>

      {items.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Recent requests
          </h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{STATUS_LABEL[item.status] ?? item.status}</span>
                  <time className="text-xs text-[var(--color-muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[var(--color-text)]">{item.message}</p>
                {item.attachment ? (
                  <img
                    src={`/api/admin/site-requests/file?key=${encodeURIComponent(item.attachment.storageKey)}`}
                    alt={item.attachment.fileName}
                    className="mt-3 max-h-40 rounded border border-[var(--color-border)] object-contain"
                  />
                ) : null}
                {item.commitUrl ? (
                  <p className="mt-2">
                    <a href={item.commitUrl} className="text-[var(--color-accent)] underline" target="_blank" rel="noreferrer">
                      Deploy / commit
                    </a>
                  </p>
                ) : null}
                {item.agentNote ? (
                  <p className="mt-2 text-[var(--color-muted)]">{item.agentNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
