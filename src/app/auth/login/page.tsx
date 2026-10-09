"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Sign-in failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-primary)]">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Demo accounts are listed below. Open registration waits for PostgreSQL user persistence.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required defaultValue="buyer@estatenova.demo" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            defaultValue="demo-buyer-123"
          />
        </div>
        {error ? <p className="text-sm text-[var(--color-danger)]">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-mist)] p-4 text-xs text-[var(--color-muted)]">
        <p className="font-semibold text-[var(--color-text)]">Demo logins</p>
        <ul className="mt-2 space-y-1">
          <li>buyer@estatenova.demo / demo-buyer-123</li>
          <li>owner@estatenova.demo / demo-owner-123</li>
          <li>agent@estatenova.demo / demo-agent-123</li>
          <li>admin@estatenova.demo / demo-admin-123</li>
        </ul>
      </div>
      <p className="mt-4 text-sm">
        Need an account notes page?{" "}
        <Link href="/auth/register" className="font-semibold text-[var(--color-accent)]">
          Registration status
        </Link>
      </p>
    </div>
  );
}
