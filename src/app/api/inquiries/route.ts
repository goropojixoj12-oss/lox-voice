import { NextResponse } from "next/server";
import { z } from "zod";
import { contactLineFromForm } from "@/lib/form-submission-validation";
import { createInquiry, getInquiries } from "@/lib/store";
import { getSession, requireRole } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { sendFormSubmissionEmail } from "@/lib/smtp-mail";

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().min(1).email(),
  message: z.string().trim().min(10),
  phone: z.string().trim().max(40).optional(),
  category: z.string().trim().min(1).max(120),
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1),
  pageUrl: z.string().trim().max(500).optional(),
  website: z.string().optional(),
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
  if (typeof body?.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json({ inquiry: { id: "ignored" }, sessionUserId: null });
  }

  const category =
    typeof body?.category === "string" && body.category.trim()
      ? body.category.trim()
      : typeof body?.propertyTitle === "string"
        ? body.propertyTitle.trim()
        : "";

  const parsed = schema.safeParse({
    ...body,
    category,
    name: typeof body?.name === "string" ? body.name : "",
    email:
      typeof body?.email === "string"
        ? body.email
        : typeof body?.contact === "string" && body.contact.includes("@")
          ? body.contact
          : "",
    message: typeof body?.message === "string" ? body.message : "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const mailResult = await sendFormSubmissionEmail({
    category: parsed.data.category,
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    phone: parsed.data.phone,
    propertyId: parsed.data.propertyId,
    propertyTitle: parsed.data.propertyTitle,
    pageUrl: parsed.data.pageUrl,
  });

  if (!mailResult.delivered) {
    return NextResponse.json(
      {
        error: "Email delivery is not configured. Set SMTP_PASS on the server.",
        code: mailResult.reason ?? "delivery_failed",
      },
      { status: 503 },
    );
  }

  const session = await getSession();
  const { website: _hp, consent: _consent, email, phone, ...rest } = parsed.data;
  const inquiry = await createInquiry({
    name: rest.name,
    contact: contactLineFromForm(email, phone),
    message: rest.message,
    propertyId: rest.propertyId,
    propertyTitle: rest.category,
    recipientType: "platform",
  });

  return NextResponse.json({ inquiry, sessionUserId: session?.id ?? null });
}
