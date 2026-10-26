import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ANALYTICS_COOKIE_MAX_AGE,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics-session";
import { hasAuthenticatedSessionCookie } from "@/lib/auth";
import { getAllProperties } from "@/lib/catalog";
import { isPublicListing } from "@/lib/listing-access";
import { recordUniqueListingView } from "@/lib/listing-view-store";

export const runtime = "nodejs";

const schema = z.object({
  listingId: z.string().min(1).max(128),
  sessionKey: z.string().min(1).max(64),
});

export async function POST(request: Request) {
  if (hasAuthenticatedSessionCookie(request.headers.get("cookie"))) {
    return NextResponse.json({ ok: true, skipped: "signed_in" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const all = await getAllProperties();
  const listing = all.find((p) => p.id === parsed.data.listingId);
  if (!listing || !isPublicListing(listing)) {
    return NextResponse.json({ ok: true });
  }

  let sessionKey = parsed.data.sessionKey;
  const cookieSid = request.headers
    .get("cookie")
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${ANALYTICS_SESSION_COOKIE}=`))
    ?.slice(ANALYTICS_SESSION_COOKIE.length + 1);
  if (cookieSid && cookieSid.length >= 8) {
    sessionKey = decodeURIComponent(cookieSid);
  }

  try {
    const views = await recordUniqueListingView(listing.id, sessionKey);
    const res = NextResponse.json({ ok: true, views });
    res.cookies.set(ANALYTICS_SESSION_COOKIE, sessionKey, {
      path: "/",
      maxAge: ANALYTICS_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (error) {
    console.error("[analytics/listing-view] persist failed", error);
    return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });
  }
}
