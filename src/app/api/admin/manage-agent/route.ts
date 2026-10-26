import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearManagedAgentUserId,
  setManagedAgentUserId,
} from "@/lib/admin-agent-manage";
import { getSession, requireRole } from "@/lib/auth";
import { canManageAgentDesk } from "@/lib/platform-roles";

const bodySchema = z.object({
  userId: z.string().min(1).optional(),
  action: z.enum(["start", "stop"]).optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["god", "admin"]);
  if (!session || !canManageAgentDesk(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (parsed.data.action === "stop" || !parsed.data.userId) {
    await clearManagedAgentUserId();
    return NextResponse.json({ ok: true, redirect: "/dashboard/admin/staff" });
  }

  const ok = await setManagedAgentUserId(parsed.data.userId);
  if (!ok) {
    return NextResponse.json({ error: "Unknown or non-agent account" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    redirect: "/dashboard/agent/overview",
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session || !canManageAgentDesk(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await clearManagedAgentUserId();
  return NextResponse.json({ ok: true });
}
