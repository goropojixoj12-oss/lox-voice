"use client";

import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters)")
    .max(80, "Name is too long")
    .regex(/^[\p{L}\p{M}\s'.-]+$/u, "Use letters and standard name characters only"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15) return false;
      return /^[\d\s+().-]+$/.test(value);
    }, "Enter a valid phone number (8–15 digits, optional + country code)"),
  message: z
    .string()
    .trim()
    .min(10, "Message should be at least 10 characters")
    .max(2000, "Message is too long (max 2000 characters)"),
});

type ContactUsModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ContactUsModal({ open, onClose }: ContactUsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setSubmitted(false);
      setErrors({});
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      message: String(form.get("message") ?? ""),
    };
    const parsed = contactSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitted(true);
    e.currentTarget.reset();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className={cn(
        "seaps-contact-dialog fixed inset-0 z-[100] m-0 h-dvh max-h-none w-full max-w-none",
        "border-0 bg-transparent p-4 backdrop:bg-[rgba(7,17,31,0.72)] backdrop:backdrop-blur-sm",
      )}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) handleClose();
      }}
    >
      <div
        className="seaps-card mx-auto mt-[min(8vh,4rem)] w-full max-w-lg rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-lift)] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              SEAPS
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]"
            >
              Contact Us
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Send a message to our team. We will respond using the details you provide.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-soft)]"
            aria-label="Close contact form"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="mt-8 rounded-[var(--radius-md)] border border-[rgba(212,175,55,0.45)] bg-[var(--color-primary-soft)]/40 p-5">
            <p className="font-semibold text-[var(--color-accent-soft)]">Thank you</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              Thank you for reaching out to SEAPS. Our team will follow up using the phone number you
              provided.
            </p>
            <Button type="button" variant="accent" className="mt-5" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <Label htmlFor="seaps-contact-name">Name</Label>
              <Input
                id="seaps-contact-name"
                name="name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "seaps-contact-name-error" : undefined}
              />
              {errors.name ? (
                <p id="seaps-contact-name-error" className="mt-1 text-sm text-[var(--color-danger)]">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="seaps-contact-phone">Phone</Label>
              <Input
                id="seaps-contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+855 12 345 678"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "seaps-contact-phone-error" : undefined}
              />
              {errors.phone ? (
                <p id="seaps-contact-phone-error" className="mt-1 text-sm text-[var(--color-danger)]">
                  {errors.phone}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="seaps-contact-message">Message</Label>
              <Textarea
                id="seaps-contact-message"
                name="message"
                rows={5}
                placeholder="How can we help with your property goals?"
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "seaps-contact-message-error" : undefined}
              />
              {errors.message ? (
                <p
                  id="seaps-contact-message-error"
                  className="mt-1 text-sm text-[var(--color-danger)]"
                >
                  {errors.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" variant="accent" className="w-full sm:w-auto">
              Send message
            </Button>
          </form>
        )}
      </div>
    </dialog>
  );
}
