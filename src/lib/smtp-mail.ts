import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

export type FormMailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type FormSubmissionMailInput = {
  category: string;
  name: string;
  email: string;
  message: string;
  phone?: string;
  propertyId?: string;
  propertyTitle?: string;
  pageUrl?: string;
  attachments?: FormMailAttachment[];
};

export function isFormSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_PASS?.trim());
}

function smtpConfigured(): boolean {
  return isFormSmtpConfigured();
}

export function getDefaultFormMailFrom(): string {
  return process.env.SMTP_FROM?.trim() || "internal@seaps.asia";
}

export function getDefaultFormMailTo(): string {
  return process.env.SMTP_TO?.trim() || "ceo@seaps.asia";
}

function createTransport() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT?.trim() || "465");
  const user = process.env.SMTP_USER?.trim() || "internal@seaps.asia";
  const pass = process.env.SMTP_PASS?.trim();

  if (!pass) {
    throw new Error("SMTP_PASS is not configured");
  }

  const secure =
    process.env.SMTP_SECURE?.trim() === "false" ? false : port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
    // Hostinger + some serverless hosts: prefer IPv4 for SMTP
    ...(process.env.SMTP_FORCE_IPV4 === "true" ? { family: 4 as const } : {}),
    tls: {
      minVersion: "TLSv1.2",
    },
  });
}

function buildTextBody(input: FormSubmissionMailInput): string {
  const lines = [
    `Category: ${input.category}`,
    `Name: ${input.name}`,
    `Email: ${input.email}`,
  ];
  if (input.phone?.trim()) {
    lines.push(`Phone: ${input.phone.trim()}`);
  }
  if (input.propertyId?.trim()) {
    lines.push(`Reference ID: ${input.propertyId.trim()}`);
  }
  if (input.propertyTitle?.trim()) {
    lines.push(`Context: ${input.propertyTitle.trim()}`);
  }
  if (input.pageUrl?.trim()) {
    lines.push(`Page: ${input.pageUrl.trim()}`);
  }
  lines.push("", "Message:", input.message.trim());
  return lines.join("\n");
}

export async function sendFormSubmissionEmail(
  input: FormSubmissionMailInput,
): Promise<{ delivered: boolean; reason?: string; detail?: string }> {
  if (!smtpConfigured()) {
    return { delivered: false, reason: "smtp_not_configured" };
  }

  const from = getDefaultFormMailFrom();
  const to = getDefaultFormMailTo();
  const subject = input.category.trim().slice(0, 200);

  const mailAttachments: Mail.Attachment[] | undefined = input.attachments?.length
    ? input.attachments.map((file) => ({
        filename: file.filename,
        content: file.content,
        contentType: file.contentType,
      }))
    : undefined;

  const fromHeader =
    from.includes("<") ? from : `SEAPS website forms <${from}>`;

  try {
    const transport = createTransport();
    await transport.sendMail({
      from: fromHeader,
      to,
      replyTo: input.email.trim(),
      subject,
      text: buildTextBody(input),
      attachments: mailAttachments,
    });
    return { delivered: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[smtp-mail] send failed:", message);
    return { delivered: false, reason: "smtp_send_failed", detail: message };
  }
}
