"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import type { Inquiry } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReplyModalProps = {
  inquiry: Inquiry | null;
  onClose: () => void;
  onSent: () => void;
};

export function InquiryReplyModal({ inquiry, onClose, onSent }: ReplyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const open = Boolean(inquiry);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setReply("");
      setError("");
      setSending(false);
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  if (!inquiry) return null;

  async function onSend() {
    const current = inquiry;
    if (!current || sending) return;
    if (reply.trim().length < 3) {
      setError("Write a reply first — at least a few characters.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${current.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send the reply.");
        return;
      }
      handleClose();
      onSent();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={cn(
        "seaps-contact-dialog fixed inset-0 z-[100] m-0 h-dvh max-h-none w-full max-w-none",
        "border-0 bg-transparent p-4 backdrop:bg-[rgba(7,17,31,0.72)] backdrop:backdrop-blur-sm",
      )}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
    >
      <div
        className="seaps-card mx-auto mt-[min(6vh,3rem)] max-h-[min(92dvh,52rem)] w-full max-w-xl overflow-y-auto rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-lift)] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              Reply to inquiry
            </p>
            <h2
              id={titleId}
              className="mt-1 truncate font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]"
            >
              {inquiry.propertyTitle}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              From: <span className="text-[var(--color-text)]">{inquiry.name}</span> ·{" "}
              {inquiry.contact}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-soft)]"
            aria-label="Close reply form"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-mist)]/40 p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--color-muted)]">Incoming message</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{inquiry.message}</p>
        </div>

        <div className="mt-5">
          <Label htmlFor="seaps-inquiry-reply">Your reply</Label>
          <Textarea
            id="seaps-inquiry-reply"
            rows={6}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply to the client…"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "seaps-inquiry-reply-error" : undefined}
          />
          {error ? (
            <p id="seaps-inquiry-reply-error" className="mt-1 text-sm text-[var(--color-danger)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="button" variant="accent" onClick={onSend} disabled={sending}>
            {sending ? "Sending…" : "Send reply by email"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
