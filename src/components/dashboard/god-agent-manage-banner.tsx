"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminDeskPath } from "@/lib/dashboard-admin-paths";
import { Button } from "@/components/ui/button";

export function GodAgentManageBanner({ agentName }: { agentName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function exitDesk() {
    setBusy(true);
    await fetch("/api/admin/manage-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop" }),
    });
    router.push(adminDeskPath("staff"));
    router.refresh();
  }

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[rgba(212,175,55,0.45)] bg-[var(--color-mist)]/80 px-4 py-3 text-sm">
      <p>
        <span className="font-semibold text-[var(--color-accent-soft)]">God mode</span> — editing{" "}
        <span className="font-semibold">{agentName}</span>&apos;s agent desk (profile, listings,
        documents, and uploads).
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={adminDeskPath("staff")}
          className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-accent)]"
        >
          Admin staff list
        </Link>
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void exitDesk()}>
          {busy ? "Leaving…" : "Exit agent desk"}
        </Button>
      </div>
    </div>
  );
}
