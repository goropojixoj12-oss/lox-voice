"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import type { Property } from "@/lib/types";

export function AdminListingModerationForm({ listing }: { listing: Property }) {
  const router = useRouter();
  const [title, setTitle] = useState(listing.title);
  const [summary, setSummary] = useState(listing.summary);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(String(listing.price));
  const [currency, setCurrency] = useState(listing.currency);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function submit(action: "save" | "publish" | "reject") {
    setLoading(action);
    setError("");
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        title,
        summary,
        description,
        price: Number(price),
        currency,
      }),
    });
    setLoading(null);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not update listing");
      return;
    }
    router.push("/dashboard/agent/admin/listings");
    router.refresh();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit("save");
      }}
    >
      <p className="text-sm text-[var(--color-muted)]">
        Status: <strong className="text-[var(--color-text)]">{listing.status}</strong> ·{" "}
        {listing.location.city}, {listing.location.country}
      </p>

      <div>
        <Label htmlFor="mod-title">Title</Label>
        <Input id="mod-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="mod-summary">Summary</Label>
        <Input id="mod-summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="mod-description">Description</Label>
        <Textarea
          id="mod-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="mod-price">Price</Label>
          <Input id="mod-price" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="mod-currency">Currency</Label>
          <Input id="mod-currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" variant="outline" disabled={loading != null}>
          {loading === "save" ? "Saving…" : "Save edits (stay pending)"}
        </Button>
        <Button type="button" disabled={loading != null} onClick={() => void submit("publish")}>
          {loading === "publish" ? "Publishing…" : "Approve & publish"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={loading != null}
          onClick={() => void submit("reject")}
        >
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </form>
  );
}
