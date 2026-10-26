"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminOpenAgentDeskButton({
  userId,
  label = "Open agent desk",
  variant = "primary",
}: {
  userId: string;
  label?: string;
  variant?: "primary" | "outline";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function openDesk() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/manage-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "start" }),
    });
    const data = (await res.json().catch(() => ({}))) as { redirect?: string; error?: string };
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not open agent desk");
      return;
    }
    router.push(data.redirect ?? "/dashboard/agent/overview");
    router.refresh();
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Button type="button" variant={variant} size="sm" disabled={busy} onClick={() => void openDesk()}>
        {busy ? "Opening…" : label}
      </Button>
      {error ? <span className="text-xs text-[var(--color-danger)]">{error}</span> : null}
    </div>
  );
}
