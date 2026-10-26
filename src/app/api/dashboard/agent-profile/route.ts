import { NextResponse } from "next/server";
import {
  agentProfileFieldsSchema,
  getAgentProfile,
  saveAgentProfileFields,
} from "@/lib/agent-profile";
import { getAgentDeskActor } from "@/lib/agent-desk-api";

export async function GET() {
  const actor = await getAgentDeskActor();
  if (!actor) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (actor.role !== "agent") {
    return NextResponse.json({ error: "Agent profile only" }, { status: 403 });
  }
  const profile = await getAgentProfile(actor.id, {
    name: actor.name,
    email: actor.email,
  });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const actor = await getAgentDeskActor();
  if (!actor) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (actor.role !== "agent") {
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
  const profile = await saveAgentProfileFields(
    actor.id,
    {
      name: actor.name,
      email: actor.email,
    },
    parsed.data,
  );
  return NextResponse.json({ profile });
}
