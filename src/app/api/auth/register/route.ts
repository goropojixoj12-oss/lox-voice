import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["buyer", "owner", "agent"]),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "Demo mode uses fixed seed accounts. Connect PostgreSQL + Prisma user persistence to enable open registration.",
      demoAccounts: [
        "buyer@estatenova.demo",
        "owner@estatenova.demo",
        "agent@estatenova.demo",
        "admin@estatenova.demo",
      ],
    },
    { status: 501 },
  );
}
