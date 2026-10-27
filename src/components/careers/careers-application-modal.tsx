"use client";

import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { submitSiteForm } from "@/lib/submit-site-form";
import { cn } from "@/lib/utils";

const FORM_CATEGORY = "Careers — Employment application";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const CV_EXTENSIONS = [".pdf", ".doc", ".docx"];
const CV_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const applicationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters)")
    .max(80, "Name is too long")
    .regex(/^[\p{L}\p{M}\s'.-]+$/u, "Use letters and standard name characters only"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        if (digits.length < 8 || digits.length > 15) return false;
        return /^[\d\s+().-]+$/.test(value);
      },
      { message: "Enter a valid phone number (8–15 digits, optional + country code)" },
    ),
  introduction: z
    .string()
    .trim()
    .min(10, "Introduction should be at least 10 characters")
    .max(2000, "Introduction is too long (max 2000 characters)"),
});

function validateCvFile(file: File | null): string | null {
  if (!file || file.size === 0) {
    return "Please attach your CV (PDF or Word, max 5 MB)";
  }
  if (file.size > MAX_CV_BYTES) {
    return "CV file is too large (maximum 5 MB)";
  }
  const lower = file.name.toLowerCase();
  const extOk = CV_EXTENSIONS.some((ext) => lower.endsWith(ext));
  if (!extOk) {
    return "CV must be a PDF or Word document (.pdf, .doc, .docx)";
  }
  if (file.type && !CV_MIME_TYPES.has(file.type) && file.type !== "application/octet-stream") {
    return "CV must be a PDF or Word document (.pdf, .doc, .docx)";
  }
  return null;
}

type CareersApplicationModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CareersApplicationModal({ open, onClose }: CareersApplicationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [cvLabel, setCvLabel] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      setSubmitted(false);
      setErrors({});
      setCvLabel(null);
      setSubmitError("");
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    dialogRef.current?.close();
    onClose();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const cv = formData.get("cv");
    const cvFile = cv instanceof File ? cv : null;

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      introduction: String(formData.get("message") ?? ""),
    };
    const parsed = applicationSchema.safeParse(payload);
    const next: Record<string, string> = {};

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        next[String(issue.path[0])] = issue.message;
      });
    }

    const cvError = validateCvFile(cvFile);
    if (cvError) {
      next.cv = cvError;
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setSubmitError("");
    setSubmitting(true);
    const result = await submitSiteForm(form);
    setSubmitting(false);

    if (!result.ok) {
      if (result.issues?.length) {
        const mapped: Record<string, string> = {};
        result.issues.forEach((issue) => {
          const key = String(issue.path[0]);
          mapped[key === "message" ? "introduction" : key] = issue.message;
        });
        setErrors(mapped);
      } else {
        setSubmitError(result.error);
      }
      return;
    }

    setSubmitted(true);
    form.reset();
    setCvLabel(null);
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
        className="seaps-card mx-auto mt-[min(6vh,3rem)] max-h-[min(92dvh,52rem)] w-full max-w-lg overflow-y-auto rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-lift)] md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
              SEAPS Careers
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--color-accent-soft)]"
            >
              Employment application
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">
              Submit your expression of interest to join South East Asia Property Services. Attach
              your CV and include a brief introduction covering your experience, skills, areas of
              expertise and career aspirations. Our HR and leadership team will review applications
              as suitable roles become available across Cambodia and the wider region.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent-soft)]"
            aria-label="Close application form"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="mt-8 rounded-[var(--radius-md)] border border-[rgba(212,175,55,0.45)] bg-[var(--color-primary-soft)]/40 p-5">
            <p className="font-semibold text-[var(--color-accent-soft)]">Application received</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">
              Thank you for your interest in SEAPS. We have recorded your details and CV submission.
              Our team will contact you using the email address you provided if your profile matches
              an upcoming opportunity.
            </p>
            <Button type="button" variant="accent" className="mt-5" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-4"
            noValidate
            encType="multipart/form-data"
            data-form-category={FORM_CATEGORY}
          >
            <input type="hidden" name="category" value={FORM_CATEGORY} />
            <input type="hidden" name="propertyId" value="careers-application" />
            <input type="hidden" name="propertyTitle" value="Careers application" />
            <input type="hidden" name="consent" value="true" />
            <div>
              <Label htmlFor="seaps-careers-name">Full name</Label>
              <Input
                id="seaps-careers-name"
                name="name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "seaps-careers-name-error" : undefined}
              />
              {errors.name ? (
                <p id="seaps-careers-name-error" className="mt-1 text-sm text-[var(--color-danger)]">
                  {errors.name}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="seaps-careers-email">Email</Label>
              <Input
                id="seaps-careers-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@email.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "seaps-careers-email-error" : undefined}
              />
              {errors.email ? (
                <p id="seaps-careers-email-error" className="mt-1 text-sm text-[var(--color-danger)]">
                  {errors.email}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="seaps-careers-phone">Phone (optional)</Label>
              <Input
                id="seaps-careers-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+855 12 345 678"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "seaps-careers-phone-error" : undefined}
              />
              {errors.phone ? (
                <p id="seaps-careers-phone-error" className="mt-1 text-sm text-[var(--color-danger)]">
                  {errors.phone}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="seaps-careers-introduction">Brief introduction</Label>
              <Textarea
                id="seaps-careers-introduction"
                name="message"
                rows={5}
                placeholder="Outline your experience, skills, areas of expertise and career aspirations…"
                aria-invalid={Boolean(errors.introduction)}
                aria-describedby={
                  errors.introduction ? "seaps-careers-introduction-error" : "seaps-careers-intro-hint"
                }
              />
              <p id="seaps-careers-intro-hint" className="mt-1 text-xs text-[var(--color-muted)]">
                Same detail you would include in a covering email when sending your CV.
              </p>
              {errors.introduction ? (
                <p
                  id="seaps-careers-introduction-error"
                  className="mt-1 text-sm text-[var(--color-danger)]"
                >
                  {errors.introduction}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="seaps-careers-cv">CV / résumé</Label>
              <Input
                id="seaps-careers-cv"
                name="cv"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="cursor-pointer file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-mist)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-accent-soft)]"
                aria-invalid={Boolean(errors.cv)}
                aria-describedby={errors.cv ? "seaps-careers-cv-error" : "seaps-careers-cv-hint"}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setCvLabel(file?.name ?? null);
                }}
              />
              <p id="seaps-careers-cv-hint" className="mt-1 text-xs text-[var(--color-muted)]">
                PDF or Word · max 5 MB{cvLabel ? ` · selected: ${cvLabel}` : ""}
              </p>
              {errors.cv ? (
                <p id="seaps-careers-cv-error" className="mt-1 text-sm text-[var(--color-danger)]">
                  {errors.cv}
                </p>
              ) : null}
            </div>
            {submitError ? (
              <p className="text-sm text-[var(--color-danger)]" role="alert">
                {submitError}
              </p>
            ) : null}
            <Button type="submit" variant="accent" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? "Sending…" : "Submit application"}
            </Button>
          </form>
        )}
      </div>
    </dialog>
  );
}
