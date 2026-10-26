import { NextResponse } from "next/server";
import { getAgentDeskUser } from "@/lib/admin-agent-manage";
import { getSession } from "@/lib/auth";

export async function GET() {
  const operator = await getSession();
  if (!operator) {
    return NextResponse.json({ user: null, operator: null });
  }
  const deskUser = (await getAgentDeskUser(operator)) ?? operator;
  return NextResponse.json({ user: deskUser, operator });
}
