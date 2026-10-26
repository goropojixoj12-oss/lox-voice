import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  ANALYTICS_COOKIE_MAX_AGE,
  ANALYTICS_SESSION_COOKIE,
} from "@/lib/analytics-session";
import { isAnalyticsPath, isDocumentNavigation } from "@/lib/analytics-paths";

const SESSION_COOKIE = "en_session";

/** Edge-safe: signed session cookies use payload.signature (not legacy JSON). */
function hasSignedInSessionCookie(request: NextRequest): boolean {
  const raw = request.cookies.get(SESSION_COOKIE)?.value?.trim();
  if (!raw || raw.startsWith("{")) return false;
  const dot = raw.lastIndexOf(".");
  return dot > 0 && dot < raw.length - 1;
}

function analyticsSessionId(request: NextRequest): string {
  const existing = request.cookies.get(ANALYTICS_SESSION_COOKIE)?.value?.trim();
  if (existing && existing.length >= 8 && existing.length <= 64) return existing;
  return crypto.randomUUID();
}

function recordPageViewAsync(
  event: NextFetchEvent,
  request: NextRequest,
  pathname: string,
  sessionKey: string,
) {
  const url = new URL("/api/analytics/pageview", request.url);
  const body = JSON.stringify({
    path: pathname,
    sessionKey,
    referrer: request.headers.get("referer") ?? undefined,
    source: "server",
  });

  event.waitUntil(
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: request.headers.get("cookie") ?? "",
      },
      body,
    }).catch(() => undefined),
  );
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (pathname === "/dashboard/agent/list-property") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/agent/list-property/step1";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  if (
    request.method === "GET" &&
    isAnalyticsPath(pathname) &&
    isDocumentNavigation(request) &&
    request.headers.get("purpose") !== "prefetch" &&
    !request.headers.get("next-router-prefetch") &&
    !hasSignedInSessionCookie(request)
  ) {
    const sessionKey = analyticsSessionId(request);
    response.cookies.set(ANALYTICS_SESSION_COOKIE, sessionKey, {
      path: "/",
      maxAge: ANALYTICS_COOKIE_MAX_AGE,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
    recordPageViewAsync(event, request, pathname, sessionKey);
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
