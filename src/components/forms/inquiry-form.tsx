"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  contact: z.string().min(5, "Provide an email or phone"),
  message: z.string().min(10, "Message should be at least 10 characters"),
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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrors({});
    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      contact: String(form.get("contact") ?? ""),
      message: String(form.get("message") ?? ""),
      propertyId,
      propertyTitle,
    };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        next[issue.path[0] as string] = issue.message;
      });
      setErrors(next);
      setStatus("idle");
      return;
    }

    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setStatus("error");
      return;
    }
    setStatus("success");
    e.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div>
        <h3 className="font-semibold text-[var(--color-primary)]">Request information</h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Send a viewing or details request. No phone numbers are invented on this page.
        </p>
      </div>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" autoComplete="name" required />
        {errors.name ? <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.name}</p> : null}
      </div>
      <div>
        <Label htmlFor="contact">Email or phone</Label>
        <Input id="contact" name="contact" autoComplete="email" required />
        {errors.contact ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.contact}</p>
        ) : null}
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          name="message"
          defaultValue={`I am interested in ${propertyTitle}. Please share next steps for a viewing.`}
          required
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-[var(--color-danger)]">{errors.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send inquiry"}
      </Button>
      {status === "success" ? (
        <p className="text-sm text-[var(--color-success)]" role="status">
          Inquiry saved. In demo mode it is stored locally for the recipient inbox.
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
