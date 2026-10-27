import { NextResponse } from "next/server";
import { z } from "zod";
import { updateAdminTaskStatus } from "@/lib/admin-store";
import { requireRole } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["open", "in_progress", "done"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const task = await updateAdminTaskStatus(id, parsed.data.status);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ task });
}
