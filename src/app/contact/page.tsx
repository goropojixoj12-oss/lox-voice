"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        contact: form.get("contact"),
        message: form.get("message"),
        propertyId: "contact-page",
        propertyTitle: "General contact",
      }),
    });
    setStatus(res.ok ? "ok" : "error");
    if (res.ok) e.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-accent-soft)]">
        Contact
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Send a message to the platform team. Demo mode stores inquiries locally — no invented phone
        numbers or fake CRM sync.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="contact">Email</Label>
          <Input id="contact" name="contact" type="email" required />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" name="message" required />
        </div>
        <Button type="submit">Send message</Button>
      </form>
      {status === "ok" ? (
        <p className="mt-3 text-sm text-[var(--color-success)]">Message saved in demo storage.</p>
      ) : null}
      {status === "error" ? (
        <p className="mt-3 text-sm text-[var(--color-danger)]">Could not send. Try again shortly.</p>
      ) : null}
    </div>
  );
}
