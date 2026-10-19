import { NextResponse } from "next/server";
import { z } from "zod";
import { appendPageView } from "@/lib/admin-store";

const schema = z.object({
  path: z.string().min(1).max(512),
  sessionKey: z.string().min(1).max(64),
  referrer: z.string().max(512).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  if (parsed.data.path.startsWith("/api")) {
    return NextResponse.json({ ok: true });
  }
  await appendPageView(parsed.data);
  return NextResponse.json({ ok: true });
}
