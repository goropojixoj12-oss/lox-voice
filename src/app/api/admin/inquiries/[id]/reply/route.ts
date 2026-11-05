import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { getInquiries, updateInquiry } from "@/lib/store";
import { sendInquiryReplyEmail } from "@/lib/smtp-mail";

const replySchema = z.object({
  message: z.string().trim().min(3).max(5000),
  subject: z.string().trim().min(1).max(200).optional(),
});

const emailInContact = (contact: string) => {
  const match = contact.match(/[^\s·]+@[^\s·]+\.[^\s·]+/);
  return match ? match[0] : null;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireRole(["agent", "owner", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = (await params).id;

  const body = await request.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const inquiries = await getInquiries();
  const inquiry = inquiries.find((i) => i.id === id);
  if (!inquiry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const toEmail = emailInContact(inquiry.contact);
  if (!toEmail) {
    return NextResponse.json(
      { error: "No email address on the incoming inquiry" },
      { status: 422 },
    );
  }

  const result = await sendInquiryReplyEmail({
    toName: inquiry.name,
    toEmail,
    subject: parsed.data.subject || `Re: ${inquiry.propertyTitle}`,
    replyBody: parsed.data.message,
    originalMessage: inquiry.message,
    propertyTitle: inquiry.propertyTitle,
  });

  const updated = await updateInquiry(id, { status: "in_progress" });

  if (!result.delivered) {
    const reason = result.reason ?? "delivery_failed";
    const isConfig = reason === "smtp_not_configured";
    if (result.detail) console.error("[inquiry-reply] SMTP:", result.detail);
    return NextResponse.json(
      {
        error: isConfig
          ? "Email delivery is not configured. Set SMTP_PASS on the server."
          : "Could not send the reply. Check SMTP credentials.",
        code: reason,
        updated,
      },
      { status: isConfig ? 503 : 502 },
    );
  }

  return NextResponse.json({ ok: true, inquiryId: id, updated });
}
