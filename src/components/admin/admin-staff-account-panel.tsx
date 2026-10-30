"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AdminStaffAccountPanel({
  userId,
  name,
  email,
  suspended,
}: {
  userId: string;
  name: string;
  email: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [editName, setEditName] = useState(name);
  const [editEmail, setEditEmail] = useState(email);
  const [editPassword, setEditPassword] = useState("");
  const [isSuspended, setIsSuspended] = useState(suspended);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(fields: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/admin/agents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...fields }),
    });
    const data = (await res.json()) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to update.");
      return false;
    }
    setMessage("Saved.");
    router.refresh();
    return true;
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const fields: Record<string, string> = {};
    if (editName.trim() !== name) fields.name = editName.trim();
    if (editEmail.trim() !== email) fields.email = editEmail.trim();
    if (editPassword.length > 0) fields.password = editPassword;
    if (Object.keys(fields).length === 0) {
      setMessage("No changes.");
      return;
    }
    const ok = await save(fields);
    if (ok) setEditPassword("");
  }

  async function toggleSuspend() {
    const next = !isSuspended;
    const ok = await save({ suspended: next });
    if (ok) setIsSuspended(next);
  }

  return (
    <div className="space-y-4">
      <div className="seaps-card rounded-[var(--radius-lg)] p-4">
        <p className="text-sm font-semibold">Account management</p>

        <form onSubmit={(e) => void handleSaveProfile(e)} className="mt-4 space-y-3">
          <div>
            <Label htmlFor="staff-name">Full name</Label>
            <Input
              id="staff-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="staff-password">New password (leave blank to keep current)</Label>
            <Input
              id="staff-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save profile changes"}
          </Button>
        </form>

        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <p className="text-xs text-[var(--color-muted)]">
            {isSuspended
              ? "This account is SUSPENDED. The employee cannot sign in."
              : "This account is active. The employee can sign in and work."}
          </p>
          <Button
            type="button"
            variant={isSuspended ? "primary" : "outline"}
            className={isSuspended ? "" : "border-red-500 text-red-500 hover:bg-red-50"}
            disabled={busy}
            onClick={() => void toggleSuspend()}
          >
            {busy
              ? "Processing…"
              : isSuspended
                ? "Unblock account"
                : "Block account"}
          </Button>
        </div>

        {error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-2 text-sm text-green-600">{message}</p>
        ) : null}
      </div>
    </div>
  );
}
