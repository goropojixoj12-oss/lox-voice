import { NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import {
  createRegisteredAgent,
  updatePlatformUser,
  getAllPlatformUsers,
} from "@/lib/platform-users-store";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const patchSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  suspended: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const result = await createRegisteredAgent(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { passwordHash: _passwordHash, ...safeUser } = result.user;
  return NextResponse.json({ user: safeUser }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 },
    );
  }

  const { userId, ...fields } = parsed.data;
  if (userId === session.id) {
    return NextResponse.json({ error: "Cannot modify admin account via this endpoint." }, { status: 403 });
  }

  const result = await updatePlatformUser(userId, fields);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { passwordHash: _passwordHash, ...safeUser } = result.user;
  return NextResponse.json({ user: safeUser });
}

export async function GET(request: Request) {
  const session = await requireRole(["admin"]);
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const all = await getAllPlatformUsers();
  const filtered = role ? all.filter((u) => u.role === role) : all;

  return NextResponse.json({
    users: filtered.map(({ passwordHash: _ph, ...u }) => u),
  });
}
