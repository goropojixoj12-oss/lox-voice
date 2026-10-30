"use client";

import { nanoid } from "nanoid";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { DocAccessLevel, ListingDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACCESS_LABELS: Record<DocAccessLevel, string> = {
  admin_only: "Admin only",
  staff: "All staff",
  public: "Public download",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListingDocumentsPanel({
  documents,
  onChange,
  currentUserId,
  currentUserName,
  currentUserRole,
  listingId,
}: {
  documents: ListingDocument[];
  onChange: (docs: ListingDocument[]) => void;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: "admin" | "agent";
  listingId: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [customName, setCustomName] = useState("");
  const [access, setAccess] = useState<DocAccessLevel>(
    currentUserRole === "admin" ? "staff" : "staff",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const visibleDocs = documents.filter((d) => {
    if (currentUserRole === "admin") return true;
    if (d.access === "public" || d.access === "staff") return true;
    return d.uploadedById === currentUserId;
  });

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");

    try {
      const body = new FormData();
      body.set("file", file);
      body.set("listingId", listingId);
      body.set("customName", customName.trim() || file.name);
      body.set("access", currentUserRole === "admin" ? access : "staff");

      const res = await fetch("/api/admin/listings/documents", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as { error?: string; document?: ListingDocument };
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      if (data.document) {
        onChange([data.document, ...documents]);
      }
      setCustomName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function removeDoc(id: string) {
    onChange(documents.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Documents</p>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1">
            <Label className="text-xs">Custom document name</Label>
            <Input
              className="mt-1"
              placeholder="e.g. Title Deed, Floor Plan…"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>
          {currentUserRole === "admin" ? (
            <div>
              <Label className="text-xs">Access</Label>
              <select
                className="mt-1 block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
                value={access}
                onChange={(e) => setAccess(e.target.value as DocAccessLevel)}
              >
                <option value="admin_only">Admin only</option>
                <option value="staff">All staff</option>
                <option value="public">Public download</option>
              </select>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            className="block text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-accent)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[#0B1C33] hover:file:opacity-90"
          />
          <Button type="button" size="sm" onClick={() => void handleUpload()} disabled={busy}>
            {busy ? "Uploading…" : "Upload"}
          </Button>
        </div>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
      </div>

      {visibleDocs.length > 0 ? (
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {visibleDocs.map((doc) => (
            <li
              key={doc.id}
              className={cn(
                "flex items-center justify-between gap-2 rounded-[var(--radius-md)] border p-3 text-sm",
                doc.access === "admin_only"
                  ? "border-red-300 bg-red-50"
                  : doc.access === "staff"
                    ? "border-blue-300 bg-blue-50"
                    : "border-[var(--color-border)] bg-[var(--color-surface)]",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{doc.name}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {formatSize(doc.size)} · {doc.uploadedByName} ·{" "}
                  {ACCESS_LABELS[doc.access]}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-[#0B1C33]"
                >
                  Download
                </a>
                {(currentUserRole === "admin" || doc.uploadedById === currentUserId) ? (
                  <button
                    type="button"
                    className="text-xs text-red-500 hover:underline"
                    onClick={() => removeDoc(doc.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">No documents attached.</p>
      )}
    </div>
  );
}
