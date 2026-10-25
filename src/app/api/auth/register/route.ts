import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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
        "Open registration will be enabled with full user persistence. Use current SEAPS access accounts meanwhile.",
      accessAccounts: [
        "buyer@seaps.com.kh",
        "owner@seaps.com.kh",
        "agent@seaps.com.kh",
        "ceo@seaps.asia",
      ],
    },
    { status: 501 },
  );
}
