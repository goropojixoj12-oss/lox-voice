import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ANALYTICS_COOKIE_MAX_AGE,
  ANALYTICS_SESSION_COOKIE,
  isAutomatedAnalyticsUserAgent,
  readAnalyticsSessionCookie,
} from "@/lib/analytics-session";
import { isAnalyticsPath } from "@/lib/analytics-paths";
import { appendPageView } from "@/lib/admin-store";

export const runtime = "nodejs";

const schema = z.object({
  path: z.string().min(1).max(512),
  sessionKey: z.string().min(1).max(64),
  referrer: z.string().max(512).optional(),
});

export async function POST(request: Request) {
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
  if (!isAnalyticsPath(parsed.data.path)) {
    return NextResponse.json({ ok: true });
  }

  if (isAutomatedAnalyticsUserAgent(request.headers.get("user-agent"))) {
    return NextResponse.json({ ok: true });
  }
  const sessionKey = readAnalyticsSessionCookie(request.headers.get("cookie"));
  if (!sessionKey) return NextResponse.json({ ok: true });

  try {
    await appendPageView({
      path: parsed.data.path,
      sessionKey,
      referrer: parsed.data.referrer,
    });
  } catch (error) {
    console.error("[analytics/pageview] persist failed", error);
    return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ANALYTICS_SESSION_COOKIE, sessionKey, {
    path: "/",
    maxAge: ANALYTICS_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
