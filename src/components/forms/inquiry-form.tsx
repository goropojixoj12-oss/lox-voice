"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  contact: z
    .string()
    .min(5, "Provide an email or phone")
    .refine(
      (v) => /@/.test(v) || /[\d+]{8,}/.test(v.replace(/[\s()-]/g, "")),
      "Enter a valid email or phone number",
    ),
  message: z.string().min(10, "Message should be at least 10 characters"),
  consent: z.literal(true, { error: "Consent is required" }),
});

export function InquiryForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inquiryId, setInquiryId] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrors({});
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      contact: String(form.get("contact") ?? ""),
      message: String(form.get("message") ?? ""),
      website: String(form.get("website") ?? ""),
      consent: form.get("consent") === "on",
      propertyId,
      propertyTitle,
    };
    const parsed = schema.safeParse({
      name: payload.name,
      contact: payload.contact,
      message: payload.message,
      consent: payload.consent ? true : undefined,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      setStatus("idle");
      return;
    }

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, consent: true }),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    const data = (await res.json()) as { inquiry?: { id?: string } };
    setInquiryId(data.inquiry?.id ?? null);
    setStatus("success");
    e.currentTarget.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      noValidate
    >
      <div>
        <h3 className="font-semibold text-[var(--color-accent-soft)]">Request information</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Send a viewing or details request. No phone numbers are invented on this page.
        </p>
      </div>
      <div>
        <Label htmlFor="inquiry-name">Name</Label>
        <Input id="inquiry-name" name="name" autoComplete="name" required />
        {errors.name ? <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.name}</p> : null}
      </div>
      <div>
        <Label htmlFor="inquiry-contact">Email or phone</Label>
        <Input
          id="inquiry-contact"
          name="contact"
          autoComplete="tel"
          inputMode="email"
          placeholder="name@email.com or +855…"
          required
        />
        {errors.contact ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.contact}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="inquiry-message">Message</Label>
        <Textarea
          id="inquiry-message"
          name="message"
          defaultValue={`I am interested in ${propertyTitle}. Please share next steps for a viewing.`}
          required
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.message}</p>
        ) : null}
      </div>
      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <Label htmlFor="inquiry-website">Website</Label>
        <Input id="inquiry-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex items-start gap-2">
        <input
          id="inquiry-consent"
          name="consent"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 accent-[var(--color-accent)]"
        />
        <Label htmlFor="inquiry-consent" className="mb-0 text-xs font-normal leading-relaxed text-[var(--color-muted)]">
          I agree to the processing of my personal data as described in the{" "}
          <Link href="/privacy" className="font-semibold text-[var(--color-accent-soft)] underline">
            Privacy policy
          </Link>
          .
        </Label>
      </div>
      {errors.consent ? (
        <p className="text-xs text-[var(--color-danger)]">{errors.consent}</p>
      ) : null}
      <Button type="submit" className="w-full min-h-11" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send inquiry"}
      </Button>
      {status === "success" ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          Inquiry sent{inquiryId ? ` (ref ${inquiryId})` : ""}. Our team will respond using the
          contact details you provided.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          Could not send inquiry. Please try again.
        </p>
      ) : null}
    </form>
  );
}
