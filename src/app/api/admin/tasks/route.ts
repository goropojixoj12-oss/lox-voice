import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminTask, getAdminTasks } from "@/lib/admin-store";
import { requireRole } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const staffId = new URL(request.url).searchParams.get("staffId");
  let items = await getAdminTasks();
  if (staffId) items = items.filter((t) => t.assigneeStaffId === staffId);
  return NextResponse.json({ items });
}

const createSchema = z.object({
  assigneeStaffId: z.string().min(1),
  title: z.string().min(3).max(200),
  body: z.string().max(4000).optional(),
  dueDate: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  }

  const task = await createAdminTask({
    assigneeStaffId: parsed.data.assigneeStaffId,
    title: parsed.data.title,
    body: parsed.data.body?.trim() ?? "",
    dueDate: parsed.data.dueDate ?? null,
    createdByUserId: session.id,
  });
  return NextResponse.json({ task }, { status: 201 });
}
