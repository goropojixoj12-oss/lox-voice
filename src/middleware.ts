import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ANALYTICS_COOKIE_MAX_AGE,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics-session";
import { isAnalyticsPath, isDocumentNavigation } from "@/lib/analytics-paths";

function analyticsSessionId(request: NextRequest): string {
  const existing = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value?.trim();
  if (existing && existing.length >= 8 && existing.length <= 64) return existing;
  return crypto.randomUUID();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/agent/list-property") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/agent/list-property/step1";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // The middleware only owns the visitor identity. `PageViewBeacon` is the single
  // writer of page views — recording here as well counted every hard navigation twice.
  if (
    request.method === "GET" &&
    isAnalyticsPath(pathname) &&
    isDocumentNavigation(request) &&
    request.headers.get("purpose") !== "prefetch" &&
    !request.headers.get("next-router-prefetch")
  ) {
    response.cookies.set(ANALYTICS_SESSION_COOKIE, analyticsSessionId(request), {
      path: "/",
      maxAge: ANALYTICS_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/agent/list-property",
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|media|videos|brand|fonts|scripts).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
