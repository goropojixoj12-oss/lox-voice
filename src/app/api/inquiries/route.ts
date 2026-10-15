import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry, getInquiries } from "@/lib/store";
import { getSession, requireRole } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2),
  contact: z.string().min(5),
  message: z.string().min(10),
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1),
  website: z.string().optional(), // honeypot
  consent: z.literal(true),
});

export async function GET() {
  const session = await requireRole(["agent", "owner", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const inquiries = await getInquiries();
  return NextResponse.json({ inquiries });
}

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "inquiry"), {
    limit: 8,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const body = await request.json();
  // Honeypot filled → pretend success
  if (typeof body?.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ inquiry: { id: "ignored" }, sessionUserId: null });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const session = await getSession();
  const { website: _hp, consent: _consent, ...data } = parsed.data;
  const inquiry = await createInquiry({
    ...data,
    recipientType: "platform",
  });

  return NextResponse.json({ inquiry, sessionUserId: session?.id ?? null });
}
