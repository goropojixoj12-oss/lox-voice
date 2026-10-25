"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { brand } from "@/config/brand";
import { submitSiteForm } from "@/lib/submit-site-form";

const FORM_CATEGORY = "Contact page";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  message: z.string().trim().min(10, "Message should be at least 10 characters"),
});

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    setFieldErrors({});
    const form = e.currentTarget;
    const formData = new FormData(form);
    if (String(formData.get("website") ?? "").trim()) {
      setStatus("ok");
      form.reset();
      return;
    }
    if (formData.get("consent") !== "on") {
      setError("Please accept the privacy policy to continue.");
      setStatus("idle");
      return;
    }

    const parsed = schema.safeParse({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setFieldErrors(next);
      setStatus("idle");
      return;
    }

    const result = await submitSiteForm(form);
    if (result.ok) {
      setStatus("ok");
      form.reset();
    } else {
      if (result.issues?.length) {
        const next: Record<string, string> = {};
        result.issues.forEach((issue) => {
          next[String(issue.path[0])] = issue.message;
        });
        setFieldErrors(next);
      }
      setError(result.error);
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
      <form
        onSubmit={onSubmit}
        className="mt-6 space-y-3"
        noValidate
        data-form-category={FORM_CATEGORY}
      >
        <input type="hidden" name="category" value={FORM_CATEGORY} />
        <input type="hidden" name="propertyId" value="contact-page" />
        <input type="hidden" name="propertyTitle" value="General contact" />
        <div>
          <Label htmlFor="contact-name">Name</Label>
          <Input id="contact-name" name="name" autoComplete="name" required />
          {fieldErrors.name ? (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@email.com"
            required
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone (optional)</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+855 12 345 678"
          />
        </div>
        <div>
          <Label htmlFor="contact-message">Message</Label>
          <Textarea id="contact-message" name="message" required minLength={10} />
          {fieldErrors.message ? (
            <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.message}</p>
          ) : null}
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
