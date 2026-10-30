"use client";

import { nanoid } from "nanoid";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { ListingNote, NoteVisibility } from "@/lib/types";
import { cn } from "@/lib/utils";

const VISIBILITY_LABELS: Record<NoteVisibility, string> = {
  admin_only: "Admin only",
  staff: "All staff",
  public: "Public",
};

export function ListingNotesPanel({
  notes,
  onChange,
  currentUserId,
  currentUserName,
  currentUserRole,
}: {
  notes: ListingNote[];
  onChange: (notes: ListingNote[]) => void;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: "admin" | "agent";
}) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>(
    currentUserRole === "admin" ? "admin_only" : "staff",
  );

  const visibleNotes = notes.filter((n) => {
    if (currentUserRole === "admin") return true;
    if (n.visibility === "public" || n.visibility === "staff") return true;
    return n.authorId === currentUserId;
  });

  function addNote() {
    if (!text.trim()) return;
    const note: ListingNote = {
      id: nanoid(8),
      text: text.trim(),
      authorId: currentUserId,
      authorName: currentUserName,
      visibility: currentUserRole === "agent" ? "staff" : visibility,
      createdAt: new Date().toISOString(),
    };
    onChange([note, ...notes]);
    setText("");
  }

  function removeNote(id: string) {
    onChange(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Internal notes</p>
      <div className="space-y-2">
        <textarea
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
          rows={3}
          placeholder="Add a note visible only inside the system…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap items-end gap-3">
          {currentUserRole === "admin" ? (
            <div>
              <Label className="text-xs">Visible to</Label>
              <select
                className="mt-1 block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as NoteVisibility)}
              >
                <option value="admin_only">Admin only</option>
                <option value="staff">All staff</option>
                <option value="public">Public (visible on listing page)</option>
              </select>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-muted)]">
              Your notes are visible to admin by default.
            </p>
          )}
          <Button type="button" size="sm" onClick={addNote} disabled={!text.trim()}>
            Add note
          </Button>
        </div>
      </div>

      {visibleNotes.length > 0 ? (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {visibleNotes.map((note) => (
            <li
              key={note.id}
              className={cn(
                "rounded-[var(--radius-md)] border p-3 text-sm",
                note.visibility === "admin_only"
                  ? "border-red-300 bg-red-50"
                  : note.visibility === "staff"
                    ? "border-blue-300 bg-blue-50"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="whitespace-pre-wrap">{note.text}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {note.authorName} ·{" "}
                    {new Date(note.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ·{" "}
                    <span className="font-medium">
                      {VISIBILITY_LABELS[note.visibility]}
                    </span>
                  </p>
                </div>
                {(currentUserRole === "admin" || note.authorId === currentUserId) ? (
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => removeNote(note.id)}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">No notes yet.</p>
      )}
    </div>
  );
}
