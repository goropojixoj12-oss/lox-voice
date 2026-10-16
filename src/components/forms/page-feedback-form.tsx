"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type PageFeedbackFormProps = {
  formId: string;
  inquiryPropertyId: string;
  inquiryPropertyTitle: string;
};

export function PageFeedbackForm({
  formId,
  inquiryPropertyId,
  inquiryPropertyTitle,
}: PageFeedbackFormProps) {
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
        propertyId: inquiryPropertyId,
        propertyTitle: inquiryPropertyTitle,
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
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input id={`${formId}-name`} name="name" autoComplete="name" required minLength={2} />
      </div>
      <div>
        <Label htmlFor={`${formId}-contact`}>Phone or email</Label>
        <Input
          id={`${formId}-contact`}
          name="contact"
          autoComplete="tel"
          placeholder="+855 12 345 678 or name@email.com"
          required
          minLength={5}
        />
      </div>
      <div>
        <Label htmlFor={`${formId}-message`}>Message</Label>
        <Textarea id={`${formId}-message`} name="message" required minLength={10} rows={5} />
      </div>
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <Label htmlFor={`${formId}-website`}>Website</Label>
        <Input id={`${formId}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex items-start gap-2">
        <input
          id={`${formId}-consent`}
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
        />
        <Label
          htmlFor={`${formId}-consent`}
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
      <Button type="submit" variant="accent" className="min-h-11" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>
      {status === "ok" ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          Message received. We will get back to you shortly.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          Could not send. Try again shortly.
        </p>
      ) : null}
    </form>
  );
}
