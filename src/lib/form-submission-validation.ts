import { z } from "zod";

export const MAX_FORM_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_FORM_ATTACHMENTS = 5;

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const siteFormFieldsSchema = z.object({
  category: z.string().trim().min(1, "Category is required").max(120),
  name: z.string().trim().min(2, "Name is required").max(80),
  email: emailField,
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(8000),
  phone: z.string().trim().max(40).optional(),
  propertyId: z.string().trim().max(120).optional(),
  propertyTitle: z.string().trim().max(200).optional(),
  pageUrl: z.string().trim().max(500).optional(),
  website: z.string().optional(),
  consent: z.union([z.literal("true"), z.literal("on"), z.literal("1")]),
});

export type SiteFormFields = z.infer<typeof siteFormFieldsSchema>;

export function contactLineFromForm(email: string, phone?: string): string {
  const parts = [email.trim()];
  if (phone?.trim()) {
    parts.push(phone.trim());
  }
  return parts.join(" · ");
}

const allowedAttachmentExt = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".webp"];
const allowedAttachmentMime = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/octet-stream",
]);

export function validateFormAttachment(file: File): string | null {
  if (!file.size) {
    return "Empty attachment";
  }
  if (file.size > MAX_FORM_ATTACHMENT_BYTES) {
    return "Attachment exceeds 5 MB limit";
  }
  const lower = file.name.toLowerCase();
  const extOk = allowedAttachmentExt.some((ext) => lower.endsWith(ext));
  if (!extOk) {
    return "Unsupported attachment type";
  }
  if (file.type && !allowedAttachmentMime.has(file.type)) {
    return "Unsupported attachment type";
  }
  return null;
}
