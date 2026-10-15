"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminImportClient() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const form = new FormData(e.currentTarget);
    const photosRaw = String(form.get("photos") ?? "").trim();
    const payload = {
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      price: form.get("price") ? Number(form.get("price")) : null,
      currency: String(form.get("currency") || "USD"),
      location: String(form.get("location") || "") || null,
      propertyType: String(form.get("propertyType") || "") || null,
      photos: photosRaw
        ? photosRaw
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      sourceName: String(form.get("sourceName") ?? ""),
      sourceUrl: String(form.get("sourceUrl") || "") || null,
      contacts: {
        phone: String(form.get("phone") || "") || undefined,
        email: String(form.get("email") || "") || undefined,
        messenger: String(form.get("messenger") || "") || undefined,
      },
      externalId: String(form.get("externalId") || "") || undefined,
    };

    try {
      const res = await fetch("/api/aggregations/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        created?: boolean;
        listing?: { id: string };
      };
      if (!res.ok) {
        setStatus(data.error ?? `Import failed (${res.status})`);
        return;
      }
      setStatus(data.created ? "Created new listing" : "Updated existing listing");
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setStatus("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Title *</span>
        <Input name="title" required minLength={4} placeholder="2BR condo in BKK1" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Source name *</span>
        <Input name="sourceName" required placeholder="Facebook Group / Telegram / portal" />
      </label>
      <label className="grid gap-1.5 text-sm md:col-span-2">
        <span className="text-[var(--color-muted)]">Description *</span>
        <textarea
          name="description"
          required
          minLength={8}
          rows={4}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          placeholder="Paste the listing text (contacts go in fields below, not here if you want them admin-only structured)"
        />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Price</span>
        <Input name="price" type="number" min={0} step={1} placeholder="150000" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Currency</span>
        <Input name="currency" defaultValue="USD" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Location</span>
        <Input name="location" placeholder="Phnom Penh, BKK1" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Property type</span>
        <select
          name="propertyType"
          className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm"
          defaultValue=""
        >
          <option value="">—</option>
          {[
            "apartment",
            "condo",
            "house",
            "villa",
            "townhouse",
            "commercial",
            "office",
            "retail",
            "warehouse",
            "land",
            "project_unit",
          ].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Source URL</span>
        <Input name="sourceUrl" type="url" placeholder="https://…" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">External ID (optional)</span>
        <Input name="externalId" placeholder="fb:group:post:123" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Phone</span>
        <Input name="phone" placeholder="+855 …" />
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="text-[var(--color-muted)]">Email</span>
        <Input name="email" type="email" />
      </label>
      <label className="grid gap-1.5 text-sm md:col-span-2">
        <span className="text-[var(--color-muted)]">Messenger / Telegram / FB</span>
        <Input name="messenger" placeholder="@handle or chat link" />
      </label>
      <label className="grid gap-1.5 text-sm md:col-span-2">
        <span className="text-[var(--color-muted)]">Photo URLs (one per line)</span>
        <textarea
          name="photos"
          rows={3}
          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          placeholder="/media/photos/….jpg or https://…"
        />
      </label>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" disabled={busy}>
          {busy ? "Saving…" : "Import listing"}
        </Button>
        {status ? <span className="text-sm text-[var(--color-muted)]">{status}</span> : null}
      </div>
    </form>
  );
}
