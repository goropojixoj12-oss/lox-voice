"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { submitSiteForm } from "@/lib/submit-site-form";

type PageFeedbackFormProps = {
  formId: string;
  inquiryPropertyId: string;
  inquiryPropertyTitle: string;
  /** Email subject line; defaults to inquiryPropertyTitle */
  formCategory?: string;
};

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  message: z.string().trim().min(10, "Message should be at least 10 characters"),
});

export function PageFeedbackForm({
  formId,
  inquiryPropertyId,
  inquiryPropertyTitle,
  formCategory,
}: PageFeedbackFormProps) {
  const category = formCategory ?? inquiryPropertyTitle;
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
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      noValidate
      data-form-category={category}
    >
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="propertyId" value={inquiryPropertyId} />
      <input type="hidden" name="propertyTitle" value={inquiryPropertyTitle} />
      <div>
        <Label htmlFor={`${formId}-name`}>Name</Label>
        <Input id={`${formId}-name`} name="name" autoComplete="name" required minLength={2} />
        {fieldErrors.name ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.name}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor={`${formId}-email`}>Email</Label>
        <Input
          id={`${formId}-email`}
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
        <Label htmlFor={`${formId}-phone`}>Phone (optional)</Label>
        <Input
          id={`${formId}-phone`}
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+855 12 345 678"
        />
      </div>
      <div>
        <Label htmlFor={`${formId}-message`}>Message</Label>
        <Textarea id={`${formId}-message`} name="message" required minLength={10} rows={5} />
        {fieldErrors.message ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{fieldErrors.message}</p>
        ) : null}
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
