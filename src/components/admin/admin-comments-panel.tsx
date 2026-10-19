"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { AdminComment, AdminCommentSubject } from "@/lib/admin-types";

export function AdminCommentsPanel({
  subject,
  title = "Notes & messages",
}: {
  subject: AdminCommentSubject;
  title?: string;
}) {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const q = new URLSearchParams({
      type: subject.type,
      id: subject.id,
    });
    const res = await fetch(`/api/admin/comments?${q}`);
    const data = (await res.json()) as { items?: AdminComment[] };
    setItems(data.items ?? []);
  }, [subject.id, subject.type]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    if (body.trim().length < 2) {
      setError("Write at least a short message.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Could not save message.");
      return;
    }
    setBody("");
    await load();
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
      <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
        {items.length === 0 ? (
          <li className="text-[var(--color-muted)]">No messages yet.</li>
        ) : (
          items.map((c) => (
            <li key={c.id} className="rounded-[var(--radius-md)] bg-[var(--color-mist)]/50 p-2">
              <p className="text-xs text-[var(--color-muted)]">
                {c.authorName} · {new Date(c.createdAt).toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
            </li>
          ))
        )}
      </ul>
      <Textarea
        className="mt-3"
        rows={3}
        value={body}
        placeholder="Comment for this record…"
        onChange={(e) => setBody(e.target.value)}
      />
      {error ? <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p> : null}
      <Button type="button" className="mt-2" size="sm" disabled={busy} onClick={() => void submit()}>
        {busy ? "Saving…" : "Post message"}
      </Button>
    </div>
  );
}
