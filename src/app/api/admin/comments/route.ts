import { NextResponse } from "next/server";
import { z } from "zod";
import type { AdminCommentSubject } from "@/lib/admin-types";
import { createAdminComment, getAdminComments } from "@/lib/admin-store";
import { requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  let subject: AdminCommentSubject | undefined;
  if (type && id) {
    if (!["staff", "listing", "legal_doc", "task"].includes(type)) {
      return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
    }
    subject = { type: type as AdminCommentSubject["type"], id };
  }
  const items = await getAdminComments(subject);
  return NextResponse.json({ items });
}

const createSchema = z.object({
  subject: z.object({
    type: z.enum(["staff", "listing", "legal_doc", "task"]),
    id: z.string().min(1),
  }),
  body: z.string().min(2).max(4000),
});

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid comment" }, { status: 400 });
  }

  const comment = await createAdminComment({
    subject: parsed.data.subject,
    body: parsed.data.body,
    authorUserId: session.id,
    authorName: session.name,
  });
  return NextResponse.json({ comment }, { status: 201 });
}
