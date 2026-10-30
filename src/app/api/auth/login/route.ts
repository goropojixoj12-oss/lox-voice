import { NextResponse } from "next/server";
import { z } from "zod";
import { extractClientInfo, writeAuditEntry } from "@/lib/audit-log";
import { login } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "login"), {
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid credentials payload" }, { status: 400 });
  }

  const { ip, userAgent } = extractClientInfo(request);
  const result = await login(parsed.data.email, parsed.data.password);

  writeAuditEntry({
    action: result.ok ? "login_success" : "login_failed",
    userId: result.ok ? result.user.id : null,
    userName: result.ok ? result.user.name : null,
    email: parsed.data.email,
    ip,
    userAgent,
    meta: { role: result.ok ? result.user.role : "unknown" },
  }).catch((err) => console.error("[audit] login log failed", err));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ user: result.user });
}
