import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getFavorites, toggleFavorite } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ids: [], mode: "guest" });
  }
  const ids = await getFavorites(session.id);
  return NextResponse.json({ ids, mode: "user" });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to sync favorites" }, { status: 401 });
  }
  const body = (await request.json()) as { propertyId?: string };
  if (!body.propertyId) {
    return NextResponse.json({ error: "propertyId required" }, { status: 400 });
  }
  const ids = await toggleFavorite(session.id, body.propertyId);
  return NextResponse.json({ ids });
}
