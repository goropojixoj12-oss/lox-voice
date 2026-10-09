import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry, getInquiries } from "@/lib/store";
import { getSession, requireRole } from "@/lib/auth";

const schema = z.object({
  name: z.string().min(2),
  contact: z.string().min(5),
  message: z.string().min(10),
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1),
});

const rateMap = new Map<string, number>();

export async function GET() {
  const session = await requireRole(["agent", "owner", "admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const inquiries = await getInquiries();
  return NextResponse.json({ inquiries });
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const last = rateMap.get(ip) ?? 0;
  if (now - last < 3000) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  rateMap.set(ip, now);

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const session = await getSession();
  const inquiry = await createInquiry({
    ...parsed.data,
    recipientType: "platform",
  });

  return NextResponse.json({ inquiry, sessionUserId: session?.id ?? null });
}
