"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { brand } from "@/config/brand";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    if (String(form.get("website") ?? "").trim()) {
      setStatus("ok");
      e.currentTarget.reset();
      return;
    }
    if (form.get("consent") !== "on") {
      setError("Please accept the privacy policy to continue.");
      setStatus("idle");
      return;
    }
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        contact: form.get("contact"),
        message: form.get("message"),
        website: form.get("website") ?? "",
        consent: true,
        propertyId: "contact-page",
        propertyTitle: "General contact",
      }),
    });
    if (res.ok) {
      setStatus("ok");
      e.currentTarget.reset();
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Contact
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Send a message to the SEAPS team. We respond using the contact details you provide. Or email{" "}
        <a
          href={`mailto:${brand.supportEmail}`}
          className="font-semibold text-[var(--color-accent-soft)] underline"
        >
          {brand.supportEmail}
        </a>
        .
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3" noValidate>
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="contact-email">Email or phone</Label>
          <Input
            id="contact-email"
            name="contact"
            autoComplete="email"
            placeholder="name@email.com or +855…"
            required
          />
        </div>
        <div>
          <Label htmlFor="contact-message">Message</Label>
          <Textarea id="contact-message" name="message" required minLength={10} />
        </div>
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <Label htmlFor="contact-website">Website</Label>
          <Input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="flex items-start gap-2">
          <input
            id="contact-consent"
            name="consent"
            type="checkbox"
            required
            className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
          />
          <Label
            htmlFor="contact-consent"
            className="mb-0 text-xs font-normal leading-relaxed text-[var(--color-muted)]"
          >
            I agree to the processing of my personal data as described in the{" "}
            <Link href="/privacy" className="font-semibold text-[var(--color-accent-soft)] underline">
              Privacy policy
            </Link>
            .
          </Label>
        </div>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <Button type="submit" className="min-h-11" disabled={status === "loading"}>
          {status === "loading" ? "Sending…" : "Send message"}
        </Button>
      </form>
      {status === "ok" ? (
        <p className="mt-3 text-sm text-[var(--color-success)]" role="status">
          Message received. We will get back to you shortly.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="mt-3 text-sm text-[var(--color-danger)]" role="alert">
          Could not send. Try again shortly.
        </p>
      ) : null}
    </div>
  );
}
