import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { writeSiteRequestAttachment } from "@/lib/site-agent-attachments";
import { notifySiteAgentWebhook } from "@/lib/site-agent-webhook";
import { assessSiteChangeMessage } from "@/lib/site-change-risk";
import {
  createSiteChangeRequest,
  listSiteChangeRequests,
  setSiteChangeRequestAttachment,
  setSiteChangeRequestSecondAttachment,
} from "@/lib/site-agent-store";

export async function GET() {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await listSiteChangeRequests(30);
  return NextResponse.json({ items });
}

const messageSchema = z
  .string()
  .trim()
  .min(3, "Describe the change in at least a few words.")
  .max(8000);

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const limited = rateLimit(clientKey(request, "site-request"), {
    limit: 12,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many requests. Wait a minute." }, { status: 429 });
  }

  try {
    const form = await request.formData();
    const messageRaw = form.get("message");
    const parsedMessage = messageSchema.safeParse(
      typeof messageRaw === "string" ? messageRaw : "",
    );
    if (!parsedMessage.success) {
      return NextResponse.json(
        { error: parsedMessage.error.issues[0]?.message ?? "Invalid message" },
        { status: 400 },
      );
    }

    let requestRecord = await createSiteChangeRequest({
      message: parsedMessage.data,
      scope: "ui_auth",
      createdByUserId: session.id,
      createdByName: session.name,
      attachment: null,
    });

    const fileEntry = form.get("file");
    if (fileEntry instanceof File && fileEntry.size > 0) {
      try {
        const stored = await writeSiteRequestAttachment(requestRecord.id, fileEntry);
        const updated = await setSiteChangeRequestAttachment(requestRecord.id, {
          fileName: stored.fileName,
          storageKey: stored.storageKey,
          contentType: stored.contentType,
          sizeBytes: stored.sizeBytes,
        });
        if (updated) requestRecord = updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Attachment failed";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    const file2Entry = form.get("file2");
    if (file2Entry instanceof File && file2Entry.size > 0) {
      try {
        const stored = await writeSiteRequestAttachment(`${requestRecord.id}-2`, file2Entry);
        const updated = await setSiteChangeRequestSecondAttachment(requestRecord.id, {
          fileName: stored.fileName,
          storageKey: stored.storageKey,
          contentType: stored.contentType,
          sizeBytes: stored.sizeBytes,
        });
        if (updated) requestRecord = updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Second attachment failed";
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    notifySiteAgentWebhook(requestRecord);
    const risk = assessSiteChangeMessage(parsedMessage.data);
    return NextResponse.json(
      { request: requestRecord, riskLevel: risk.level, riskTopics: risk.topics },
      { status: 201 },
    );
  } catch (error) {
    console.error("[admin/site-requests] POST failed", error);
    return NextResponse.json(
      {
        error:
          "Could not save your request. Site storage may be misconfigured (check Blob/KV on the server).",
      },
      { status: 503 },
    );
  }
}
