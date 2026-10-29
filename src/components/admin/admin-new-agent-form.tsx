"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function AdminNewAgentForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const res = await fetch("/api/admin/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = (await res.json()) as { error?: string; user?: { id: string } };
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not register agent.");
      return;
    }

    if (data.user?.id) {
      router.push(adminDeskPath("staff"));
      router.refresh();
      return;
    }

    router.push(adminDeskPath("staff"));
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mx-auto max-w-md space-y-5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
    >
      <div>
        <Label htmlFor="agent-email">Email</Label>
        <Input
          id="agent-email"
          type="email"
          autoComplete="off"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="agent-password">Password</Label>
        <Input
          id="agent-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-[var(--color-muted)]">At least 6 characters.</p>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Registering…" : "Register agent"}
        </Button>
        <Link
          href={adminDeskPath("staff")}
          className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-mist)]"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
