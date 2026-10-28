"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteChangeCriticalBanner } from "@/components/admin/site-change-critical-banner";
import { Button } from "@/components/ui/button";
import {
  SEAPS_EQUALS_SCREENSHOT_ATTACH_EVENT,
  stripTrailingEqualsCommand,
} from "@/lib/seaps-equals-screenshot-shortcut";
import { resolveLatestScreenshotFile } from "@/lib/site-change-screenshot-access";
import {
  clearSiteChangeDraft,
  loadSiteChangeDraft,
  saveSiteChangeDraft,
} from "@/lib/site-change-draft";
import { assessSiteChangeMessage } from "@/lib/site-change-risk";

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
  secondAttachment?: AttachmentMeta | null;
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
  const [file2, setFile2] = useState<File | null>(null);
  const [items, setItems] = useState<SiteRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchNote, setDispatchNote] = useState<string | null>(null);
  const [attachNote, setAttachNote] = useState<string | null>(null);
  const [draftReady, setDraftReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const file2InputRef = useRef<HTMLInputElement>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [attachment2PreviewUrl, setAttachment2PreviewUrl] = useState<string | null>(null);
  const attachInFlightRef = useRef(false);

  const risk = useMemo(() => assessSiteChangeMessage(message), [message]);

  const applyAttachment = useCallback((next: File | null) => {
    setFile(next);
  }, []);

  const attachLatestScreenshot = useCallback(async () => {
    if (attachInFlightRef.current) return;
    attachInFlightRef.current = true;
    setAttachNote(null);
    try {
      const result = await resolveLatestScreenshotFile();
      if (result.ok) {
        applyAttachment(result.file);
        setAttachNote(`Attached latest screenshot: ${result.file.name}`);
        return;
      }

      const fallbackMessages: Record<typeof result.reason, string> = {
        unsupported:
          "Your browser cannot read a screenshot folder automatically. Choose the file below.",
        denied: "Screenshot folder access was denied. Choose the file below.",
        empty: "No images found in the selected folder. Choose a file below.",
        picker_cancelled: "Screenshot folder not selected. Choose a file below if needed.",
      };
      setAttachNote(fallbackMessages[result.reason]);
      fileInputRef.current?.click();
    } finally {
      attachInFlightRef.current = false;
    }
  }, [applyAttachment]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setAttachmentPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(file);
    setAttachmentPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file2 || !file2.type.startsWith("image/")) {
      setAttachment2PreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const url = URL.createObjectURL(file2);
    setAttachment2PreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    return () => URL.revokeObjectURL(url);
  }, [file2]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const draft = await loadSiteChangeDraft();
      if (cancelled) return;
      if (draft) {
        setMessage(draft.message);
        setFile(draft.file);
        setFile2(draft.file2 ?? null);
      }
      setDraftReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    void saveSiteChangeDraft(message, file, file2);
  }, [draftReady, message, file, file2]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/site-requests");
    if (!res.ok) return;
    const data = (await res.json()) as { items: SiteRequestItem[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onEqualsAttach = () => {
      setMessage((prev) => stripTrailingEqualsCommand(prev));
      void attachLatestScreenshot();
    };
    window.addEventListener(SEAPS_EQUALS_SCREENSHOT_ATTACH_EVENT, onEqualsAttach);
    return () => {
      window.removeEventListener(SEAPS_EQUALS_SCREENSHOT_ATTACH_EVENT, onEqualsAttach);
    };
  }, [attachLatestScreenshot]);

  async function dispatchToAgent(id?: string) {
    setDispatchNote(null);
    setDispatchingId(id ?? "oldest");
    try {
      const res = await fetch("/api/admin/site-requests/dispatch", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { id } : {}),
      });
      const data = (await res.json()) as {
        error?: string;
        ok?: boolean;
        bearerConfigured?: boolean;
        dispatched?: string;
      };
      if (!res.ok) {
        setDispatchNote(data.error ?? "Could not dispatch.");
        return;
      }
      const bearerHint = data.bearerConfigured ? "" : " Warning: SITE_AGENT_WEBHOOK_BEARER missing on server.";
      setDispatchNote(`Agent webhook sent for request ${data.dispatched}.${bearerHint}`);
      await refresh();
    } catch {
      setDispatchNote("Network error while dispatching.");
    } finally {
      setDispatchingId(null);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSent(false);

    const trimmed = message.trim();
    if (trimmed.length < 3) {
      setError("Describe the change in at least a few words.");
      return;
    }

    const submitRisk = assessSiteChangeMessage(trimmed);
    if (submitRisk.level === "critical") {
      const ok = window.confirm(
        "This request may change critical project settings (hosting, secrets, Git, or security).\n\nSend anyway? For infrastructure work, a developer should review first.",
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      form.set("message", trimmed);
      if (file) form.set("file", file);
      if (file2) form.set("file2", file2);
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

      await clearSiteChangeDraft();
      setMessage("");
      applyAttachment(null);
      setFile2(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (file2InputRef.current) file2InputRef.current.value = "";
      setAttachNote(null);
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
        data-seaps-site-change-composer
        onSubmit={onSubmit}
        className="seaps-card space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5"
      >
        <label className="block">
          <span className="sr-only">Change request</span>
          <textarea
            data-seaps-equals-controlled
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            placeholder="Describe the UI or signed-in experience change you want…"
            className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-[var(--color-accent)]"
          />
        </label>

        <SiteChangeCriticalBanner risk={risk} />

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                applyAttachment(e.target.files?.[0] ?? null);
                setAttachNote(null);
              }}
            />
            {file ? file.name : "Attachment (As Required)"}
          </label>
          <label className="inline-flex cursor-pointer items-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)]">
            <input
              ref={file2InputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => {
                setFile2(e.target.files?.[0] ?? null);
                setAttachNote(null);
              }}
            />
            {file2 ? file2.name : "Second Attachment"}
          </label>
          {file ? (
            <button
              type="button"
              className="text-sm text-[var(--color-muted)] underline"
              onClick={() => {
                applyAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setAttachNote(null);
              }}
            >
              Remove Attachment
            </button>
          ) : null}
          {file2 ? (
            <button
              type="button"
              className="text-sm text-[var(--color-muted)] underline"
              onClick={() => {
                setFile2(null);
                if (file2InputRef.current) file2InputRef.current.value = "";
                setAttachNote(null);
              }}
            >
              Remove second file
            </button>
          ) : null}
        </div>

        {file && attachmentPreviewUrl ? (
          <img
            src={attachmentPreviewUrl}
            alt={file.name}
            className="max-h-40 rounded border border-[var(--color-border)] object-contain"
          />
        ) : null}
        {file2 && attachment2PreviewUrl ? (
          <img
            src={attachment2PreviewUrl}
            alt={file2.name}
            className="max-h-40 rounded border border-[var(--color-border)] object-contain"
          />
        ) : null}

        {attachNote ? <p className="text-sm text-[var(--color-muted)]">{attachNote}</p> : null}
        <p className="text-xs text-[var(--color-muted)]">
          Tip: type ===== within 5 seconds in any text field to attach your latest screenshot (authorize
          your screenshots folder once)
          (or open the file picker when the browser requires it).
        </p>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message.trim().length > 0 && message.trim().length < 3 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Add a bit more detail so we can action your request (at least a few words).
          </p>
        ) : null}
        {sent ? (
          <p className="text-sm text-[var(--color-accent-soft)]">Sent — your request is in the queue.</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Sending…" : "Send"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={dispatchingId !== null}
            onClick={() => void dispatchToAgent()}
          >
            {dispatchingId === "oldest" ? "Dispatching…" : "Run agent (oldest queued)"}
          </Button>
        </div>
        {dispatchNote ? <p className="text-sm text-[var(--color-muted)]">{dispatchNote}</p> : null}

        <p className="text-xs text-[var(--color-muted)]">
          Scope: Public Site Interface (Not Servers, Billing or Staff)
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
                {item.status === "queued" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    disabled={dispatchingId === item.id}
                    onClick={() => void dispatchToAgent(item.id)}
                  >
                    {dispatchingId === item.id ? "Dispatching…" : "Run agent for this request"}
                  </Button>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-[var(--color-text)]">{item.message}</p>
                {item.attachment ? (
                  <img
                    src={`/api/admin/site-requests/file?key=${encodeURIComponent(item.attachment.storageKey)}`}
                    alt={item.attachment.fileName}
                    className="mt-3 max-h-40 rounded border border-[var(--color-border)] object-contain"
                  />
                ) : null}
                {item.secondAttachment ? (
                  <img
                    src={`/api/admin/site-requests/file?key=${encodeURIComponent(item.secondAttachment.storageKey)}`}
                    alt={item.secondAttachment.fileName}
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
