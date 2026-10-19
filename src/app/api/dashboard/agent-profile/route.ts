import { NextResponse } from "next/server";
import {
  agentProfileFieldsSchema,
  getAgentProfile,
  saveAgentProfileFields,
} from "@/lib/agent-profile";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (session.role !== "agent" && session.role !== "admin") {
    return NextResponse.json({ error: "Agent profile only" }, { status: 403 });
  }
  const profile = await getAgentProfile(session.id, {
    name: session.name,
    email: session.email,
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (session.role !== "agent" && session.role !== "admin") {
    return NextResponse.json({ error: "Agent profile only" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = agentProfileFieldsSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid profile data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const profile = await saveAgentProfileFields(session.id, {
    name: session.name,
    email: session.email,
  }, parsed.data);
  return NextResponse.json({ profile });
}
