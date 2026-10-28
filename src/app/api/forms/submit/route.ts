import { NextResponse } from "next/server";
import {
  contactLineFromForm,
  MAX_FORM_ATTACHMENTS,
  siteFormFieldsSchema,
  validateFormAttachment,
} from "@/lib/form-submission-validation";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { isFormSmtpConfigured, sendFormSubmissionEmail } from "@/lib/smtp-mail";
import { createInquiry } from "@/lib/store";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function collectAttachmentFiles(formData: FormData): File[] {
  const files: File[] = [];
  for (const [key, value] of formData.entries()) {
    if (value instanceof File && value.size > 0) {
      if (key === "attachments" || key === "cv" || key.startsWith("attachment")) {
        files.push(value);
      }
    }
  }
  return files;
}

export async function GET() {
  return NextResponse.json({
    smtpConfigured: isFormSmtpConfigured(),
  });
}

export async function POST(request: Request) {
  const limited = rateLimit(clientKey(request, "form-submit"), {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const website = readField(formData, "website");
  if (website.trim().length > 0) {
    return NextResponse.json({ ok: true, id: "ignored" });
  }

  const consentRaw = readField(formData, "consent");
  const parsed = siteFormFieldsSchema.safeParse({
    category: readField(formData, "category"),
    name: readField(formData, "name"),
    email: readField(formData, "email"),
    message: readField(formData, "message"),
    phone: readField(formData, "phone") || undefined,
    propertyId: readField(formData, "propertyId") || undefined,
    propertyTitle: readField(formData, "propertyTitle") || undefined,
    pageUrl: readField(formData, "pageUrl") || undefined,
    website,
    consent: consentRaw === "on" ? "on" : consentRaw === "true" ? "true" : consentRaw,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const attachmentFiles = collectAttachmentFiles(formData);
  if (attachmentFiles.length > MAX_FORM_ATTACHMENTS) {
    return NextResponse.json({ error: "Too many attachments" }, { status: 400 });
  }

  for (const file of attachmentFiles) {
    const issue = validateFormAttachment(file);
    if (issue) {
      return NextResponse.json({ error: issue }, { status: 400 });
    }
  }

  const buffers = await Promise.all(
    attachmentFiles.map(async (file) => ({
      filename: file.name,
      content: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || undefined,
    })),
  );

  const mailResult = await sendFormSubmissionEmail({
    category: data.category,
    name: data.name,
    email: data.email,
    message: data.message,
    phone: data.phone,
    propertyId: data.propertyId,
    propertyTitle: data.propertyTitle,
    pageUrl: data.pageUrl,
    attachments: buffers,
  });

  if (!mailResult.delivered) {
    const reason = mailResult.reason ?? "delivery_failed";
    const isConfig = reason === "smtp_not_configured";
    if (mailResult.detail) {
      console.error("[forms/submit] SMTP:", mailResult.detail);
    }
    return NextResponse.json(
      {
        error: isConfig
          ? "Email delivery is not configured. Set SMTP_PASS on the server."
          : "Could not send email. Check SMTP credentials and Hostinger mailbox settings.",
        code: reason,
      },
      { status: isConfig ? 503 : 502 },
    );
  }

  const session = await getSession();
  const inquiry = await createInquiry({
    name: data.name,
    contact: contactLineFromForm(data.email, data.phone),
    message: data.message.trim() || "No additional message.",
    propertyId: data.propertyId ?? "site-form",
    propertyTitle: data.category,
    recipientType: "platform",
  });

  return NextResponse.json({
    ok: true,
    inquiry,
    sessionUserId: session?.id ?? null,
  });
}
