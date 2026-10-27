"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { submitSiteForm } from "@/lib/submit-site-form";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  message: z.string().trim().min(10, "Message should be at least 10 characters"),
  consent: z.literal(true, { error: "Consent is required" }),
});

export function InquiryForm({
  propertyId,
  propertyTitle,
  formCategory,
}: {
  propertyId: string;
  propertyTitle: string;
  /** Email subject / page category */
  formCategory?: string;
}) {
  const category = formCategory ?? propertyTitle;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setErrors({});
    setSubmitError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      message: String(formData.get("message") ?? ""),
      consent: formData.get("consent") === "on",
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      setStatus("idle");
      return;
    }

    const result = await submitSiteForm(form);
    if (!result.ok) {
      if (result.issues?.length) {
        const next: Record<string, string> = {};
        result.issues.forEach((issue) => {
          next[String(issue.path[0])] = issue.message;
        });
        setErrors(next);
      } else {
        setSubmitError(result.error);
      }
      setStatus("error");
      return;
    }
    setInquiryId(result.inquiryId ?? null);
    setStatus("success");
    form.reset();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="seaps-card space-y-3 rounded-[var(--radius-lg)] p-4"
      noValidate
      data-form-category={category}
    >
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="propertyId" value={propertyId} />
      <input type="hidden" name="propertyTitle" value={propertyTitle} />
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
        <Label htmlFor="inquiry-email">Email</Label>
        <Input
          id="inquiry-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@email.com"
          required
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.email}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="inquiry-phone">Phone (optional)</Label>
        <Input
          id="inquiry-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+855 12 345 678"
        />
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
          {submitError || "Could not send inquiry. Please try again."}
        </p>
      ) : null}
    </form>
  );
}
